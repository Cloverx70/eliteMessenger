"use client";

import {
  DirectDeliveredAck,
  DirectSentAck,
  useSocket,
} from "@/app/hooks/useSocket";
import { GetChatroomAndMesseges, IMessage } from "../action";
import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { BsThreeDotsVertical } from "react-icons/bs";
import { CiSearch } from "react-icons/ci";
import { IUser } from "@/app/auth/actions";
import Image from "next/image";
import Message from "./Message";
import { ScrollArea } from "@/components/ui/scroll-area";
import SendInput from "./SendInput";
import Spinner from "@/app/components/spinner";
import { UsersRound } from "lucide-react";
import { useChatStore } from "@/app/stores/ChatStore";
import { useParams } from "next/navigation";

type RoomChatProps = {
  user: IUser;
};

const RoomChat = ({ user }: RoomChatProps) => {
  const { cid } = useParams();
  const client = useQueryClient();
  const safeCid: string = Array.isArray(cid) ? cid[0] : (cid ?? "");

  const clearUnread = useChatStore((state) => state.clearUnread);

  useEffect(() => {
    if (safeCid) {
      clearUnread(safeCid);
    }
  }, [safeCid]);

  const {
    joinRoom,
    leaveRoom,
    onMessage,
    offMessage,
    onSentACK,
    onDeliveredACK,
    onSeenACK,
    messageSeen,
    socketRef,
  } = useSocket(user.id);

  client.invalidateQueries({ queryKey: ["CHATROOMINFO"] });

  const {
    data: ChatroomAndMessages,
    isLoading,
    isPending,
  } = useQuery({
    queryKey: ["CHATROOMANDMESSAGES", safeCid],
    queryFn: async () => await GetChatroomAndMesseges(safeCid, 1000, 1),
  });

  const [messages, setMessages] = useState<IMessage[]>(
    ChatroomAndMessages?.chatRoomMessages || [],
  );

  useEffect(() => {
    if (ChatroomAndMessages?.chatRoomMessages) {
      setMessages(ChatroomAndMessages.chatRoomMessages);
    }
  }, [ChatroomAndMessages]);

  // handle room joi n/leave
  useEffect(() => {
    if (!safeCid) return;

    joinRoom(safeCid, user.id);
    return () => {
      leaveRoom(safeCid, user.id);
    };
  }, [safeCid, joinRoom, leaveRoom, user.id]);

  // handle room Seen Messages
  useEffect(() => {
    if (!safeCid || !ChatroomAndMessages?.chatRoomMessages) return;

    messageSeen(safeCid, user.id);
  }, [safeCid, ChatroomAndMessages, user.id]);

  // handle send new messages
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleSentACK = (ack: DirectSentAck) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === ack.tempId ? { ...m, status: "sent" } : m)),
      );

      client.invalidateQueries({ queryKey: ["CHATROOMS"] });
    };

    const handleNewMessage = (msg: IMessage) => {
      if (msg.sid === user.id) return;

      if (msg.chatroomId !== safeCid) return;

      setMessages((prev) => {
        const exists = prev.some(
          (m) => m.id === msg.id || m.tempId === msg.tempId,
        );

        if (exists) {
          return prev.map((m) =>
            m.id === msg.tempId || m.id === msg.id ? { ...m, ...msg } : m,
          );
        }

        return [...prev, msg];
      });

      messageSeen(safeCid, user.id);
    };

    const handleDeliveredACK = (ack: DirectDeliveredAck) => {
      setMessages((prev) =>
        prev.map((m) => {
          return m.id === ack.tempId ? { ...m, status: "delivered" } : m;
        }),
      );
    };

    const handleOnSeenMessage = (ack: { messageId: string }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === ack.messageId
            ? {
                ...m,
                status: "seen",
              }
            : m,
        ),
      );

      client.invalidateQueries({ queryKey: ["CHATROOMS"] });
    };

    onSentACK(handleSentACK);
    onMessage(handleNewMessage);
    onDeliveredACK(handleDeliveredACK);
    onSeenACK(handleOnSeenMessage);
    return () => {
      offMessage(handleNewMessage);
      socket.off("message-sent-ack", handleSentACK);
      socket.off("message-delivered-ack", handleDeliveredACK);
      socket.off("message-seen-ack", handleOnSeenMessage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeCid]);

  if (isLoading || isPending || !ChatroomAndMessages?.chatroom)
    return (
      <div className=" w-full h-full flex items-center justify-center">
        <Spinner />
      </div>
    );

  return (
    <div className=" flex flex-col justify-between w-full h-full  border-r">
      {/* Header */}
      <div className="h-auto z-10 px-4 py-3  flex gap-5 items-center justify-between ">
        <div className=" flex gap-5 items-center justify-start">
          <div className="relative h-[40px] w-[40px] shrink-0">
            {ChatroomAndMessages?.chatroom.recUserPfpUrl ? (
              <Image
                src={ChatroomAndMessages?.chatroom.recUserPfpUrl}
                alt={`${ChatroomAndMessages?.chatroom.recUsername} avatar`}
                fill
                sizes="40px"
                className="rounded-full object-cover"
              />
            ) : (
              <div className="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-elitePurple/10 text-elitePurple">
                <UsersRound size={20} />
              </div>
            )}
          </div>

          <div>
            <h1 className="text-lg font-bold text-customBlack">
              {ChatroomAndMessages?.chatroom.recUsername}
            </h1>
            <div className=" flex gap-2 items-center justify-start">
              <div className="h-2 w-2 bg-green-500 rounded-full" />
              <p className=" text-xs">Online</p>
            </div>
          </div>
        </div>

        <div className=" flex gap-2 items-center justify-center">
          <CiSearch size={25} className="text-slate-500 cursor-pointer" />
          <BsThreeDotsVertical
            size={23}
            className="text-slate-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Scrollable Messages */}
      <ScrollArea className="h-auto px-5 py-2 ">
        <div className="flex flex-col gap-1">
          {messages.map((message, _index, arr) => (
            <Message
              key={message.id}
              isSender={message.sid === user.id}
              message={message}
              isLast={_index === arr.length - 1}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="h-auto px-4 py-4 ">
        <SendInput
          crid={safeCid}
          user={user}
          rid={ChatroomAndMessages?.chatroom.recId}
          setMessages={setMessages}
          chatroom={ChatroomAndMessages?.chatroom}
        />
      </div>
    </div>
  );
};

export default RoomChat;

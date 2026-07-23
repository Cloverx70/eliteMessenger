"use client";

import {
  DirectDeliveredAck,
  DirectSentAck,
  useSocket,
} from "@/app/hooks/useSocket";
import { GetChatroomAndMesseges, IMessage } from "../../chats/action";
import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { BsThreeDotsVertical } from "react-icons/bs";
import { CiSearch } from "react-icons/ci";
import { IUser } from "@/app/auth/actions";
import Image from "next/image";
import Message from "../../chats/_components/Message";
import { ScrollArea } from "@/components/ui/scroll-area";
import SendInput from "../../chats/_components/SendInput";
import Spinner from "@/app/components/spinner";
import { useChatStore } from "@/app/stores/ChatStore";
import { useParams } from "next/navigation";

type RoomChatProps = {
  user: IUser;
};

const RoomChat = ({ user }: RoomChatProps) => {
  const { cid } = useParams();
  const queryClient = useQueryClient();
  const safeCid = Array.isArray(cid) ? cid[0] : (cid ?? "");
  const clearUnread = useChatStore((state) => state.clearUnread);

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

  const {
    data: chatroomAndMessages,
    isLoading,
    isPending,
  } = useQuery({
    queryKey: ["CHATROOMANDMESSAGES", safeCid],
    queryFn: () => GetChatroomAndMesseges(safeCid, 200, 1),
    enabled: Boolean(safeCid),
  });

  const [messages, setMessages] = useState<IMessage[]>([]);

  useEffect(() => {
    if (chatroomAndMessages?.chatRoomMessages) {
      setMessages(chatroomAndMessages.chatRoomMessages);
    }
  }, [chatroomAndMessages]);

  useEffect(() => {
    if (!safeCid) return;
    clearUnread(safeCid);
    queryClient.invalidateQueries({
      queryKey: ["CHATROOMINFO", safeCid],
    });
  }, [clearUnread, queryClient, safeCid]);

  useEffect(() => {
    if (!safeCid) return;

    joinRoom(safeCid, user.id);
    return () => leaveRoom(safeCid, user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeCid, user.id]);

  useEffect(() => {
    if (!safeCid || !chatroomAndMessages?.chatRoomMessages) return;

    messageSeen(safeCid, user.id);
    clearUnread(safeCid);
    queryClient.invalidateQueries({ queryKey: ["CHATROOMS"] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeCid, chatroomAndMessages?.chatRoomMessages, user.id]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !safeCid) return;

    const handleSentAck = (ack: DirectSentAck) => {
      setMessages((previous) =>
        previous.map((message) =>
          message.id === ack.tempId || message.tempId === ack.tempId
            ? {
                ...ack.message,
                tempId: ack.tempId,
                status: "sent",
              }
            : message,
        ),
      );

      queryClient.invalidateQueries({ queryKey: ["CHATROOMS"] });
    };

    const handleNewMessage = (message: IMessage) => {
      if (message.sid === user.id || message.chatroomId !== safeCid) return;

      setMessages((previous) => {
        const exists = previous.some(
          (current) =>
            current.id === message.id ||
            (message.tempId && current.tempId === message.tempId),
        );

        if (exists) {
          return previous.map((current) =>
            current.id === message.id ||
            (message.tempId && current.tempId === message.tempId)
              ? { ...current, ...message }
              : current,
          );
        }

        return [...previous, message];
      });

      messageSeen(safeCid, user.id);
      clearUnread(safeCid);
      queryClient.invalidateQueries({ queryKey: ["CHATROOMS"] });
    };

    const handleDeliveredAck = (ack: DirectDeliveredAck) => {
      setMessages((previous) =>
        previous.map((message) =>
          message.id === ack.messageId ||
          (ack.tempId &&
            (message.id === ack.tempId || message.tempId === ack.tempId))
            ? { ...message, status: "delivered" }
            : message,
        ),
      );
    };

    const handleSeenAck = (ack: { messageId: string }) => {
      setMessages((previous) =>
        previous.map((message) =>
          message.id === ack.messageId
            ? { ...message, status: "seen" }
            : message,
        ),
      );

      queryClient.invalidateQueries({ queryKey: ["CHATROOMS"] });
    };

    onSentACK(handleSentAck);
    onMessage(handleNewMessage);
    onDeliveredACK(handleDeliveredAck);
    onSeenACK(handleSeenAck);

    return () => {
      offMessage(handleNewMessage);
      socket.off("message-sent-ack", handleSentAck);
      socket.off("message-delivered-ack", handleDeliveredAck);
      socket.off("message-seen-ack", handleSeenAck);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeCid, user.id]);

  if (isLoading || isPending || !chatroomAndMessages?.chatroom) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const chatroom = chatroomAndMessages.chatroom;

  return (
    <div className="flex h-full w-full flex-col border-r">
      <div className="z-10 flex items-center justify-between gap-5 px-4 py-3">
        <div className="flex items-center justify-start gap-5">
          <Image
            src={chatroom.recUserPfpUrl || "/default-avatar.png"}
            width={35}
            height={35}
            className="h-[35px] w-[35px] rounded-full object-cover"
            alt="User profile"
          />

          <div>
            <h1 className="text-lg font-bold text-customBlack">
              {chatroom.recUsername}
            </h1>
            <div className="flex items-center justify-start gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  chatroom.recIsActive ? "bg-green-500" : "bg-slate-400"
                }`}
              />
              <p className="text-xs">
                {chatroom.recIsActive ? "Online" : "Offline"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2">
          <CiSearch size={25} className="cursor-pointer text-slate-500" />
          <BsThreeDotsVertical
            size={23}
            className="cursor-pointer text-slate-500"
          />
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-5 py-2">
        <div className="flex flex-col gap-1">
          {messages.map((message, index, array) => (
            <Message
              key={message.id}
              isSender={message.sid === user.id}
              message={message}
              isLast={index === array.length - 1}
            />
          ))}
        </div>
      </ScrollArea>

      <div className="px-4 py-4">
        <SendInput
          crid={safeCid}
          user={user}
          rid={chatroom.recId}
          setMessages={setMessages}
          chatroom={chatroom}
        />
      </div>
    </div>
  );
};

export default RoomChat;

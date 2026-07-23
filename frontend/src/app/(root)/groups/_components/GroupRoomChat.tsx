///////////

"use client";

import { GetGroupAndMessages, IGroupMessage } from "../../groups/group-action";
import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { BsThreeDotsVertical } from "react-icons/bs";
import { CiSearch } from "react-icons/ci";
import GroupMessage from "./GroupMessage";
import GroupSendInput from "./GroupSendInput";
import { IUser } from "@/app/auth/actions";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import Spinner from "@/app/components/spinner";
import { UsersRound } from "lucide-react";
import { useChatStore } from "@/app/stores/ChatStore";
import { useParams } from "next/navigation";
import { useSocket } from "@/app/hooks/useSocket";

type GroupRoomChatProps = {
  user: IUser;
};

const GroupRoomChat = ({ user }: GroupRoomChatProps) => {
  const params = useParams();
  const queryClient = useQueryClient();
  const rawGroupId = params.gid;
  const groupId = Array.isArray(rawGroupId)
    ? rawGroupId[0]
    : (rawGroupId ?? "");

  const clearGroupUnread = useChatStore((state) => state.clearGroupUnread);

  const {
    socketRef,
    joinGroupRoom,
    leaveGroupRoom,
    groupMessagesSeen,
    onGroupMessage,
    offGroupMessage,
    onGroupSentACK,
    offGroupSentACK,
    onGroupDeliveredACK,
    offGroupDeliveredACK,
    onGroupSeenACK,
    offGroupSeenACK,
  } = useSocket(user.id);

  const {
    data: groupAndMessages,
    isLoading,
    isPending,
  } = useQuery({
    queryKey: ["GROUP_AND_MESSAGES", groupId],
    queryFn: () => GetGroupAndMessages(groupId, 200, 1),
    enabled: Boolean(groupId),
  });

  const [messages, setMessages] = useState<IGroupMessage[]>([]);

  useEffect(() => {
    if (groupAndMessages?.groupMessages) {
      setMessages(groupAndMessages.groupMessages);
    }
  }, [groupAndMessages]);

  useEffect(() => {
    if (!groupId) return;
    clearGroupUnread(groupId);
  }, [clearGroupUnread, groupId]);

  useEffect(() => {
    if (!groupId || !user.id) return;

    joinGroupRoom(groupId, user.id);

    return () => {
      leaveGroupRoom(groupId, user.id);
    };
    // Socket helpers use the singleton socket and are intentionally scoped by ID.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, user.id]);

  useEffect(() => {
    if (!groupId || !groupAndMessages?.groupMessages) return;

    groupMessagesSeen(groupId, user.id);
    clearGroupUnread(groupId);
    queryClient.invalidateQueries({ queryKey: ["GROUPS"] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, groupAndMessages?.groupMessages, user.id]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !groupId) return;

    const handleSentAck = (ack: { tempId: string; message: IGroupMessage }) => {
      setMessages((previous) =>
        previous.map((message) =>
          message.id === ack.tempId || message.tempId === ack.tempId
            ? {
                ...ack.message,
                tempId: ack.tempId,
              }
            : message,
        ),
      );

      queryClient.invalidateQueries({ queryKey: ["GROUPS"] });
      queryClient.invalidateQueries({
        queryKey: ["GROUP_INFO", groupId],
      });
    };

    const handleNewMessage = (message: IGroupMessage) => {
      if (message.senderId === user.id) return;
      if (message.groupId !== groupId) return;

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

      groupMessagesSeen(groupId, user.id);
      clearGroupUnread(groupId);
      queryClient.invalidateQueries({ queryKey: ["GROUPS"] });
    };

    const handleReceiptAck = (ack: {
      messageId: string;
      groupId: string;
      totalRecipients: number;
      deliveredCount: number;
      seenCount: number;
      status: "sent" | "delivered" | "seen";
    }) => {
      if (ack.groupId !== groupId) return;

      setMessages((previous) =>
        previous.map((message) =>
          message.id === ack.messageId
            ? {
                ...message,
                status: ack.status,
                receiptSummary: {
                  totalRecipients: ack.totalRecipients,
                  deliveredCount: ack.deliveredCount,
                  seenCount: ack.seenCount,
                  status: ack.status,
                },
              }
            : message,
        ),
      );
    };

    onGroupSentACK(handleSentAck);
    onGroupMessage(handleNewMessage);
    onGroupDeliveredACK(handleReceiptAck);
    onGroupSeenACK(handleReceiptAck);

    return () => {
      offGroupSentACK(handleSentAck);
      offGroupMessage(handleNewMessage);
      offGroupDeliveredACK(handleReceiptAck);
      offGroupSeenACK(handleReceiptAck);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, user.id]);

  if (isLoading || isPending || !groupAndMessages?.group) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const group = groupAndMessages.group;

  return (
    <div className="flex h-full w-full flex-col border-r">
      <div className="z-10 flex items-center justify-between gap-5 px-4 py-3">
        <div className="flex items-center justify-start gap-4">
          {group.imageUrl ? (
            <Image
              src={group.imageUrl}
              alt={`${group.name} avatar`}
              fill
              sizes="40px"
              className="rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-elitePurple/10 text-elitePurple">
              <UsersRound size={19} />
            </div>
          )}
          <div>
            <h1 className="text-lg font-bold text-customBlack">{group.name}</h1>
            <p className="text-xs text-slate-500">
              {group.memberCount}{" "}
              {group.memberCount === 1 ? "member" : "members"}
            </p>
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
        <div className="flex flex-col gap-2">
          {messages.map((message, index, array) => (
            <GroupMessage
              key={message.id}
              message={message}
              isSender={message.senderId === user.id}
              isLast={index === array.length - 1}
            />
          ))}
        </div>
      </ScrollArea>

      <div className="px-4 py-4">
        <GroupSendInput user={user} group={group} setMessages={setMessages} />
      </div>
    </div>
  );
};

export default GroupRoomChat;

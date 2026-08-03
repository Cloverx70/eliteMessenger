"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  ArrowLeft,
  Info,
  Search,
  UsersRound,
} from "lucide-react";
import Image from "next/image";
import {
  useParams,
  useRouter,
} from "next/navigation";
import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { BsThreeDotsVertical } from "react-icons/bs";

import { IUser } from "@/app/auth/actions";
import Spinner from "@/app/components/spinner";
import { useChatStore } from "@/app/stores/ChatStore";
import { useSocket } from "@/app/hooks/useSocket";

import {
  GetGroupAndMessages,
  IGroupMessage,
} from "../group-action";
import GroupMessage from "./GroupMessage";
import GroupSendInput from "./GroupSendInput";

type GroupRoomChatProps = {
  user: IUser;
};

const GroupRoomChat = ({
  user,
}: GroupRoomChatProps) => {
  const params = useParams();
  const router = useRouter();
  const queryClient =
    useQueryClient();

  const rawGroupId = params.gid;

  const groupId =
    Array.isArray(rawGroupId)
      ? rawGroupId[0]
      : (rawGroupId ?? "");

  const clearGroupUnread =
    useChatStore(
      (state) =>
        state.clearGroupUnread,
    );

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
    queryKey: [
      "GROUP_AND_MESSAGES",
      groupId,
    ],
    queryFn: () =>
      GetGroupAndMessages(
        groupId,
        200,
        1,
      ),
    enabled: Boolean(groupId),
  });

  const [
    messages,
    setMessages,
  ] = useState<IGroupMessage[]>(
    [],
  );

  useEffect(() => {
    if (
      groupAndMessages?.groupMessages
    ) {
      setMessages(
        groupAndMessages.groupMessages,
      );
    }
  }, [groupAndMessages]);

  useEffect(() => {
    if (!groupId) return;

    clearGroupUnread(groupId);

    queryClient.invalidateQueries({
      queryKey: [
        "GROUP_INFO",
        groupId,
      ],
    });
  }, [
    clearGroupUnread,
    groupId,
    queryClient,
  ]);

  useEffect(() => {
    if (!groupId || !user.id) {
      return;
    }

    joinGroupRoom(
      groupId,
      user.id,
    );

    return () => {
      leaveGroupRoom(
        groupId,
        user.id,
      );
    };
  }, [
    groupId,
    user.id,
    joinGroupRoom,
    leaveGroupRoom,
  ]);

  useEffect(() => {
    if (
      !groupId ||
      !groupAndMessages
        ?.groupMessages
    ) {
      return;
    }

    groupMessagesSeen(
      groupId,
      user.id,
    );

    clearGroupUnread(groupId);

    queryClient.invalidateQueries({
      queryKey: ["GROUPS"],
    });
  }, [
    groupId,
    groupAndMessages?.groupMessages,
    user.id,
    groupMessagesSeen,
    clearGroupUnread,
    queryClient,
  ]);

  useEffect(() => {
    const socket =
      socketRef.current;

    if (!socket || !groupId) {
      return;
    }

    const handleSentAck = (
      ack: {
        tempId: string;
        message: IGroupMessage;
      },
    ) => {
      setMessages((previous) =>
        previous.map((message) =>
          message.id ===
            ack.tempId ||
          message.tempId ===
            ack.tempId
            ? {
                ...ack.message,
                tempId:
                  ack.tempId,
              }
            : message,
        ),
      );

      queryClient.invalidateQueries({
        queryKey: ["GROUPS"],
      });

      queryClient.invalidateQueries({
        queryKey: [
          "GROUP_INFO",
          groupId,
        ],
      });
    };

    const handleNewMessage = (
      message: IGroupMessage,
    ) => {
      if (
        message.senderId ===
        user.id
      ) {
        return;
      }

      if (
        message.groupId !==
        groupId
      ) {
        return;
      }

      setMessages((previous) => {
        const exists =
          previous.some(
            (current) =>
              current.id ===
                message.id ||
              (message.tempId &&
                current.tempId ===
                  message.tempId),
          );

        if (exists) {
          return previous.map(
            (current) =>
              current.id ===
                message.id ||
              (message.tempId &&
                current.tempId ===
                  message.tempId)
                ? {
                    ...current,
                    ...message,
                  }
                : current,
          );
        }

        return [
          ...previous,
          message,
        ];
      });

      groupMessagesSeen(
        groupId,
        user.id,
      );

      clearGroupUnread(groupId);

      queryClient.invalidateQueries({
        queryKey: ["GROUPS"],
      });
    };

    const handleReceiptAck = (
      ack: {
        messageId: string;
        groupId: string;
        totalRecipients: number;
        deliveredCount: number;
        seenCount: number;
        status:
          | "sent"
          | "delivered"
          | "seen";
      },
    ) => {
      if (
        ack.groupId !== groupId
      ) {
        return;
      }

      setMessages((previous) =>
        previous.map((message) =>
          message.id ===
          ack.messageId
            ? {
                ...message,
                status:
                  ack.status,
                receiptSummary: {
                  totalRecipients:
                    ack.totalRecipients,
                  deliveredCount:
                    ack.deliveredCount,
                  seenCount:
                    ack.seenCount,
                  status:
                    ack.status,
                },
              }
            : message,
        ),
      );
    };

    onGroupSentACK(
      handleSentAck,
    );
    onGroupMessage(
      handleNewMessage,
    );
    onGroupDeliveredACK(
      handleReceiptAck,
    );
    onGroupSeenACK(
      handleReceiptAck,
    );

    return () => {
      offGroupSentACK(
        handleSentAck,
      );
      offGroupMessage(
        handleNewMessage,
      );
      offGroupDeliveredACK(
        handleReceiptAck,
      );
      offGroupSeenACK(
        handleReceiptAck,
      );
    };
  }, [
    groupId,
    user.id,
    queryClient,
    socketRef,
    groupMessagesSeen,
    clearGroupUnread,
    onGroupSentACK,
    offGroupSentACK,
    onGroupMessage,
    offGroupMessage,
    onGroupDeliveredACK,
    offGroupDeliveredACK,
    onGroupSeenACK,
    offGroupSeenACK,
  ]);

  if (
    isLoading ||
    isPending ||
    !groupAndMessages?.group
  ) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const group =
    groupAndMessages.group;

  return (
    <div
      className="
        flex
        h-full
        min-h-0
        w-full
        min-w-0
        flex-col
        overflow-hidden
        bg-white
        dark:bg-customBlack
      "
    >
      <header
        className="
          z-10
          flex
          h-16
          shrink-0
          items-center
          justify-between
          gap-3
          border-b
          border-slate-200
          bg-white
          px-2
          dark:border-slate-800
          dark:bg-customBlack
          sm:px-4
        "
      >
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            aria-label="Back to groups"
            onClick={() =>
              router.push("/groups")
            }
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-full
              text-slate-600
              transition
              hover:bg-slate-100
              dark:text-slate-300
              dark:hover:bg-slate-900
              md:hidden
            "
          >
            <ArrowLeft size={21} />
          </button>

          <div className="relative h-10 w-10 shrink-0">
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
                <UsersRound size={20} />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-sm font-black text-slate-900 dark:text-white sm:text-base">
              {group.name}
            </h1>

            <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
              {group.memberCount}{" "}
              {group.memberCount === 1
                ? "member"
                : "members"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center">
          <button
            type="button"
            aria-label="Search this group"
            className="
              hidden
              h-11
              w-11
              items-center
              justify-center
              rounded-full
              text-slate-500
              transition
              hover:bg-slate-100
              dark:hover:bg-slate-900
              sm:flex
            "
          >
            <Search size={20} />
          </button>

          <button
            type="button"
            aria-label="Open group details"
            onClick={() => {
              window.dispatchEvent(
                new Event(
                  "open-group-profile",
                ),
              );
            }}
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-full
              text-slate-500
              transition
              hover:bg-slate-100
              dark:hover:bg-slate-900
              xl:hidden
            "
          >
            <Info size={20} />
          </button>

          <button
            type="button"
            aria-label="Group options"
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-full
              text-slate-500
              transition
              hover:bg-slate-100
              dark:hover:bg-slate-900
            "
          >
            <BsThreeDotsVertical
              size={20}
            />
          </button>
        </div>
      </header>

      <section
        className="
          min-h-0
          flex-1
          overflow-y-auto
          overflow-x-hidden
          overscroll-contain
          bg-slate-50/70
          px-3
          py-4
          dark:bg-slate-950/40
          sm:px-5
        "
      >
        {messages.length > 0 ? (
          <div className="flex min-w-0 flex-col gap-2">
            {messages.map(
              (
                message,
                index,
                allMessages,
              ) => (
                <GroupMessage
                  key={message.id}
                  message={message}
                  isSender={
                    message.senderId ===
                    user.id
                  }
                  isLast={
                    index ===
                    allMessages.length -
                      1
                  }
                />
              ),
            )}
          </div>
        ) : (
          <div className="flex h-full min-h-48 items-center justify-center text-center">
            <p className="max-w-xs text-sm font-semibold text-slate-400">
              No messages yet. Start
              the group conversation.
            </p>
          </div>
        )}
      </section>

      <footer
        className="
          shrink-0
          border-t
          border-slate-200
          bg-white
          px-2
          pb-[max(0.75rem,env(safe-area-inset-bottom))]
          pt-3
          dark:border-slate-800
          dark:bg-customBlack
          sm:px-4
        "
      >
        <GroupSendInput
          user={user}
          group={group}
          setMessages={setMessages}
        />
      </footer>
    </div>
  );
};

export default GroupRoomChat;

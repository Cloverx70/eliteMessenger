"use client";

import type {
  DirectDeliveredAck,
  DirectSentAck,
} from "@/app/hooks/useSocket";
import { useSocketContext } from "@/app/providers/SocketProvider";
import { usePresenceStore } from "@/app/stores/PresenceStore";
import { getAgoTiming } from "@/app/constants";
import { useChatStore } from "@/app/stores/ChatStore";
import { IUser } from "@/app/auth/actions";
import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
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
  useEffect,
  useState,
} from "react";
import { BsThreeDotsVertical } from "react-icons/bs";

import {
  GetChatroomAndMesseges,
  IMessage,
} from "../action";
import Message from "./Message";
import SendInput from "./SendInput";
import Spinner from "@/app/components/spinner";

type RoomChatProps = {
  user: IUser;
};

const RoomChat = ({
  user,
}: RoomChatProps) => {
  const { cid } = useParams();
  const router = useRouter();
  const client = useQueryClient();

  const safeCid: string =
    Array.isArray(cid)
      ? cid[0]
      : (cid ?? "");

  const clearUnread = useChatStore(
    (state) => state.clearUnread,
  );

  const presenceByUserId = usePresenceStore(
    (state) => state.presenceByUserId,
  );

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
  } = useSocketContext();

  const {
    data: ChatroomAndMessages,
    isLoading,
    isPending,
  } = useQuery({
    queryKey: [
      "CHATROOMANDMESSAGES",
      safeCid,
    ],
    queryFn: () =>
      GetChatroomAndMesseges(
        safeCid,
        1000,
        1,
      ),
    enabled: Boolean(safeCid),
  });

  const [messages, setMessages] =
    useState<IMessage[]>([]);

  useEffect(() => {
    if (!safeCid) return;

    clearUnread(safeCid);

    client.invalidateQueries({
      queryKey: [
        "CHATROOMINFO",
        safeCid,
      ],
    });
  }, [
    safeCid,
    clearUnread,
    client,
  ]);

  useEffect(() => {
    if (
      ChatroomAndMessages?.chatRoomMessages
    ) {
      setMessages(
        ChatroomAndMessages.chatRoomMessages,
      );
    }
  }, [ChatroomAndMessages]);

  useEffect(() => {
    if (!safeCid) return;

    joinRoom(safeCid, user.id);

    return () => {
      leaveRoom(safeCid, user.id);
    };
  }, [
    safeCid,
    joinRoom,
    leaveRoom,
    user.id,
  ]);

  useEffect(() => {
    if (
      !safeCid ||
      !ChatroomAndMessages
        ?.chatRoomMessages
    ) {
      return;
    }

    messageSeen(
      safeCid,
      user.id,
    );
  }, [
    safeCid,
    ChatroomAndMessages,
    messageSeen,
    user.id,
  ]);

  useEffect(() => {
    const socket = socketRef.current;

    if (!socket || !safeCid) {
      return;
    }

    const handleSentACK = (
      ack: DirectSentAck,
    ) => {
      setMessages((previous) =>
        previous.map((message) =>
          message.id === ack.tempId
            ? {
                ...message,
                status: "sent",
              }
            : message,
        ),
      );

      client.invalidateQueries({
        queryKey: ["CHATROOMS"],
      });
    };

    const handleNewMessage = (
      message: IMessage,
    ) => {
      if (message.sid === user.id) {
        return;
      }

      if (
        message.chatroomId !== safeCid
      ) {
        return;
      }

      setMessages((previous) => {
        const exists = previous.some(
          (currentMessage) =>
            currentMessage.id ===
              message.id ||
            currentMessage.tempId ===
              message.tempId,
        );

        if (exists) {
          return previous.map(
            (currentMessage) =>
              currentMessage.id ===
                message.tempId ||
              currentMessage.id ===
                message.id
                ? {
                    ...currentMessage,
                    ...message,
                  }
                : currentMessage,
          );
        }

        return [
          ...previous,
          message,
        ];
      });

      messageSeen(
        safeCid,
        user.id,
      );
    };

    const handleDeliveredACK = (
      ack: DirectDeliveredAck,
    ) => {
      setMessages((previous) =>
        previous.map((message) =>
          message.id === ack.tempId
            ? {
                ...message,
                status:
                  "delivered",
              }
            : message,
        ),
      );
    };

    const handleSeenMessage = (
      ack: {
        messageId: string;
      },
    ) => {
      setMessages((previous) =>
        previous.map((message) =>
          message.id ===
          ack.messageId
            ? {
                ...message,
                status: "seen",
              }
            : message,
        ),
      );

      client.invalidateQueries({
        queryKey: ["CHATROOMS"],
      });
    };

    onSentACK(handleSentACK);
    onMessage(handleNewMessage);
    onDeliveredACK(
      handleDeliveredACK,
    );
    onSeenACK(
      handleSeenMessage,
    );

    return () => {
      offMessage(
        handleNewMessage,
      );

      socket.off(
        "message-sent-ack",
        handleSentACK,
      );

      socket.off(
        "message-delivered-ack",
        handleDeliveredACK,
      );

      socket.off(
        "message-seen-ack",
        handleSeenMessage,
      );
    };
  }, [
    safeCid,
    user.id,
    client,
    messageSeen,
    offMessage,
    onDeliveredACK,
    onMessage,
    onSeenACK,
    onSentACK,
    socketRef,
  ]);

  if (
    isLoading ||
    isPending ||
    !ChatroomAndMessages?.chatroom
  ) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const chatroom =
    ChatroomAndMessages.chatroom;

  const livePresence =
    presenceByUserId[chatroom.recId];

  const recipientIsActive =
    livePresence?.isActive ??
    Boolean(chatroom.recIsActive);

  const recipientLastSeen =
    livePresence?.lastSeen ??
    (chatroom.recLastSeen
      ? String(chatroom.recLastSeen)
      : null);

  const recipientPresenceLabel =
    recipientIsActive
      ? "Online"
      : recipientLastSeen
        ? `Last seen ${getAgoTiming(
            new Date(recipientLastSeen),
          )}`
        : "Offline";

  const recipientName =
    chatroom.recUsername ||
    `${chatroom.recFirstname ?? ""} ${
      chatroom.recLastname ?? ""
    }`.trim() ||
    "Elite user";

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
            aria-label="Back to conversations"
            onClick={() =>
              router.push("/chats")
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
            {chatroom.recUserPfpUrl ? (
              <Image
                src={
                  chatroom.recUserPfpUrl
                }
                alt={`${recipientName} avatar`}
                fill
                sizes="40px"
                className="rounded-full object-cover"
              />
            ) : (
              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-full
                  bg-elitePurple/10
                  text-elitePurple
                "
              >
                <UsersRound size={20} />
              </div>
            )}

            <span
              className={`
                absolute
                bottom-0
                right-0
                h-3
                w-3
                rounded-full
                border-2
                border-white
                dark:border-customBlack
                ${
                  recipientIsActive
                    ? "bg-emerald-500"
                    : "bg-slate-400"
                }
              `}
            />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-sm font-black text-slate-900 dark:text-white sm:text-base">
              {recipientName}
            </h1>

            <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
              {recipientPresenceLabel}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center">
          <button
            type="button"
            aria-label="Search this conversation"
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
            aria-label="Open conversation details"
            onClick={() => {
              window.dispatchEvent(
                new Event(
                  "open-chat-profile",
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
            aria-label="Conversation options"
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
          <div className="flex min-w-0 flex-col gap-1">
            {messages.map(
              (
                message,
                index,
                allMessages,
              ) => (
                <Message
                  key={message.id}
                  isSender={
                    message.sid ===
                    user.id
                  }
                  message={message}
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
              No messages yet. Send the
              first message.
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
        <SendInput
          crid={safeCid}
          user={user}
          rid={chatroom.recId}
          setMessages={setMessages}
          chatroom={chatroom}
        />
      </footer>
    </div>
  );
};

export default RoomChat;

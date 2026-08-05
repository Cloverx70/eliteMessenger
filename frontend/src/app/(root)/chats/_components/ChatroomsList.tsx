"use client";

import { MessageCircleMore, UsersRound } from "lucide-react";
import { getAgoTiming, useDebounce } from "@/app/constants";
import { usePathname, useRouter } from "next/navigation";

import FIlterPills from "./FIlterPills";
import { GetChatList } from "../action";
import Image from "next/image";
import SearchInput from "./SearchInput";
import { useChatStore } from "@/app/stores/ChatStore";
import { usePresenceStore } from "@/app/stores/PresenceStore";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

const ChatroomsList = () => {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const debouncedValue = useDebounce(query, 300);

  const router = useRouter();
  const pathname = usePathname();

  const clearUnread = useChatStore((state) => state.clearUnread);

  const presenceByUserId = usePresenceStore((state) => state.presenceByUserId);

  const { data: chatrooms = [], isLoading } = useQuery({
    queryKey: ["CHATROOMS", debouncedValue, filter],
    queryFn: () => GetChatList(debouncedValue, filter),
  });

  const handleChatroomNavigation = (chatroomId: string) => {
    clearUnread(chatroomId);
    router.push(`/chats/${chatroomId}`);
  };

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
      <header className="shrink-0 px-4 pt-5 sm:px-5">
        <h1 className="text-xl font-black text-slate-900 dark:text-white">
          Chats
        </h1>

        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Your conversations
        </p>
      </header>

      <div className="shrink-0 space-y-4 px-4 py-4 sm:px-5">
        <SearchInput value={query} onChange={setQuery} />

        <FIlterPills filter={filter} onChange={setFilter} />
      </div>

      <div
        className="
          min-h-0
          flex-1
          overflow-y-auto
          overflow-x-hidden
          overscroll-contain
          px-3
          pb-[max(1rem,env(safe-area-inset-bottom))]
        "
      >
        {isLoading ? (
          <div className="flex min-h-40 items-center justify-center">
            <p className="text-xs font-semibold text-slate-500">
              Loading conversations...
            </p>
          </div>
        ) : chatrooms.length > 0 ? (
          <div className="space-y-1">
            {chatrooms.map((room) => {
              const activePath = `/chats/${room.id}`;

              const title =
                room.recUsername ||
                `${room.recFirstname ?? ""} ${room.recLastname ?? ""}`.trim() ||
                "Elite user";

              const unreadCount =
                room.unreadMessages.length ?? room.unreadMessages?.length ?? 0;

              const livePresence = presenceByUserId[room.recId];

              const recipientIsActive =
                livePresence?.isActive ?? Boolean(room.recIsActive);

              const lastMessage =
                room.lastMessage || "Say hi to your new friend";

              return (
                <button
                  type="button"
                  key={room.id}
                  aria-current={pathname === activePath ? "page" : undefined}
                  onClick={() => handleChatroomNavigation(room.id)}
                  className={`
                    flex
                    min-h-[76px]
                    w-full
                    min-w-0
                    items-center
                    justify-between
                    gap-3
                    rounded-2xl
                    px-3
                    py-3
                    text-left
                    transition
                    ${
                      pathname === activePath
                        ? "bg-[#f4f0fc] dark:bg-violet-950/35"
                        : "hover:bg-slate-50 dark:hover:bg-slate-900"
                    }
                  `}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="relative h-11 w-11 shrink-0">
                      {room.recUserPfpUrl ? (
                        <Image
                          src={room.recUserPfpUrl}
                          alt={`${title} avatar`}
                          fill
                          sizes="44px"
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="
                            flex
                            h-11
                            w-11
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

                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-sm font-black text-slate-900 dark:text-white">
                        {title}
                      </h2>

                      <p className="mt-1 truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                        {lastMessage}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <p className="whitespace-nowrap text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      {room.lastMessageDate
                        ? getAgoTiming(new Date(room.lastMessageDate))
                        : ""}
                    </p>

                    {unreadCount > 0 ? (
                      <span
                        className="
                          flex
                          h-5
                          min-w-5
                          items-center
                          justify-center
                          rounded-full
                          bg-elitePurple
                          px-1.5
                          text-[10px]
                          font-black
                          text-white
                        "
                      >
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-56 flex-col items-center justify-center px-5 text-center">
            <span
              className="
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-2xl
                bg-elitePurple/10
                text-elitePurple
              "
            >
              <MessageCircleMore size={24} />
            </span>

            <p className="mt-3 text-sm font-black text-slate-700 dark:text-slate-200">
              {filter === "unread"
                ? "No unread conversations"
                : query
                  ? "No conversations found"
                  : "No conversations yet"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatroomsList;

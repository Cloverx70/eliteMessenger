"use client";

import React, { useState } from "react";
import { getAgoTiming, useDebounce } from "@/app/constants";
import { usePathname, useRouter } from "next/navigation";

import FIlterPills from "./FIlterPills";
import { GetChatList } from "../action";
import Image from "next/image";
import SearchInput from "./SearchInput";
import { UsersRound } from "lucide-react";
import { useChatStore } from "@/app/stores/ChatStore";
import { useQuery } from "@tanstack/react-query";

const ChatroomsList = () => {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const debouncedValue = useDebounce(query, 300);

  const router = useRouter();
  const pathname = usePathname();

  const clearUnread = useChatStore((state) => state.clearUnread);

  const { data: chatrooms = [], isLoading } = useQuery({
    queryKey: ["CHATROOMS", debouncedValue, filter],
    queryFn: () => GetChatList(debouncedValue, filter),
  });

  const handleChatroomNavigation = (chatroomId: string) => {
    clearUnread(chatroomId);
    router.push(`/chats/${chatroomId}`);
  };

  return (
    <div className="flex h-full w-full flex-col border-r">
      <div className="flex items-center justify-between px-4 pt-5">
        <div>
          <h1 className="text-lg font-bold">Chats</h1>

          <p className="text-xs text-slate-500">Your conversations</p>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col gap-4 px-4 py-4">
        <SearchInput value={query} onChange={setQuery} />

        <FIlterPills filter={filter} onChange={setFilter} />
      </div>

      {/* Direct chatrooms */}
      <div className="flex w-full flex-1 flex-col gap-3 overflow-y-auto px-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-xs text-slate-500">Loading conversations...</p>
          </div>
        ) : chatrooms.length > 0 ? (
          chatrooms.map((room) => {
            const activePath = `/chats/${room.id}`;

            const title = room.recUsername;

            const unreadCount = room.unreadMessages?.length ?? 0;

            const lastMessage = room.lastMessage || "Say hi to your new friend";

            return (
              <button
                type="button"
                key={room.id}
                onClick={() => handleChatroomNavigation(room.id)}
                className={`flex w-full cursor-pointer items-start justify-between rounded-2xl border-gray-300 px-3 py-4 text-left transition-all duration-100 ease-linear ${
                  pathname === activePath ? "bg-[#f4f0fc]" : "hover:bg-slate-50"
                }`}
              >
                {/* Recipient information */}
                <div className="flex min-w-0 items-center justify-start gap-4">
                  <div className="relative h-10 w-10 shrink-0">
                    {room.recUserPfpUrl ? (
                      <Image
                        src={room.recUserPfpUrl}
                        alt={`${room.recUsername} avatar`}
                        fill
                        sizes="40px"
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-elitePurple/10 text-elitePurple">
                        <UsersRound size={19} />
                      </div>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col gap-1">
                    <h2 className="truncate text-sm font-bold">{title}</h2>

                    <p className="max-w-[175px] truncate text-xs font-medium text-slate-500">
                      {lastMessage}
                    </p>
                  </div>
                </div>

                {/* Time and unread count */}
                <div className="flex shrink-0 flex-col items-end justify-center gap-2">
                  <p className="text-xs font-bold text-customBlack">
                    {room.lastMessageDate
                      ? getAgoTiming(room.lastMessageDate)
                      : ""}
                  </p>

                  {unreadCount > 0 && (
                    <div className="flex h-6 min-w-6 items-center justify-center rounded-full bg-elitePurple px-1.5">
                      <p className="text-xs font-semibold text-white">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </p>
                    </div>
                  )}
                </div>
              </button>
            );
          })
        ) : (
          <div className="flex items-center justify-center py-10">
            <p className="text-xs text-slate-600">
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

"use client";

import { GetAvailableGroupUsers, GetGroupList } from "../group-action";
import { Plus, UsersRound } from "lucide-react";
import React, { useState } from "react";
import { getAgoTiming, useDebounce } from "@/app/constants";
import { usePathname, useRouter } from "next/navigation";

import CreateGroupModal from "./CreateGroupModal";
import FIlterPills from "../../chats/_components/FIlterPills";
import Image from "next/image";
import SearchInput from "../../chats/_components/SearchInput";
import { useChatStore } from "@/app/stores/ChatStore";
import { useQuery } from "@tanstack/react-query";

const GroupChatsList = () => {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [createGroupOpen, setCreateGroupOpen] = useState(false);

  const debouncedValue = useDebounce(query, 300);

  const router = useRouter();
  const pathname = usePathname();

  const clearGroupUnread = useChatStore((state) => state.clearGroupUnread);

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["GROUPS", debouncedValue, filter],
    queryFn: () => GetGroupList(debouncedValue, filter),
  });

  const { data: availableUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ["GROUP_AVAILABLE_USERS"],
    queryFn: () => GetAvailableGroupUsers(),
    enabled: createGroupOpen,
  });

  const handleGroupNavigation = (groupId: string) => {
    clearGroupUnread(groupId);
    router.push(`/groups/${groupId}`);
  };

  return (
    <>
      <div className="flex h-full w-full flex-col border-r">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-5">
          <div>
            <h1 className="text-lg font-bold">Group Chats</h1>

            <p className="text-xs text-slate-500">Your group conversations</p>
          </div>

          <button
            type="button"
            onClick={() => setCreateGroupOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-elitePurple text-white transition-transform duration-100 hover:scale-90"
            aria-label="Create group"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Search and filter */}
        <div className="flex flex-col gap-4 px-4 py-4">
          <SearchInput value={query} onChange={setQuery} />

          <FIlterPills filter={filter} onChange={setFilter} />
        </div>

        {/* Group list */}
        <div className="flex w-full flex-1 flex-col gap-3 overflow-y-auto px-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-xs text-slate-500">Loading groups...</p>
            </div>
          ) : groups.length > 0 ? (
            groups.map((group) => {
              const activePath = `/groups/${group.id}`;

              const lastMessage =
                group.lastMessage || "Group created — start the conversation";

              const senderPrefix = group.lastMessageSender
                ? `${
                    group.lastMessageSender.firstname ||
                    group.lastMessageSender.username
                  }: `
                : "";

              return (
                <button
                  type="button"
                  key={group.id}
                  onClick={() => handleGroupNavigation(group.id)}
                  className={`flex w-full items-start justify-between rounded-2xl px-3 py-4 text-left transition-all duration-100 ${
                    pathname === activePath
                      ? "bg-[#f4f0fc]"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-4">
                    {/* Group avatar */}
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
                          <UsersRound size={19} />
                        </div>
                      )}
                    </div>

                    {/* Group information */}
                    <div className="flex min-w-0 flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <h2 className="truncate text-sm font-bold">
                          {group.name}
                        </h2>

                        <span className="rounded-full bg-elitePurple/10 px-2 py-0.5 text-[9px] font-semibold text-elitePurple">
                          {group.memberCount} members
                        </span>
                      </div>

                      <p className="max-w-[175px] truncate text-xs font-medium text-slate-500">
                        {senderPrefix}
                        {lastMessage}
                      </p>
                    </div>
                  </div>

                  {/* Timing and unread count */}
                  <div className="flex shrink-0 flex-col justify-center items-end gap-2">
                    <p className="text-xs font-bold text-customBlack">
                      {group.lastMessageDate
                        ? getAgoTiming(group.lastMessageDate)
                        : ""}
                    </p>

                    {group.unreadCount > 0 && (
                      <div className="flex h-6 min-w-6 items-center justify-center rounded-full bg-elitePurple px-1.5">
                        <p className="text-xs font-semibold text-white">
                          {group.unreadCount > 99 ? "99+" : group.unreadCount}
                        </p>
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-elitePurple/10 text-elitePurple">
                <UsersRound size={23} />
              </div>

              <div>
                <p className="text-sm font-semibold">
                  {filter === "unread"
                    ? "No unread groups"
                    : "No group chats found"}
                </p>

                {filter === "all" && !query && (
                  <button
                    type="button"
                    onClick={() => setCreateGroupOpen(true)}
                    className="mt-2 text-xs font-semibold text-elitePurple"
                  >
                    Create your first group
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <CreateGroupModal
        open={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
        availableUsers={availableUsers}
      />

      {createGroupOpen && usersLoading && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/10 pointer-events-none">
          <p className="rounded-xl bg-white px-4 py-2 text-xs shadow">
            Loading users...
          </p>
        </div>
      )}
    </>
  );
};

export default GroupChatsList;

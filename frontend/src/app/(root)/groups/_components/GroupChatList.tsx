"use client";

import {
  Plus,
  UsersRound,
} from "lucide-react";
import Image from "next/image";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  getAgoTiming,
  useDebounce,
} from "@/app/constants";
import { useChatStore } from "@/app/stores/ChatStore";

import {
  GetAvailableGroupUsers,
  GetGroupList,
} from "../group-action";
import CreateGroupModal from "./CreateGroupModal";
import FIlterPills from "../../chats/_components/FIlterPills";
import SearchInput from "../../chats/_components/SearchInput";

const GroupChatsList = () => {
  const [query, setQuery] =
    useState("");
  const [filter, setFilter] =
    useState<"all" | "unread">(
      "all",
    );
  const [
    createGroupOpen,
    setCreateGroupOpen,
  ] = useState(false);

  const debouncedValue =
    useDebounce(query, 300);

  const router = useRouter();
  const pathname = usePathname();

  const clearGroupUnread =
    useChatStore(
      (state) =>
        state.clearGroupUnread,
    );

  const {
    data: groups = [],
    isLoading,
  } = useQuery({
    queryKey: [
      "GROUPS",
      debouncedValue,
      filter,
    ],
    queryFn: () =>
      GetGroupList(
        debouncedValue,
        filter,
      ),
  });

  const {
    data: availableUsers = [],
    isLoading: usersLoading,
  } = useQuery({
    queryKey: [
      "GROUP_AVAILABLE_USERS",
    ],
    queryFn: () =>
      GetAvailableGroupUsers(),
    enabled: createGroupOpen,
  });

  const handleGroupNavigation = (
    groupId: string,
  ) => {
    clearGroupUnread(groupId);
    router.push(
      `/groups/${groupId}`,
    );
  };

  return (
    <>
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
            flex
            shrink-0
            items-center
            justify-between
            gap-3
            px-4
            pt-5
            sm:px-5
          "
        >
          <div className="min-w-0">
            <h1 className="truncate text-xl font-black text-slate-900 dark:text-white">
              Group chats
            </h1>

            <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
              Your group conversations
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setCreateGroupOpen(true)
            }
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-elitePurple
              text-white
              shadow-lg
              shadow-elitePurple/20
              transition
              hover:scale-95
              hover:brightness-110
            "
            aria-label="Create group"
          >
            <Plus size={20} />
          </button>
        </header>

        <div className="shrink-0 space-y-4 px-4 py-4 sm:px-5">
          <SearchInput
            value={query}
            onChange={setQuery}
          />

          <FIlterPills
            filter={filter}
            onChange={setFilter}
          />
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
                Loading groups...
              </p>
            </div>
          ) : groups.length > 0 ? (
            <div className="space-y-1">
              {groups.map(
                (group) => {
                  const activePath =
                    `/groups/${group.id}`;

                  const lastMessage =
                    group.lastMessage ||
                    "Group created — start the conversation";

                  const senderPrefix =
                    group.lastMessageSender
                      ? `${
                          group
                            .lastMessageSender
                            .firstname ||
                          group
                            .lastMessageSender
                            .username
                        }: `
                      : "";

                  const unreadCount =
                    group.unreadCount ??
                    0;

                  return (
                    <button
                      type="button"
                      key={group.id}
                      aria-current={
                        pathname ===
                        activePath
                          ? "page"
                          : undefined
                      }
                      onClick={() =>
                        handleGroupNavigation(
                          group.id,
                        )
                      }
                      className={`
                        flex
                        min-h-[78px]
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
                          pathname ===
                          activePath
                            ? "bg-[#f4f0fc] dark:bg-violet-950/35"
                            : "hover:bg-slate-50 dark:hover:bg-slate-900"
                        }
                      `}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="relative h-11 w-11 shrink-0">
                          {group.imageUrl ? (
                            <Image
                              src={
                                group.imageUrl
                              }
                              alt={`${group.name} avatar`}
                              fill
                              sizes="44px"
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-elitePurple/10 text-elitePurple">
                              <UsersRound
                                size={20}
                              />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 items-center gap-2">
                            <h2 className="min-w-0 flex-1 truncate text-sm font-black text-slate-900 dark:text-white">
                              {
                                group.name
                              }
                            </h2>

                            <span className="hidden shrink-0 rounded-full bg-elitePurple/10 px-2 py-0.5 text-[9px] font-black text-elitePurple sm:inline">
                              {
                                group.memberCount
                              }{" "}
                              members
                            </span>
                          </div>

                          <p className="mt-1 truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                            {
                              senderPrefix
                            }
                            {
                              lastMessage
                            }
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <p className="whitespace-nowrap text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          {group.lastMessageDate
                            ? getAgoTiming(
                                new Date(
                                  group.lastMessageDate,
                                ),
                              )
                            : ""}
                        </p>

                        {unreadCount >
                        0 ? (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-elitePurple px-1.5 text-[10px] font-black text-white">
                            {unreadCount >
                            99
                              ? "99+"
                              : unreadCount}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                },
              )}
            </div>
          ) : (
            <div className="flex min-h-56 flex-col items-center justify-center px-5 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-elitePurple/10 text-elitePurple">
                <UsersRound
                  size={24}
                />
              </span>

              <p className="mt-3 text-sm font-black text-slate-700 dark:text-slate-200">
                {filter ===
                "unread"
                  ? "No unread groups"
                  : query
                    ? "No groups found"
                    : "No group chats yet"}
              </p>

              {filter === "all" &&
              !query ? (
                <button
                  type="button"
                  onClick={() =>
                    setCreateGroupOpen(
                      true,
                    )
                  }
                  className="mt-3 text-xs font-black text-elitePurple"
                >
                  Create your first group
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <CreateGroupModal
        open={createGroupOpen}
        onClose={() =>
          setCreateGroupOpen(false)
        }
        availableUsers={
          availableUsers
        }
      />

      {createGroupOpen &&
      usersLoading ? (
        <div className="pointer-events-none fixed inset-0 z-[95] flex items-center justify-center bg-black/10">
          <p className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-lg dark:bg-slate-900 dark:text-white">
            Loading users...
          </p>
        </div>
      ) : null}
    </>
  );
};

export default GroupChatsList;

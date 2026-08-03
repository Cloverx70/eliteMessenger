"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  Crown,
  LogOut,
  Play,
  Shield,
  Trash2,
  UserMinus,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import Image from "next/image";
import {
  useParams,
  usePathname,
  useRouter,
} from "next/navigation";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { AttachmentType } from "../../chats/action";
import {
  DeleteGroup,
  GetAvailableGroupUsers,
  GetGroupInfo,
  GroupMemberRole,
  LeaveGroup,
  RemoveGroupMember,
  UpdateGroupMemberRole,
} from "../group-action";
import AddGroupMembersModal from "./AddGroupMembersModal";

type SelectedMedia = {
  url: string;
  type: AttachmentType;
};

const GroupChatProfile = () => {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient =
    useQueryClient();

  const rawGroupId = params.gid;

  const groupId =
    Array.isArray(rawGroupId)
      ? rawGroupId[0]
      : (rawGroupId ?? "");

  const [
    showAllMedia,
    setShowAllMedia,
  ] = useState(false);

  const [
    selectedMedia,
    setSelectedMedia,
  ] =
    useState<SelectedMedia | null>(
      null,
    );

  const [
    addMembersOpen,
    setAddMembersOpen,
  ] = useState(false);

  const {
    data: groupInfo,
  } = useQuery({
    queryKey: [
      "GROUP_INFO",
      groupId,
    ],
    queryFn: () =>
      GetGroupInfo(groupId),
    enabled:
      Boolean(groupId) &&
      pathname ===
        `/groups/${groupId}`,
  });

  const {
    data: availableUsers = [],
    isLoading:
      availableUsersLoading,
  } = useQuery({
    queryKey: [
      "GROUP_AVAILABLE_USERS",
      groupId,
    ],
    queryFn: () =>
      GetAvailableGroupUsers(),
    enabled:
      addMembersOpen &&
      Boolean(groupId),
  });

  const refreshGroup =
    async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [
            "GROUP_INFO",
            groupId,
          ],
        }),
        queryClient.invalidateQueries({
          queryKey: [
            "GROUP_AND_MESSAGES",
            groupId,
          ],
        }),
        queryClient.invalidateQueries({
          queryKey: ["GROUPS"],
        }),
      ]);
    };

  const removeMemberMutation =
    useMutation({
      mutationFn: (
        memberUserId: string,
      ) =>
        RemoveGroupMember(
          groupId,
          memberUserId,
        ),
      onSuccess: refreshGroup,
    });

  const updateRoleMutation =
    useMutation({
      mutationFn: ({
        memberUserId,
        role,
      }: {
        memberUserId: string;
        role: GroupMemberRole;
      }) =>
        UpdateGroupMemberRole(
          groupId,
          memberUserId,
          role,
        ),
      onSuccess: refreshGroup,
    });

  const leaveMutation =
    useMutation({
      mutationFn: () =>
        LeaveGroup(groupId),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["GROUPS"],
        });

        router.push("/groups");
      },
    });

  const deleteMutation =
    useMutation({
      mutationFn: () =>
        DeleteGroup(groupId),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["GROUPS"],
        });

        router.push("/groups");
      },
    });

  useEffect(() => {
    const lockBody =
      showAllMedia ||
      Boolean(selectedMedia) ||
      addMembersOpen;

    if (!lockBody) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [
    showAllMedia,
    selectedMedia,
    addMembersOpen,
  ]);

  useEffect(() => {
    const handleEscape = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key !== "Escape"
      ) {
        return;
      }

      if (selectedMedia) {
        setSelectedMedia(null);
        return;
      }

      if (showAllMedia) {
        setShowAllMedia(false);
        return;
      }

      if (addMembersOpen) {
        setAddMembersOpen(false);
      }
    };

    window.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [
    selectedMedia,
    showAllMedia,
    addMembersOpen,
  ]);

  if (
    pathname !==
      `/groups/${groupId}` ||
    !groupInfo
  ) {
    return null;
  }

  const {
    group,
    members,
    media,
    links,
  } = groupInfo;

  const isOwner =
    group.currentMemberRole ===
    "OWNER";

  const isManager =
    group.currentMemberRole ===
      "OWNER" ||
    group.currentMemberRole ===
      "ADMIN";

  const canRemoveMember = (
    role: GroupMemberRole,
  ) => {
    if (
      !isManager ||
      role === "OWNER"
    ) {
      return false;
    }

    if (
      group.currentMemberRole ===
        "ADMIN" &&
      role !== "MEMBER"
    ) {
      return false;
    }

    return true;
  };

  return (
    <>
      <section
        className="
          flex
          h-full
          min-h-0
          w-full
          min-w-0
          flex-col
          gap-7
          overflow-y-auto
          overflow-x-hidden
          overscroll-contain
          px-4
          py-6
          pb-[max(1.5rem,env(safe-area-inset-bottom))]
          text-slate-900
          dark:text-white
          sm:px-6
          xl:px-7
        "
      >
        <div className="flex min-w-0 items-center gap-4 pr-12 xl:pr-0">
          <div className="relative h-[72px] w-[72px] shrink-0">
            {group.imageUrl ? (
              <Image
                src={group.imageUrl}
                alt={`${group.name} avatar`}
                fill
                sizes="72px"
                className="rounded-full object-cover"
              />
            ) : (
              <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-elitePurple/10 text-elitePurple">
                <UsersRound size={30} />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-xl font-black">
              {group.name}
            </h1>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {group.memberCount}{" "}
              {group.memberCount === 1
                ? "member"
                : "members"}
            </p>

            <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-elitePurple">
              {
                group.currentMemberRole
              }
            </p>
          </div>
        </div>

        <div className="border-b border-slate-200 pb-6 dark:border-slate-800">
          <h2 className="font-black">
            About
          </h2>

          <p className="mt-3 break-words text-sm leading-6 text-slate-600 dark:text-slate-400">
            {group.description ||
              "No group description."}
          </p>
        </div>

        <div className="border-b border-slate-200 pb-6 dark:border-slate-800">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-black">
                Members
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {members.length} total
              </p>
            </div>

            {isManager ? (
              <button
                type="button"
                onClick={() =>
                  setAddMembersOpen(
                    true,
                  )
                }
                className="
                  flex
                  h-10
                  items-center
                  gap-2
                  rounded-xl
                  bg-elitePurple/10
                  px-3
                  text-xs
                  font-black
                  text-elitePurple
                  transition
                  hover:bg-elitePurple
                  hover:text-white
                "
              >
                <UserPlus size={16} />
                Add
              </button>
            ) : null}
          </div>

          <div className="space-y-2">
            {members.map(
              (member) => {
                const initials =
                  `${member.user.firstname?.[0] ?? ""}${member.user.lastname?.[0] ?? ""}`.toUpperCase();

                return (
                  <div
                    key={member.id}
                    className="
                      flex
                      min-w-0
                      items-center
                      justify-between
                      gap-2
                      rounded-2xl
                      bg-slate-50
                      p-3
                      dark:bg-slate-900
                    "
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-200 ring-2 ring-elitePurple/70 dark:bg-neutral-700">
                        {member.user
                          .userPfpUrl ? (
                          <Image
                            src={
                              member.user
                                .userPfpUrl
                            }
                            alt={`${member.user.username}'s profile picture`}
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        ) : (
                          <span className="text-xs font-black text-neutral-600 dark:text-neutral-200">
                            {initials ||
                              "U"}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black">
                          {
                            member.user
                              .firstname
                          }{" "}
                          {
                            member.user
                              .lastname
                          }
                        </p>

                        <p className="mt-0.5 truncate text-[11px] text-slate-500">
                          @
                          {
                            member.user
                              .username
                          }
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      {member.role ===
                      "OWNER" ? (
                        <Crown
                          size={15}
                          className="text-amber-500"
                        />
                      ) : member.role ===
                        "ADMIN" ? (
                        <Shield
                          size={15}
                          className="text-elitePurple"
                        />
                      ) : null}

                      {isOwner &&
                      member.role !==
                        "OWNER" ? (
                        <select
                          value={
                            member.role
                          }
                          disabled={
                            updateRoleMutation.isPending
                          }
                          onChange={(
                            event,
                          ) => {
                            const role =
                              event
                                .target
                                .value as GroupMemberRole;

                            const transfer =
                              role ===
                              "OWNER";

                            if (
                              transfer &&
                              !window.confirm(
                                `Transfer ownership to ${member.user.username}? You will become an admin.`,
                              )
                            ) {
                              return;
                            }

                            updateRoleMutation.mutate(
                              {
                                memberUserId:
                                  member.userId,
                                role,
                              },
                            );
                          }}
                          className="
                            max-w-24
                            rounded-lg
                            border
                            border-slate-200
                            bg-white
                            px-2
                            py-1.5
                            text-[10px]
                            outline-none
                            dark:border-slate-700
                            dark:bg-slate-950
                          "
                        >
                          <option value="MEMBER">
                            Member
                          </option>
                          <option value="ADMIN">
                            Admin
                          </option>
                          <option value="OWNER">
                            Owner
                          </option>
                        </select>
                      ) : null}

                      {canRemoveMember(
                        member.role,
                      ) ? (
                        <button
                          type="button"
                          title="Remove member"
                          disabled={
                            removeMemberMutation.isPending
                          }
                          onClick={() => {
                            if (
                              window.confirm(
                                `Remove ${member.user.username} from this group?`,
                              )
                            ) {
                              removeMemberMutation.mutate(
                                member.userId,
                              );
                            }
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <UserMinus
                            size={16}
                          />
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </div>

        <div className="border-b border-slate-200 pb-6 dark:border-slate-800">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-black">
              Media
            </h2>

            {media.length > 0 ? (
              <button
                type="button"
                onClick={() =>
                  setShowAllMedia(
                    true,
                  )
                }
                className="text-xs font-black text-elitePurple"
              >
                See all
              </button>
            ) : null}
          </div>

          {media.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">
              No shared media.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {media
                .slice(0, 4)
                .map(
                  (
                    item,
                    index,
                  ) => (
                    <button
                      key={`${item.url}-${index}`}
                      type="button"
                      onClick={() =>
                        setSelectedMedia(
                          item,
                        )
                      }
                      className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900"
                    >
                      {item.type ===
                      AttachmentType.IMAGE ? (
                        <Image
                          src={item.url}
                          alt="Group media"
                          fill
                          sizes="150px"
                          className="object-cover transition hover:scale-105"
                        />
                      ) : (
                        <>
                          <video
                            src={item.url}
                            muted
                            preload="metadata"
                            className="h-full w-full object-cover"
                          />

                          <span className="absolute inset-0 flex items-center justify-center bg-black/15">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white">
                              <Play
                                size={15}
                                fill="currentColor"
                              />
                            </span>
                          </span>
                        </>
                      )}
                    </button>
                  ),
                )}
            </div>
          )}
        </div>

        <div className="border-b border-slate-200 pb-6 dark:border-slate-800">
          <h2 className="font-black">
            Shared links
          </h2>

          <div className="mt-4 space-y-3">
            {links.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500">
                No shared links.
              </p>
            ) : (
              links
                .slice(0, 5)
                .map(
                  (
                    link,
                    index,
                  ) => (
                    <a
                      key={`${link.url}-${index}`}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="
                        block
                        min-w-0
                        rounded-2xl
                        bg-slate-100
                        p-3
                        transition
                        hover:bg-elitePurple
                        hover:text-white
                        dark:bg-slate-900
                      "
                    >
                      <p className="truncate text-xs font-black">
                        {
                          link.name
                        }
                      </p>

                      <p className="mt-1 truncate text-[10px] opacity-70">
                        {
                          link.url
                        }
                      </p>
                    </a>
                  ),
                )
            )}
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            disabled={
              leaveMutation.isPending
            }
            onClick={() => {
              if (
                window.confirm(
                  "Leave this group?",
                )
              ) {
                leaveMutation.mutate();
              }
            }}
            className="
              flex
              min-h-12
              w-full
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-red-200
              px-4
              py-3
              text-sm
              font-black
              text-red-500
              transition
              hover:bg-red-50
              disabled:opacity-50
              dark:border-red-900
              dark:hover:bg-red-950/30
            "
          >
            <LogOut size={17} />
            Leave group
          </button>

          {isOwner ? (
            <button
              type="button"
              disabled={
                deleteMutation.isPending
              }
              onClick={() => {
                if (
                  window.confirm(
                    "Delete this group? This action hides it for every member.",
                  )
                ) {
                  deleteMutation.mutate();
                }
              }}
              className="
                flex
                min-h-12
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-red-500
                px-4
                py-3
                text-sm
                font-black
                text-white
                transition
                hover:bg-red-600
                disabled:opacity-50
              "
            >
              <Trash2 size={17} />
              Delete group
            </button>
          ) : null}
        </div>
      </section>

      <AddGroupMembersModal
        open={addMembersOpen}
        onClose={() =>
          setAddMembersOpen(false)
        }
        groupId={groupId}
        availableUsers={
          availableUsers
        }
        existingUserIds={members.map(
          (member) =>
            member.userId,
        )}
      />

      {addMembersOpen &&
      availableUsersLoading ? (
        <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-black/10">
          <p className="rounded-xl bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-lg dark:bg-slate-900 dark:text-white">
            Loading users...
          </p>
        </div>
      ) : null}

      {showAllMedia ? (
        <div
          className="
            fixed
            inset-0
            z-[80]
            flex
            items-end
            justify-center
            bg-black/60
            p-0
            backdrop-blur-sm
            sm:items-center
            sm:p-4
          "
          onClick={() =>
            setShowAllMedia(false)
          }
        >
          <div
            className="
              flex
              max-h-[92dvh]
              w-full
              flex-col
              overflow-hidden
              rounded-t-3xl
              bg-white
              shadow-2xl
              dark:bg-slate-950
              sm:max-h-[85dvh]
              sm:max-w-4xl
              sm:rounded-3xl
            "
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-800 sm:px-6">
              <div>
                <h2 className="text-lg font-black">
                  Group media
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {media.length}{" "}
                  {media.length ===
                  1
                    ? "item"
                    : "items"}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowAllMedia(
                    false,
                  )
                }
                className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900"
                aria-label="Close group media"
              >
                <X size={20} />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {media.map(
                  (
                    item,
                    index,
                  ) => (
                    <button
                      key={`${item.url}-${index}`}
                      type="button"
                      onClick={() =>
                        setSelectedMedia(
                          item,
                        )
                      }
                      className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900"
                    >
                      {item.type ===
                      AttachmentType.IMAGE ? (
                        <Image
                          src={item.url}
                          alt="Group media"
                          fill
                          sizes="(max-width: 640px) 50vw, 200px"
                          className="object-cover transition hover:scale-105"
                        />
                      ) : (
                        <>
                          <video
                            src={item.url}
                            muted
                            preload="metadata"
                            className="h-full w-full object-cover"
                          />

                          <span className="absolute inset-0 flex items-center justify-center bg-black/15">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white">
                              <Play
                                size={16}
                                fill="currentColor"
                              />
                            </span>
                          </span>
                        </>
                      )}
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {selectedMedia ? (
        <div
          className="
            fixed
            inset-0
            z-[110]
            flex
            items-center
            justify-center
            bg-black/95
            p-3
            pt-[max(0.75rem,env(safe-area-inset-top))]
            pb-[max(0.75rem,env(safe-area-inset-bottom))]
          "
          onClick={() =>
            setSelectedMedia(null)
          }
        >
          <button
            type="button"
            onClick={() =>
              setSelectedMedia(null)
            }
            className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur sm:right-5"
            aria-label="Close media preview"
          >
            <X size={24} />
          </button>

          <div
            className="relative flex h-full max-h-[92dvh] w-full max-w-6xl items-center justify-center"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {selectedMedia.type ===
            AttachmentType.IMAGE ? (
              <Image
                src={
                  selectedMedia.url
                }
                alt="Fullscreen group media"
                fill
                priority
                sizes="100vw"
                className="object-contain"
              />
            ) : (
              <video
                src={
                  selectedMedia.url
                }
                controls
                autoPlay
                className="max-h-full max-w-full object-contain"
              />
            )}
          </div>
        </div>
      ) : null}
    </>
  );
};

export default GroupChatProfile;

//////////

"use client";

import {
  Crown,
  LogOut,
  Shield,
  Trash2,
  UserMinus,
  UsersRound,
  X,
} from "lucide-react";
import {
  DeleteGroup,
  GetGroupInfo,
  GroupMemberRole,
  LeaveGroup,
  RemoveGroupMember,
  UpdateGroupMemberRole,
} from "../group-action";
import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, usePathname, useRouter } from "next/navigation";

import { AttachmentType } from "../../chats/action";
import Image from "next/image";

type SelectedMedia = {
  url: string;
  type: AttachmentType;
};

const GroupChatProfile = () => {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const rawGroupId = params.gid;
  const groupId = Array.isArray(rawGroupId)
    ? rawGroupId[0]
    : (rawGroupId ?? "");

  const [showAllMedia, setShowAllMedia] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia | null>(
    null,
  );

  const { data: groupInfo } = useQuery({
    queryKey: ["GROUP_INFO", groupId],
    queryFn: () => GetGroupInfo(groupId),
    enabled: Boolean(groupId) && pathname === `/groups/${groupId}`,
  });

  const refreshGroup = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["GROUP_INFO", groupId] }),
      queryClient.invalidateQueries({
        queryKey: ["GROUP_AND_MESSAGES", groupId],
      }),
      queryClient.invalidateQueries({ queryKey: ["GROUPS"] }),
    ]);
  };

  const removeMemberMutation = useMutation({
    mutationFn: (memberUserId: string) =>
      RemoveGroupMember(groupId, memberUserId),
    onSuccess: refreshGroup,
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({
      memberUserId,
      role,
    }: {
      memberUserId: string;
      role: GroupMemberRole;
    }) => UpdateGroupMemberRole(groupId, memberUserId, role),
    onSuccess: refreshGroup,
  });

  const leaveMutation = useMutation({
    mutationFn: () => LeaveGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["GROUPS"] });
      router.push("/chats");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => DeleteGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["GROUPS"] });
      router.push("/chats");
    },
  });

  useEffect(() => {
    const lockBody = showAllMedia || selectedMedia;
    if (lockBody) document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [showAllMedia, selectedMedia]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (selectedMedia) setSelectedMedia(null);
      else if (showAllMedia) setShowAllMedia(false);
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [selectedMedia, showAllMedia]);

  if (pathname !== `/groups/${groupId}` || !groupInfo) return null;

  const { group, members, media, links } = groupInfo;
  const isOwner = group.currentMemberRole === "OWNER";
  const isManager =
    group.currentMemberRole === "OWNER" || group.currentMemberRole === "ADMIN";

  const canRemoveMember = (role: GroupMemberRole) => {
    if (!isManager || role === "OWNER") return false;
    if (group.currentMemberRole === "ADMIN" && role !== "MEMBER") return false;
    return true;
  };

  return (
    <>
      <section className="flex h-full w-full flex-col gap-8 overflow-y-auto px-8 py-8">
        <div className="flex items-center gap-5">
          {group.imageUrl ? (
            <img
              src={group.imageUrl}
              alt={`${group.name} avatar`}
              className="h-[72px] w-[72px] rounded-full object-cover"
            />
          ) : (
            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-elitePurple/10 text-elitePurple">
              <UsersRound size={30} />
            </div>
          )}

          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold">{group.name}</h1>
            <p className="text-xs text-slate-500">
              {group.memberCount}{" "}
              {group.memberCount === 1 ? "member" : "members"}
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-elitePurple">
              {group.currentMemberRole}
            </p>
          </div>
        </div>

        <div className="border-b pb-7">
          <h2 className="mb-3 font-bold">About</h2>
          <p className="break-words text-sm text-slate-600">
            {group.description || "No group description."}
          </p>
        </div>

        <div className="border-b pb-7">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">Members</h2>
            <p className="text-xs text-slate-500">{members.length}</p>
          </div>

          <div className="flex flex-col gap-3">
            {members.map((member) => {
              const initials = `${member.user.firstname?.[0] ?? ""}${
                member.user.lastname?.[0] ?? ""
              }`.toUpperCase();

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-200 ring-[2.5px] ring-elitePurple dark:bg-neutral-700">
                      {member.user.userPfpUrl ? (
                        <Image
                          src={member.user.userPfpUrl}
                          alt={`${member.user.username}'s profile picture`}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-200">
                          {initials || "U"}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {member.user.firstname} {member.user.lastname}
                      </p>
                      <p className="truncate text-[11px] text-slate-500">
                        @{member.user.username}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {member.role === "OWNER" ? (
                      <Crown size={15} className="text-amber-500" />
                    ) : member.role === "ADMIN" ? (
                      <Shield size={15} className="text-elitePurple" />
                    ) : null}

                    {isOwner && member.role !== "OWNER" && (
                      <select
                        value={member.role}
                        disabled={updateRoleMutation.isPending}
                        onChange={(event) => {
                          const role = event.target.value as GroupMemberRole;
                          const transfer = role === "OWNER";

                          if (
                            transfer &&
                            !window.confirm(
                              `Transfer ownership to ${member.user.username}? You will become an admin.`,
                            )
                          ) {
                            return;
                          }

                          updateRoleMutation.mutate({
                            memberUserId: member.userId,
                            role,
                          });
                        }}
                        className="rounded-lg border bg-white px-2 py-1 text-[10px] outline-none"
                      >
                        <option value="MEMBER">Member</option>
                        <option value="ADMIN">Admin</option>
                        <option value="OWNER">Owner</option>
                      </select>
                    )}

                    {canRemoveMember(member.role) && (
                      <button
                        type="button"
                        title="Remove member"
                        disabled={removeMemberMutation.isPending}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Remove ${member.user.username} from this group?`,
                            )
                          ) {
                            removeMemberMutation.mutate(member.userId);
                          }
                        }}
                        className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-50"
                      >
                        <UserMinus size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-b pb-7">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">Media</h2>
            {media.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAllMedia(true)}
                className="text-sm font-bold text-elitePurple"
              >
                See all
              </button>
            )}
          </div>

          {media.length === 0 ? (
            <p className="text-center text-xs text-slate-500">
              No shared media.
            </p>
          ) : (
            <div className="flex gap-3 overflow-hidden">
              {media.slice(0, 4).map((item, index) => (
                <button
                  key={`${item.url}-${index}`}
                  type="button"
                  onClick={() => setSelectedMedia(item)}
                  className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100"
                >
                  {item.type === AttachmentType.IMAGE ? (
                    <img
                      src={item.url}
                      alt="Group media"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <video
                      src={item.url.trim()}
                      muted
                      preload="metadata"
                      className="block h-full w-full object-cover"
                      onError={() => {
                        console.error("Video failed:", item.url);
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-b pb-7">
          <h2 className="mb-4 font-bold">Shared Links</h2>
          <div className="flex flex-col gap-3">
            {links.length === 0 ? (
              <p className="text-center text-xs text-slate-500">
                No shared links.
              </p>
            ) : (
              links.slice(0, 5).map((link, index) => (
                <a
                  key={`${link.url}-${index}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-slate-100 p-3 transition hover:bg-elitePurple hover:text-white"
                >
                  <p className="truncate text-xs font-bold">{link.name}</p>
                  <p className="mt-1 truncate text-[10px] opacity-70">
                    {link.url}
                  </p>
                </a>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 pb-4">
          <button
            type="button"
            disabled={leaveMutation.isPending}
            onClick={() => {
              if (window.confirm("Leave this group?")) leaveMutation.mutate();
            }}
            className="flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-50"
          >
            <LogOut size={17} /> Leave group
          </button>

          {isOwner && (
            <button
              type="button"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (
                  window.confirm(
                    "Delete this group? This action hides it for every member.",
                  )
                ) {
                  deleteMutation.mutate();
                }
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-600"
            >
              <Trash2 size={17} /> Delete group
            </button>
          )}
        </div>
      </section>

      {showAllMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowAllMedia(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-bold">Group Media</h2>
                <p className="text-xs text-slate-500">{media.length} items</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAllMedia(false)}
                className="rounded-full bg-slate-100 p-2"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {media.map((item, index) => (
                  <button
                    key={`${item.url}-${index}`}
                    type="button"
                    onClick={() => setSelectedMedia(item)}
                    className="aspect-square overflow-hidden rounded-2xl bg-slate-100"
                  >
                    {item.type === AttachmentType.IMAGE ? (
                      <img
                        src={item.url}
                        alt="Group media"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <video
                        src={item.url}
                        muted
                        className="h-full w-full object-cover"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedMedia && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <button
            type="button"
            onClick={() => setSelectedMedia(null)}
            className="absolute right-5 top-5 rounded-full bg-white/10 p-3 text-white"
          >
            <X size={24} />
          </button>

          {selectedMedia.type === AttachmentType.IMAGE ? (
            <img
              src={selectedMedia.url}
              alt="Fullscreen group media"
              className="max-h-[90vh] max-w-[90vw] object-contain"
              onClick={(event) => event.stopPropagation()}
            />
          ) : (
            <video
              src={selectedMedia.url}
              controls
              autoPlay
              className="max-h-[90vh] max-w-[90vw] object-contain"
              onClick={(event) => event.stopPropagation()}
            />
          )}
        </div>
      )}
    </>
  );
};

export default GroupChatProfile;

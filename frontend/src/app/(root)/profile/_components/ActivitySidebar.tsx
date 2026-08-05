"use client";

import {
  Heart,
  MessageCircle,
  PenSquare,
  UserPlus,
  UsersRound,
} from "lucide-react";

import ProfileAvatar from "./ProfileAvatar";
import { ProfileScreenData } from "../types";
import SectionCard from "./SectionCard";
import { profileRoutes } from "../profile-routes";
import { useRouter } from "next/navigation";

interface ActivitySidebarProps {
  profile: ProfileScreenData;
}

const activityRows = [
  { key: "postsCreated", label: "Posts created", icon: PenSquare },
  { key: "likesReceived", label: "Likes received", icon: Heart },
  { key: "commentsReceived", label: "Comments", icon: MessageCircle },
  { key: "newFriends", label: "New friends", icon: UserPlus },
  { key: "groupsJoined", label: "Groups joined", icon: UsersRound },
] as const;

export default function ActivitySidebar({ profile }: ActivitySidebarProps) {
  const router = useRouter();

  return (
    <aside className="space-y-5">
      <SectionCard
        title={profile.isOwnProfile ? "Friends" : "Mutual friends"}
        action={
          <button
            type="button"
            onClick={() => router.push(profileRoutes.friends)}
            className="text-xs font-black text-violet-700 dark:text-violet-300"
          >
            See all
          </button>
        }
      >
        <div className="px-5 pb-5">
          {profile.friendsPreview.length > 0 ? (
            <>
              <div className="flex -space-x-2">
                {profile.friendsPreview.slice(0, 6).map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    title={`@${person.username}`}
                    onClick={() =>
                      router.push(profileRoutes.user(person.username))
                    }
                    className="rounded-full ring-2 ring-white transition hover:-translate-y-1 dark:ring-slate-950"
                  >
                    <ProfileAvatar person={person} size="md" showStatus />
                  </button>
                ))}
              </div>

              <p className="mt-3 text-xs font-semibold text-slate-400">
                {profile.stats.friends.toLocaleString()} friends
              </p>
            </>
          ) : (
            <p className="text-xs text-slate-400">No friends to display yet.</p>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title={profile.isOwnProfile ? "Your groups" : "Groups"}
        action={
          <button
            type="button"
            onClick={() => router.push("/groups")}
            className="text-xs font-black text-violet-700 dark:text-violet-300"
          >
            See all
          </button>
        }
      >
        <div className="space-y-2 px-4 pb-4">
          {profile.groups.length > 0 ? (
            profile.groups.slice(0, 3).map((group) => (
              <div
                key={group.id}
                className="flex min-w-0 items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-violet-700 to-fuchsia-600 text-white">
                  {group.imageUrl ? (
                    <img
                      src={group.imageUrl}
                      alt={group.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UsersRound size={18} />
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-black text-slate-900 dark:text-white">
                    {group.name}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-slate-400">
                    {group.membersCount.toLocaleString()} members
                  </span>
                </span>

                <button
                  type="button"
                  onClick={() => router.push(profileRoutes.group(group.id))}
                  className="rounded-lg border border-violet-200 px-3 py-1.5 text-[11px] font-black text-violet-700 transition hover:bg-violet-700 hover:text-white dark:border-violet-800 dark:text-violet-300"
                >
                  Open
                </button>
              </div>
            ))
          ) : (
            <p className="px-2 pb-2 text-xs text-slate-400">No groups yet.</p>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Activity summary">
        <div className="space-y-1 px-4 pb-4">
          {activityRows.map((row) => {
            const Icon = row.icon;

            return (
              <div
                key={row.key}
                className="flex items-center gap-3 rounded-xl px-2 py-2.5"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-200">
                  <Icon size={16} />
                </span>

                <span className="min-w-0 flex-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {row.label}
                </span>

                <span className="text-xs font-black text-slate-950 dark:text-white">
                  {profile.activity[row.key].toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <section className="overflow-hidden rounded-[22px] bg-gradient-to-br from-violet-800 via-violet-700 to-fuchsia-600 p-5 text-white shadow-xl shadow-violet-700/15">
        <p className="text-base font-black">Grow your Elite circle</p>
        <p className="mt-2 max-w-xs text-xs leading-5 text-violet-100">
          Meet people with similar interests and build meaningful connections.
        </p>

        <button
          type="button"
          onClick={() => router.push(profileRoutes.friends)}
          className="mt-5 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-violet-800 transition hover:-translate-y-0.5"
        >
          Find friends
        </button>
      </section>
    </aside>
  );
}

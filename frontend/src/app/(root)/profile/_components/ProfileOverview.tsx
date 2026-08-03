"use client";

import {
  Edit3,
  Images,
  MessageSquareMore,
  Share2,
  Users,
  UsersRound,
} from "lucide-react";

import Image from "next/image";
import ProfileAvatar from "./ProfileAvatar";
import { ProfileScreenData } from "../types";
import banner from "./../../../../../public/EliteMessengerProfileBanner.png";
import toast from "react-hot-toast";

interface ProfileOverviewProps {
  profile: ProfileScreenData;
  onEdit: () => void;
}

const statItems = [
  {
    key: "posts",
    label: "Posts",
    icon: MessageSquareMore,
    iconClass: "bg-violet-50 text-violet-700 dark:bg-violet-950/50",
  },
  {
    key: "friends",
    label: "Friends",
    icon: Users,
    iconClass: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40",
  },
  {
    key: "groups",
    label: "Groups",
    icon: UsersRound,
    iconClass: "bg-orange-50 text-orange-500 dark:bg-orange-950/40",
  },
  {
    key: "media",
    label: "Media",
    icon: Images,
    iconClass: "bg-blue-50 text-blue-600 dark:bg-blue-950/40",
  },
] as const;

export default function ProfileOverview({
  profile,
  onEdit,
}: ProfileOverviewProps) {
  const { user, stats, isOwnProfile } = profile;

  const shareProfile = async () => {
    const path = `/profile/${user.username}`;
    const url =
      typeof window !== "undefined" ? `${window.location.origin}${path}` : path;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${user.firstname} ${user.lastname} on Elite Messenger`,
          url,
        });
        return;
      }

      await navigator.clipboard.writeText(url);
      toast.success("Profile link copied");
    } catch {
      // Native share sheets can be dismissed without being an error.
    }
  };

  return (
    <section className="overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_18px_55px_rgba(58,35,150,0.08)] dark:border-slate-800 dark:bg-slate-950">
      <div className="relative h-40 overflow-hidden bg-gradient-to-r from-[#3b0764] via-violet-700 to-fuchsia-500 sm:h-52">
        <Image
          src={banner}
          className="w-full h-full object-cover"
          alt="banner"
        />
      </div>

      <div className="relative px-4 pb-5 sm:px-6 lg:px-7">
        <div className="-mt-16 flex flex-col gap-4 sm:-mt-20 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end">
            <ProfileAvatar
              person={user}
              size="xl"
              showStatus
              className="rounded-full border-4 border-white shadow-xl dark:border-slate-950"
            />

            <div className="min-w-0 pb-1">
              <h1 className="truncate text-2xl font-black tracking-tight text-white dark:text-slate-950 sm:text-3xl">
                {user.firstname} {user.lastname}
              </h1>

              <p className="mt-1 text-sm font-semibold text-violet-600 dark:text-violet-300">
                @{user.username}
              </p>

              {user.bio ? (
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {user.bio}
                </p>
              ) : (
                <p className="mt-3 text-sm text-slate-400">No bio added yet.</p>
              )}
            </div>
          </div>

          <div className="grid w-full grid-cols-2 gap-2 lg:w-auto">
            {isOwnProfile ? (
              <button
                type="button"
                onClick={onEdit}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 text-sm font-black text-white shadow-lg shadow-violet-700/20 transition hover:-translate-y-0.5 hover:bg-violet-800"
              >
                <Edit3 size={17} />
                Edit profile
              </button>
            ) : (
              <button
                type="button"
                className="flex h-11 items-center justify-center rounded-xl bg-violet-700 px-4 text-sm font-black text-white"
              >
                Message
              </button>
            )}

            <button
              type="button"
              onClick={shareProfile}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:-translate-y-0.5 hover:border-violet-300 hover:text-violet-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <Share2 size={17} />
              Share
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/60 sm:grid-cols-4">
          {statItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={item.key}
                className={`flex items-center justify-center gap-3 px-4 py-4 ${
                  index > 0
                    ? "sm:border-l sm:border-slate-200 sm:dark:border-slate-800"
                    : ""
                } ${
                  index >= 2
                    ? "border-t border-slate-200 dark:border-slate-800 sm:border-t-0"
                    : ""
                }`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.iconClass}`}
                >
                  <Icon size={19} />
                </span>

                <span>
                  <span className="block text-lg font-black text-slate-950 dark:text-white">
                    {stats[item.key].toLocaleString()}
                  </span>
                  <span className="block text-[11px] font-semibold text-slate-400">
                    {item.label}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

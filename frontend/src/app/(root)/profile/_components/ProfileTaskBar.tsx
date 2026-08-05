"use client";

import { Bell, Plus, Search } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { ProfileUser } from "../types";
import { profileRoutes } from "../profile-routes";
import ProfileAvatar from "./ProfileAvatar";

interface ProfileTaskBarProps {
  user: ProfileUser;
}

export default function ProfileTaskBar({
  user,
}: ProfileTaskBarProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = search.trim();
    if (!normalized) return;
    router.push(`/discover?search=${encodeURIComponent(normalized)}`);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-[#f8f7fc]/90 px-4 py-3 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <form
          onSubmit={submitSearch}
          className="hidden h-12 min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex"
        >
          <Search size={19} className="shrink-0 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search creators, posts, groups..."
            className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
          />
        </form>

        <button
          type="button"
          onClick={() => router.push(profileRoutes.notifications)}
          aria-label="Open notifications"
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:text-violet-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <Bell size={20} />
        </button>

        <button
          type="button"
          onClick={() => router.push(profileRoutes.createPost)}
          className="flex h-11 shrink-0 items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-700 to-fuchsia-600 px-4 text-sm font-black text-white shadow-lg shadow-violet-600/20 transition hover:-translate-y-0.5 hover:brightness-110"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Create</span>
        </button>

        <div className="hidden min-w-0 items-center gap-3 rounded-2xl px-2 py-1.5 md:flex">
          <ProfileAvatar person={user} size="sm" showStatus />
          <span className="min-w-0 text-left">
            <span className="block truncate text-xs font-black text-slate-900 dark:text-white">
              {user.firstname} {user.lastname}
            </span>
            <span className="block truncate text-[11px] text-slate-400">
              @{user.username}
            </span>
          </span>
        </div>
      </div>
    </header>
  );
}

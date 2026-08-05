"use client";

import {
  Bell,
  ImageIcon,
  Plus,
  Search,
  SlidersHorizontal,
  Video,
  X,
} from "lucide-react";
import { DiscoverFeedTab, PostAttachmentType } from "../../types";

interface DiscoverHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  tab: DiscoverFeedTab;
  onTabChange: (value: DiscoverFeedTab) => void;
  mediaType?: PostAttachmentType;
  onMediaTypeChange: (value?: PostAttachmentType) => void;
  onCreate: () => void;
}

const tabs: Array<{ value: DiscoverFeedTab; label: string }> = [
  { value: DiscoverFeedTab.FOR_YOU, label: "For You" },
  { value: DiscoverFeedTab.FOLLOWING, label: "Following" },
  { value: DiscoverFeedTab.TRENDING, label: "Trending" },
  { value: DiscoverFeedTab.EXPLORE, label: "Explore" },
];

export function DiscoverHeader({
  search,
  onSearchChange,
  tab,
  onTabChange,
  mediaType,
  onMediaTypeChange,
  onCreate,
}: DiscoverHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/90 px-4 pb-3 pt-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 sm:px-6">
      <div className="flex items-center gap-3">
        <label className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 shadow-sm transition focus-within:border-violet-400 focus-within:bg-white dark:border-slate-800 dark:bg-slate-900 dark:focus-within:bg-slate-950">
          <Search size={18} className="shrink-0 text-slate-400" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search creators and posts..."
            className="min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
          />
          {search ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          ) : null}
        </label>

        <button
          type="button"
          className="relative hidden h-11 w-11 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900 sm:flex"
          aria-label="Notifications"
        >
          <Bell size={21} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-violet-600 ring-2 ring-white dark:ring-slate-950" />
        </button>

        <button
          type="button"
          onClick={onCreate}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition hover:-translate-y-0.5 hover:shadow-violet-500/30"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Create</span>
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 overflow-x-auto">
        <nav className="flex min-w-max items-center gap-1">
          {tabs.map((item) => {
            const active = item.value === tab;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onTabChange(item.value)}
                className={`relative px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "text-violet-700 dark:text-violet-400"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                {item.label}
                {active ? (
                  <span className="absolute inset-x-3 -bottom-1 h-0.5 rounded-full bg-violet-600" />
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="flex min-w-max items-center gap-2">
          <button
            type="button"
            onClick={() =>
              onMediaTypeChange(
                mediaType === PostAttachmentType.IMAGE
                  ? undefined
                  : PostAttachmentType.IMAGE,
              )
            }
            className={`flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition ${
              mediaType === PostAttachmentType.IMAGE
                ? "border-violet-600 bg-violet-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-violet-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
            }`}
          >
            <ImageIcon size={15} /> Photos
          </button>
          <button
            type="button"
            onClick={() =>
              onMediaTypeChange(
                mediaType === PostAttachmentType.VIDEO
                  ? undefined
                  : PostAttachmentType.VIDEO,
              )
            }
            className={`flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition ${
              mediaType === PostAttachmentType.VIDEO
                ? "border-violet-600 bg-violet-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-violet-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
            }`}
          >
            <Video size={15} /> Videos
          </button>
          <button
            type="button"
            className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition hover:border-violet-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
          >
            <SlidersHorizontal size={15} /> Filter
          </button>
        </div>
      </div>
    </header>
  );
}

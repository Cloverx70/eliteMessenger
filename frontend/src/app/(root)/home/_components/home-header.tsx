import Link from 'next/link';
import { Bell, Search } from 'lucide-react';

import { homeIntegrationRoutes } from '../integration-routes';
import type { HomeUser } from '../types';
import { getGreeting } from '../utils';
import Avatar from './avatar';

interface HomeHeaderProps {
  user: HomeUser | null | undefined;
  unreadCount: number;
  search: string;
  onSearchChange: (value: string) => void;
}

export default function HomeHeader({
  user,
  unreadCount,
  search,
  onSearchChange,
}: HomeHeaderProps) {
  const firstName = user?.firstname?.trim();
  const displayName = firstName || user?.username || '';
  const fullName = user
    ? [user.firstname, user.lastname].filter(Boolean).join(' ') ||
      user.username
    : 'Elite user';

  return (
    <header className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8b64ed]">
          Elite home
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.045em] text-[#17132f] sm:text-[36px]">
          {getGreeting()}
          {displayName ? `, ${displayName}` : ''}
          <span aria-hidden="true"> 👋</span>
        </h1>
        <p className="mt-2 text-sm text-[#7c7694]">
          Pick up your conversations and see what changed while you were away.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-2xl border border-[#e7e2f1] bg-white px-4 shadow-[0_10px_35px_rgba(49,33,92,0.05)] sm:w-[360px]">
          <Search size={18} className="shrink-0 text-[#8c83a8]" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search your dashboard..."
            aria-label="Search dashboard"
            className="min-w-0 flex-1 bg-transparent text-sm text-[#211b3a] outline-none placeholder:text-[#a19ab5]"
          />
          {search ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="rounded-lg px-2 py-1 text-[11px] font-semibold text-[#796f94] hover:bg-[#f5f2fb]"
            >
              Clear
            </button>
          ) : null}
        </label>

        <Link
          href={homeIntegrationRoutes.pages.notifications}
          aria-label="Open notifications"
          className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#e7e2f1] bg-white text-[#4f456b] shadow-[0_10px_35px_rgba(49,33,92,0.05)] transition hover:-translate-y-0.5 hover:text-[#6d36ed]"
        >
          <Bell size={19} />
          {unreadCount > 0 ? (
            <span className="absolute -right-1.5 -top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#6d36ed] px-1 text-[10px] font-bold text-white ring-2 ring-[#f8f7fc]">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : null}
        </Link>

        <Link
          href={
            user?.username
              ? homeIntegrationRoutes.pages.profile(user.username)
              : homeIntegrationRoutes.pages.friends
          }
          aria-label="Open profile"
          className="hidden rounded-full ring-2 ring-transparent transition hover:ring-[#c9b4ff] sm:block"
        >
          <Avatar
            src={user?.userPfpUrl}
            name={fullName}
            size="md"
            online={Boolean(user?.isActive)}
          />
        </Link>
      </div>
    </header>
  );
}

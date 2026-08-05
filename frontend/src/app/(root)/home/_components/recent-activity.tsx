import Link from 'next/link';
import { Bell, Circle } from 'lucide-react';

import { homeIntegrationRoutes } from '../integration-routes';
import type { HomeNotification } from '../types';
import { formatRelativeTime } from '../utils';
import Avatar from './avatar';
import SectionCard from './section-card';
import { EmptyState, ErrorState, SectionSkeleton } from './section-state';

interface RecentActivityProps {
  notifications: HomeNotification[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export default function RecentActivity({
  notifications,
  isLoading,
  isError,
  onRetry,
}: RecentActivityProps) {
  return (
    <SectionCard
      title="Recent activity"
      description="The latest reactions, requests, mentions, and alerts."
      actionLabel="View all"
      actionHref={homeIntegrationRoutes.pages.notifications}
    >
      {isLoading ? <SectionSkeleton rows={4} /> : null}
      {!isLoading && isError ? <ErrorState onRetry={onRetry} /> : null}

      {!isLoading && !isError && notifications.length === 0 ? (
        <EmptyState
          title="You are all caught up"
          description="New notifications will appear here as activity happens."
        />
      ) : null}

      {!isLoading && !isError && notifications.length > 0 ? (
        <div className="divide-y divide-[#f0edf5] px-5 pb-2 sm:px-6">
          {notifications.slice(0, 5).map((notification) => {
            const actorName = notification.actor
              ? [
                  notification.actor.firstname,
                  notification.actor.lastname,
                ]
                  .filter(Boolean)
                  .join(' ') || notification.actor.username
              : 'Elite Messenger';

            return (
              <Link
                key={notification.id}
                href={notification.href}
                className="group flex items-start gap-3 py-4"
              >
                {notification.actor ? (
                  <Avatar
                    src={notification.actor.userPfpUrl}
                    name={actorName}
                    size="sm"
                  />
                ) : (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eee8ff] text-[#7141e9]">
                    <Bell size={16} />
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="line-clamp-2 text-xs font-semibold leading-5 text-[#2b2543] transition group-hover:text-[#6833df]">
                      {notification.title}
                    </p>
                    <span className="shrink-0 text-[10px] text-[#9b94ad]">
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-[#8c859f]">
                    {notification.description}
                  </p>
                </div>

                {!notification.isRead ? (
                  <Circle
                    size={8}
                    fill="currentColor"
                    className="mt-1 shrink-0 text-[#6d36ed]"
                  />
                ) : null}
              </Link>
            );
          })}
        </div>
      ) : null}
    </SectionCard>
  );
}

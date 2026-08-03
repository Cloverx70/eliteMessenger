import Link from 'next/link';
import { UserPlus } from 'lucide-react';

import { homeIntegrationRoutes } from '../integration-routes';
import type { HomeSuggestedUser } from '../types';
import Avatar from './avatar';
import SectionCard from './section-card';
import { EmptyState, SectionSkeleton } from './section-state';

interface SuggestedFriendsProps {
  users: HomeSuggestedUser[];
  isLoading: boolean;
}

export default function SuggestedFriends({
  users,
  isLoading,
}: SuggestedFriendsProps) {
  return (
    <SectionCard
      title="Suggested for you"
      description="People you may know through mutual connections."
      actionLabel="View all"
      actionHref={homeIntegrationRoutes.pages.friends}
    >
      {isLoading ? <SectionSkeleton rows={3} /> : null}

      {!isLoading && users.length === 0 ? (
        <EmptyState
          title="No suggestions right now"
          description="Open Friends to search by name or username."
        />
      ) : null}

      {!isLoading && users.length > 0 ? (
        <div className="space-y-1 px-4 pb-4 sm:px-5 sm:pb-5">
          {users.slice(0, 4).map((user) => {
            const name =
              [user.firstname, user.lastname].filter(Boolean).join(' ') ||
              user.username;

            return (
              <div
                key={user.id}
                className="flex items-center gap-3 rounded-2xl px-2 py-3 transition hover:bg-[#faf8fe]"
              >
                <Link
                  href={homeIntegrationRoutes.pages.profile(user.username)}
                  className="shrink-0"
                >
                  <Avatar
                    src={user.userPfpUrl}
                    name={name}
                    size="sm"
                    online={Boolean(user.isActive)}
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  <Link
                    href={homeIntegrationRoutes.pages.profile(user.username)}
                    className="block truncate text-xs font-bold text-[#28213f] hover:text-[#6d36ed]"
                  >
                    {name}
                  </Link>
                  <p className="truncate text-[10px] text-[#8f879f]">
                    @{user.username}
                    {user.mutualFriendCount > 0
                      ? ` • ${user.mutualFriendCount} mutual friends`
                      : ''}
                  </p>
                </div>

                <Link
                  href={homeIntegrationRoutes.pages.friends}
                  aria-label={`Open friends to connect with ${name}`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#f0eaff] text-[#6d36ed] transition hover:bg-[#6d36ed] hover:text-white"
                >
                  <UserPlus size={15} />
                </Link>
              </div>
            );
          })}
        </div>
      ) : null}
    </SectionCard>
  );
}

import Link from 'next/link';
import { Heart, MessageCircle, Share2 } from 'lucide-react';

import { homeIntegrationRoutes } from '../integration-routes';
import type { HomePost } from '../types';
import { formatRelativeTime } from '../utils';
import Avatar from './avatar';
import SectionCard from './section-card';
import { EmptyState, ErrorState, SectionSkeleton } from './section-state';

interface DiscoverPreviewProps {
  posts: HomePost[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export default function DiscoverPreview({
  posts,
  isLoading,
  isError,
  onRetry,
}: DiscoverPreviewProps) {
  return (
    <SectionCard
      title="What’s new"
      description="A small preview from Discover—not another full feed."
      actionLabel="Explore Discover"
      actionHref={homeIntegrationRoutes.pages.discover}
    >
      {isLoading ? <SectionSkeleton rows={2} /> : null}
      {!isLoading && isError ? <ErrorState onRetry={onRetry} /> : null}

      {!isLoading && !isError && posts.length === 0 ? (
        <EmptyState
          title="No posts to show"
          description="Create the first post or visit Discover to meet more people."
        />
      ) : null}

      {!isLoading && !isError && posts.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 px-5 pb-5 sm:px-6 sm:pb-6 lg:grid-cols-2">
          {posts.slice(0, 2).map((post) => {
            const authorName =
              [post.author.firstname, post.author.lastname]
                .filter(Boolean)
                .join(' ') || post.author.username;
            const attachment = post.attachments[0];

            return (
              <article
                key={post.id}
                className="overflow-hidden rounded-[22px] border border-[#ece8f4] bg-[#fcfbfe]"
              >
                <div className="flex items-center gap-3 p-4">
                  <Avatar
                    src={post.author.userPfpUrl}
                    name={authorName}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-[#28213f]">
                      {authorName}
                    </p>
                    <p className="text-[10px] text-[#968fa8]">
                      @{post.author.username} •{' '}
                      {formatRelativeTime(post.createdAt)}
                    </p>
                  </div>
                </div>

                {post.caption ? (
                  <p className="line-clamp-3 px-4 pb-4 text-xs leading-5 text-[#5f5873]">
                    {post.caption}
                  </p>
                ) : null}

                {attachment ? (
                  <Link href={post.href} className="block">
                    {attachment.type === 'VIDEO' ? (
                      <video
                        src={attachment.url}
                        muted
                        playsInline
                        preload="metadata"
                        className="h-52 w-full bg-[#eeeaf5] object-cover"
                      />
                    ) : (
                      <img
                        src={attachment.url}
                        alt={post.caption || `Post by ${authorName}`}
                        loading="lazy"
                        className="h-52 w-full bg-[#eeeaf5] object-cover"
                      />
                    )}
                  </Link>
                ) : null}

                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="flex items-center gap-4 text-[11px] font-medium text-[#746d88]">
                    <span className="inline-flex items-center gap-1.5">
                      <Heart size={15} />
                      {post.likeCount}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MessageCircle size={15} />
                      {post.commentCount}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Share2 size={15} />
                      {post.shareCount}
                    </span>
                  </div>

                  <Link
                    href={post.href}
                    className="text-[11px] font-bold text-[#6d36ed] hover:underline"
                  >
                    Open post
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </SectionCard>
  );
}

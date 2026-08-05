import Link from 'next/link';
import { FileText, Play } from 'lucide-react';

import { homeIntegrationRoutes } from '../integration-routes';
import type { HomeMediaItem } from '../types';
import SectionCard from './section-card';
import { EmptyState, ErrorState, SectionSkeleton } from './section-state';

interface RecentMediaProps {
  items: HomeMediaItem[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export default function RecentMedia({
  items,
  isLoading,
  isError,
  onRetry,
}: RecentMediaProps) {
  return (
    <SectionCard
      title="Recent shared media"
      description="The latest files from direct and group conversations."
      actionLabel="View all"
      actionHref={homeIntegrationRoutes.pages.media}
    >
      {isLoading ? <SectionSkeleton rows={2} /> : null}
      {!isLoading && isError ? <ErrorState onRetry={onRetry} /> : null}

      {!isLoading && !isError && items.length === 0 ? (
        <EmptyState
          title="No shared media yet"
          description="Images, videos, and documents from chats will appear here."
        />
      ) : null}

      {!isLoading && !isError && items.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 px-5 pb-5 sm:px-6 sm:pb-6">
          {items.slice(0, 6).map((item) => {
            const isImage = item.type === 'IMAGE';
            const isVideo = item.type === 'VIDEO';

            return (
              <Link
                key={item.id}
                href={item.href}
                title={`From ${item.senderName}`}
                className="group relative aspect-square overflow-hidden rounded-2xl bg-[#eeeaf5]"
              >
                {isImage ? (
                  <img
                    src={item.url}
                    alt={item.filename || `Media from ${item.senderName}`}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : isVideo ? (
                  <>
                    <video
                      src={item.url}
                      muted
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/15 text-white">
                      <Play size={18} fill="currentColor" />
                    </span>
                  </>
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#f4f0fc] px-2 text-center text-[#7140e8]">
                    <FileText size={22} />
                    <span className="line-clamp-2 text-[9px] font-semibold">
                      {item.filename || 'Shared file'}
                    </span>
                  </div>
                )}

                <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/65 to-transparent px-2 pb-2 pt-5 text-[9px] font-medium text-white opacity-0 transition group-hover:opacity-100">
                  {item.senderName}
                </span>
              </Link>
            );
          })}
        </div>
      ) : null}
    </SectionCard>
  );
}

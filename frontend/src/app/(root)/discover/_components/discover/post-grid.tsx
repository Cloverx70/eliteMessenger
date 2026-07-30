"use client";

import { DiscoverPost } from "../../types";
import { LoaderCircle } from "lucide-react";
import { PostTile } from "./post-tile";

interface PostGridProps {
  posts: DiscoverPost[];
  selectedPostId: string | null;
  onSelectPost: (postId: string) => void;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  sentinelRef: (node: HTMLDivElement | null) => void;
}

export function PostGrid({
  posts,
  selectedPostId,
  onSelectPost,
  isLoading,
  isFetchingNextPage,
  sentinelRef,
}: PostGridProps) {
  if (isLoading) {
    return (
      <div className="columns-1 gap-4 sm:columns-2 2xl:columns-3">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="mb-4 h-[280px] break-inside-avoid animate-pulse rounded-[22px] bg-slate-200 dark:bg-slate-800"
            style={{ height: 220 + ((index * 47) % 180) }}
          />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/70 p-10 text-center dark:border-slate-700 dark:bg-slate-950/60">
        <div>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-2xl dark:bg-violet-950">
            ✦
          </div>
          <h2 className="mt-4 text-lg font-black text-slate-900 dark:text-white">
            Nothing here yet
          </h2>
          <p className="mt-2 max-w-sm text-sm text-slate-500">
            Try another tab, clear the search, or create the first post.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="columns-1 gap-4 sm:columns-2 2xl:columns-3">
        {posts.map((post) => (
          <PostTile
            key={post.id}
            post={post}
            selected={selectedPostId === post.id}
            onSelect={() => onSelectPost(post.id)}
          />
        ))}
      </div>

      <div ref={sentinelRef} className="flex h-16 items-center justify-center">
        {isFetchingNextPage ? (
          <LoaderCircle className="animate-spin text-violet-600" size={24} />
        ) : null}
      </div>
    </>
  );
}

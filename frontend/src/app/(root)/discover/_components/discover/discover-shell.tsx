"use client";

import { DiscoverFeedTab, PostAttachmentType } from "../../types";
import { ImageIcon, Sparkles } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CreatePostModal } from "./create-post-modal";
import { DiscoverHeader } from "./discover-header";
import { PostDetailPanel } from "./post-detail-panel";
import { PostGrid } from "./post-grid";
import { useDebouncedValue } from "@/app/hooks/use-debounced-value";
import { useDiscoverFeed } from "@/app/hooks/use-discover-posts";

export function DiscoverShell() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedPostId = searchParams.get("post");

  const [tab, setTab] = useState(DiscoverFeedTab.FOR_YOU);
  const [search, setSearch] = useState("");
  const [mediaType, setMediaType] = useState<PostAttachmentType | undefined>();
  const [createOpen, setCreateOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search);

  const filters = useMemo(
    () => ({
      tab,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(mediaType ? { mediaType } : {}),
    }),
    [debouncedSearch, mediaType, tab],
  );

  const feed = useDiscoverFeed(filters);
  const posts = feed.data?.pages.flatMap((page) => page.items) ?? [];

  const setSelectedPost = useCallback(
    (postId: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (postId) params.set("post", postId);
      else params.delete("post");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || !feed.hasNextPage || feed.isFetchingNextPage) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) void feed.fetchNextPage();
        },
        { rootMargin: "400px" },
      );

      observer.observe(node);
      return () => observer.disconnect();
    },
    [feed],
  );

  return (
    <section className="h-full min-h-screen bg-[#f8f9fc] dark:bg-slate-950">
      <div
        className={`grid min-h-screen ${
          selectedPostId
            ? "xl:grid-cols-[minmax(0,1fr)_420px]"
            : "grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_360px]"
        }`}
      >
        <main className="min-w-0">
          <DiscoverHeader
            search={search}
            onSearchChange={setSearch}
            tab={tab}
            onTabChange={setTab}
            mediaType={mediaType}
            onMediaTypeChange={setMediaType}
            onCreate={() => setCreateOpen(true)}
          />

          <div className="px-4 py-5 sm:px-6">
            {feed.isError ? (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-600 dark:border-red-950 dark:bg-red-950/20">
                Could not load Discover posts.
              </div>
            ) : null}

            <PostGrid
              posts={posts}
              selectedPostId={selectedPostId}
              onSelectPost={setSelectedPost}
              isLoading={feed.isLoading}
              isFetchingNextPage={feed.isFetchingNextPage}
              sentinelRef={sentinelRef}
            />
          </div>
        </main>

        {selectedPostId ? (
          <aside className="fixed inset-0 z-40 overflow-hidden border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 xl:sticky xl:top-0 xl:z-10 xl:h-screen xl:shadow-none">
            <PostDetailPanel
              postId={selectedPostId}
              onClose={() => setSelectedPost(null)}
              onRemoved={() => setSelectedPost(null)}
            />
          </aside>
        ) : (
          <aside className="hidden border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 2xl:block">
            <div className="sticky top-0 flex h-screen items-center justify-center p-8 text-center">
              <div>
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 to-purple-700 text-white shadow-xl shadow-violet-500/20">
                  <Sparkles size={31} />
                </div>
                <h2 className="mt-5 text-xl font-black text-slate-900 dark:text-white">
                  Discover something elite
                </h2>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-500">
                  Select a post to open the full media, comments, sharing, and
                  save controls.
                </p>
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white"
                >
                  <ImageIcon size={17} /> Create a post
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      <CreatePostModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(postId) => setSelectedPost(postId)}
      />
    </section>
  );
}

/* eslint-disable @next/next/no-img-element */
"use client";

import {
  Bookmark,
  EllipsisVertical,
  Heart,
  LoaderCircle,
  MessageCircle,
  Send,
  Trash2,
  UserRoundX,
  X,
} from "lucide-react";
import { deletePost, hidePost } from "../../action";
import {
  discoverKeys,
  usePostDetail,
  usePostEngagement,
} from "@/app/hooks/use-discover-posts";
import {
  formatCompactNumber,
  formatPostTime,
  getAuthorName,
} from "./discover-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { CommentsSection } from "./comments-section";
import { PostMediaCarousel } from "./post-media-carousel";
import { ReportPostModal } from "./report-post-modal";
import { SharePostModal } from "./share-post-modal";
import { toast } from "react-hot-toast";
import { useState } from "react";

interface PostDetailPanelProps {
  postId: string;
  onClose: () => void;
  onRemoved: () => void;
}

export function PostDetailPanel({
  postId,
  onClose,
  onRemoved,
}: PostDetailPanelProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const queryClient = useQueryClient();
  const postQuery = usePostDetail(postId);
  const { likeMutation, saveMutation } = usePostEngagement(postId);

  const removeMutation = useMutation({
    mutationFn: async (action: "delete" | "hide") => {
      if (action === "delete") return deletePost(postId);
      return hidePost(postId);
    },
    onSuccess: async (_data, action) => {
      toast.success(action === "delete" ? "Post deleted." : "Post hidden.");
      await queryClient.invalidateQueries({ queryKey: discoverKeys.feeds });
      queryClient.removeQueries({ queryKey: discoverKeys.post(postId) });
      onRemoved();
    },
    onError: () => toast.error("Could not complete this action."),
  });

  if (postQuery.isLoading) {
    return (
      <div className="flex h-full min-h-[520px] items-center justify-center bg-white dark:bg-slate-950">
        <LoaderCircle size={28} className="animate-spin text-violet-600" />
      </div>
    );
  }

  if (postQuery.isError || !postQuery.data) {
    return (
      <div className="flex h-full min-h-[520px] flex-col items-center justify-center bg-white p-8 text-center dark:bg-slate-950">
        <p className="font-black text-slate-900 dark:text-white">
          Could not open this post
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white"
        >
          Close
        </button>
      </div>
    );
  }

  const post = postQuery.data;

  return (
    <>
      <article className="flex h-full min-h-0 flex-col bg-white dark:bg-slate-950">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-900"
            aria-label="Close post"
          >
            <X size={20} />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-900"
              aria-label="Post options"
            >
              <EllipsisVertical size={20} />
            </button>

            {menuOpen ? (
              <div className="absolute right-0 top-12 z-20 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-950">
                {post.viewer.isAuthor ? (
                  <button
                    type="button"
                    onClick={() => removeMutation.mutate("delete")}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <Trash2 size={16} /> Delete post
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setReportOpen(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
                    >
                      <UserRoundX size={16} /> Report post
                    </button>
                    <button
                      type="button"
                      onClick={() => removeMutation.mutate("hide")}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
                    >
                      <X size={16} /> Hide post
                    </button>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex items-center gap-3 px-4 py-4">
            {post.author.userPfpUrl ? (
              <img
                src={post.author.userPfpUrl}
                alt={getAuthorName(post)}
                className="h-11 w-11 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-100 text-sm font-black text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                {post.author.firstname?.[0]?.toUpperCase() ??
                  post.author.username[0]?.toUpperCase()}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-slate-900 dark:text-white">
                {getAuthorName(post)}
              </p>
              <p className="truncate text-xs font-medium text-slate-400">
                @{post.author.username} · {formatPostTime(post.createdAt)} ago
              </p>
            </div>
          </div>

          <div className="px-4">
            {post.attachments.length > 0 ? (
              <PostMediaCarousel attachments={post.attachments} compact />
            ) : null}

            {post.caption ? (
              <p className="whitespace-pre-wrap px-1 pb-4 pt-3 text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-200">
                {post.caption}
              </p>
            ) : null}
          </div>

          <div className="flex items-center justify-between border-y border-slate-200 px-4 py-3 dark:border-slate-800">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => likeMutation.mutate(!post.viewer.liked)}
                disabled={likeMutation.isPending}
                className={`flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold transition ${
                  post.viewer.liked
                    ? "bg-rose-50 text-rose-600 dark:bg-rose-950/30"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
                }`}
              >
                <Heart
                  size={19}
                  fill={post.viewer.liked ? "currentColor" : "none"}
                />
                {formatCompactNumber(post.likeCount)}
              </button>

              <span className="flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-600 dark:text-slate-300">
                <MessageCircle size={19} />
                {formatCompactNumber(post.commentCount)}
              </span>

              <button
                type="button"
                onClick={() => setShareOpen(true)}
                className="flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                <Send size={19} />
                {formatCompactNumber(post.shareCount)}
              </button>
            </div>

            <button
              type="button"
              onClick={() => saveMutation.mutate(!post.viewer.saved)}
              disabled={saveMutation.isPending}
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                post.viewer.saved
                  ? "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
              }`}
              aria-label={post.viewer.saved ? "Unsave post" : "Save post"}
            >
              <Bookmark
                size={19}
                fill={post.viewer.saved ? "currentColor" : "none"}
              />
            </button>
          </div>

          <CommentsSection postId={post.id} enabled={post.commentsEnabled} />
        </div>
      </article>

      <SharePostModal
        postId={post.id}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
      />
      <ReportPostModal
        postId={post.id}
        open={reportOpen}
        onClose={() => setReportOpen(false)}
      />
    </>
  );
}

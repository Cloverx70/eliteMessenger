/* eslint-disable @next/next/no-img-element */
"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle, Send, Trash2 } from "lucide-react";
import {
  createPostComment,
  deletePostComment,
  getPostComments,
} from "../../action";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { discoverKeys } from "@/app/hooks/use-discover-posts";
import { formatPostTime } from "./discover-utils";
import { toast } from "react-hot-toast";

interface CommentsSectionProps {
  postId: string;
  enabled: boolean;
}

export function CommentsSection({ postId, enabled }: CommentsSectionProps) {
  const [content, setContent] = useState("");
  const queryClient = useQueryClient();

  const commentsQuery = useInfiniteQuery({
    queryKey: discoverKeys.comments(postId),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => getPostComments(postId, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const createMutation = useMutation({
    mutationFn: () => createPostComment(postId, content.trim()),
    onSuccess: async () => {
      setContent("");
      await queryClient.invalidateQueries({
        queryKey: discoverKeys.comments(postId),
      });
      await queryClient.invalidateQueries({ queryKey: discoverKeys.all });
    },
    onError: () => toast.error("Could not add comment."),
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => deletePostComment(postId, commentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: discoverKeys.comments(postId),
      });
      await queryClient.invalidateQueries({ queryKey: discoverKeys.all });
    },
    onError: () => toast.error("Could not delete comment."),
  });

  const comments =
    commentsQuery.data?.pages.flatMap((page) => page.items) ?? [];

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!content.trim() || createMutation.isPending) return;
    createMutation.mutate();
  };

  return (
    <section className="border-t border-slate-200 px-4 pb-4 pt-4 dark:border-slate-800">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-900 dark:text-white">
          Comments
        </h3>
        {commentsQuery.isFetching ? (
          <LoaderCircle size={15} className="animate-spin text-violet-600" />
        ) : null}
      </div>

      {enabled ? (
        <form onSubmit={submit} className="mb-4 flex items-center gap-2">
          <input
            value={content}
            onChange={(event) => setContent(event.target.value)}
            maxLength={1000}
            placeholder="Write a comment..."
            className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-violet-400 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:bg-slate-950"
          />
          <button
            type="submit"
            disabled={!content.trim() || createMutation.isPending}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send comment"
          >
            {createMutation.isPending ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <Send size={17} />
            )}
          </button>
        </form>
      ) : (
        <p className="mb-4 rounded-xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-500 dark:bg-slate-900">
          Comments are disabled for this post.
        </p>
      )}

      <div className="space-y-4">
        {comments.map((comment) => (
          <article key={comment.id} className="flex gap-3">
            {comment.author.userPfpUrl ? (
              <img
                src={comment.author.userPfpUrl}
                alt={comment.author.username}
                className="h-9 w-9 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-black text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                {comment.author.firstname?.[0]?.toUpperCase() ??
                  comment.author.username[0]?.toUpperCase()}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-white">
                    {comment.author.firstname} {comment.author.lastname}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    @{comment.author.username} ·{" "}
                    {formatPostTime(comment.createdAt)}
                  </p>
                </div>
                {comment.viewer.isAuthor ? (
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(comment.id)}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                    aria-label="Delete comment"
                  >
                    <Trash2 size={14} />
                  </button>
                ) : null}
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {comment.content}
              </p>
            </div>
          </article>
        ))}

        {!commentsQuery.isLoading && comments.length === 0 ? (
          <p className="py-5 text-center text-xs font-medium text-slate-400">
            No comments yet. Start the conversation.
          </p>
        ) : null}
      </div>

      {commentsQuery.hasNextPage ? (
        <button
          type="button"
          onClick={() => commentsQuery.fetchNextPage()}
          disabled={commentsQuery.isFetchingNextPage}
          className="mt-4 w-full rounded-xl border border-slate-200 py-2 text-xs font-bold text-slate-600 transition hover:border-violet-300 hover:text-violet-600 dark:border-slate-800 dark:text-slate-300"
        >
          {commentsQuery.isFetchingNextPage
            ? "Loading..."
            : "View more comments"}
        </button>
      ) : null}
    </section>
  );
}

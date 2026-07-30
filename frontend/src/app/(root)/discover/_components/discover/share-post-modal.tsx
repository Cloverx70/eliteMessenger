/* eslint-disable @next/next/no-img-element */
"use client";

import { LoaderCircle, Search, Send, Users, X } from "lucide-react";
import { PostShareTarget, ShareTarget } from "../../types";
import { getShareTargets, sharePost } from "../../action";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { discoverKeys } from "@/app/hooks/use-discover-posts";
import { toast } from "react-hot-toast";
import { useDebouncedValue } from "@/app/hooks/use-debounced-value";
import { useState } from "react";

interface SharePostModalProps {
  postId: string;
  open: boolean;
  onClose: () => void;
}

export function SharePostModal({ postId, open, onClose }: SharePostModalProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const queryClient = useQueryClient();

  const targetsQuery = useQuery({
    queryKey: ["POST_SHARE_TARGETS", debouncedSearch],
    queryFn: () => getShareTargets(debouncedSearch || undefined),
    enabled: open,
  });

  const shareMutation = useMutation({
    mutationFn: (target: ShareTarget) =>
      sharePost(postId, target.type, target.id),
    onSuccess: async () => {
      toast.success("Post shared.");
      await queryClient.invalidateQueries({ queryKey: discoverKeys.all });
      onClose();
    },
    onError: () => toast.error("Could not share the post."),
  });

  if (!open) return null;

  const chats = targetsQuery.data?.chats ?? [];
  const groups = targetsQuery.data?.groups ?? [];

  const renderTarget = (target: ShareTarget) => (
    <button
      key={`${target.type}-${target.id}`}
      type="button"
      onClick={() => shareMutation.mutate(target)}
      disabled={shareMutation.isPending}
      className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition hover:bg-violet-50 dark:hover:bg-violet-950/25"
    >
      {target.imageUrl ? (
        <img
          src={target.imageUrl}
          alt={target.name}
          className="h-10 w-10 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
          {target.type === PostShareTarget.GROUPCHAT ? (
            <Users size={17} />
          ) : (
            target.name[0]?.toUpperCase()
          )}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
          {target.name}
        </p>
        <p className="truncate text-xs text-slate-400">
          {target.username ? `@${target.username}` : "Group chat"}
        </p>
      </div>
      <Send size={16} className="text-violet-600" />
    </button>
  );

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            Share post
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-900"
          >
            <X size={19} />
          </button>
        </header>

        <div className="p-4">
          <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 dark:border-slate-800 dark:bg-slate-900">
            <Search size={16} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search chats and groups..."
              className="min-w-0 flex-1 bg-transparent text-sm outline-none dark:text-white"
            />
          </label>

          <div className="mt-4 max-h-[430px] overflow-y-auto pr-1">
            {targetsQuery.isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <LoaderCircle className="animate-spin text-violet-600" />
              </div>
            ) : (
              <>
                {chats.length > 0 ? (
                  <section>
                    <p className="mb-2 px-2 text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Messages
                    </p>
                    {chats.map(renderTarget)}
                  </section>
                ) : null}

                {groups.length > 0 ? (
                  <section className="mt-4">
                    <p className="mb-2 px-2 text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Groups
                    </p>
                    {groups.map(renderTarget)}
                  </section>
                ) : null}

                {chats.length === 0 && groups.length === 0 ? (
                  <p className="py-12 text-center text-sm text-slate-400">
                    No share targets found.
                  </p>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { ArrowUpRight, ImageIcon, Play } from "lucide-react";
import { DiscoverPost, PostAttachmentType } from "../../discover/types";

import Image from "next/image";
import { useRouter } from "next/navigation";

interface SharedPostMessageCardProps {
  post: DiscoverPost | null;
}

export function SharedPostMessageCard({ post }: SharedPostMessageCardProps) {
  const router = useRouter();

  if (!post) {
    return (
      <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900">
        This shared post is no longer available.
      </div>
    );
  }

  const media = post.attachments[0];
  const name =
    `${post.author.firstname} ${post.author.lastname}`.trim() ||
    post.author.username;

  return (
    <button
      type="button"
      onClick={() => router.push(`/discover?post=${post.id}`)}
      className="mt-2 w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-950"
    >
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-xs font-black text-slate-900 dark:text-white">
            {name}
          </p>
          <p className="truncate text-[11px] text-slate-400">
            @{post.author.username}
          </p>
        </div>
        <ArrowUpRight size={16} className="text-violet-600" />
      </div>

      {media ? (
        <div className="relative aspect-[16/10] bg-slate-100 dark:bg-slate-900">
          {media.type === PostAttachmentType.IMAGE ? (
            <Image
              src={media.url}
              alt={media.filename ?? "Shared post"}
              fill
              sizes="380px"
              placeholder={media.blurDataURL ? "blur" : "empty"}
              blurDataURL={media.blurDataURL ?? undefined}
              className="object-cover"
            />
          ) : (
            <>
              <video
                src={media.url}
                muted
                preload="metadata"
                className="h-full w-full object-cover"
              />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm">
                  <Play size={18} fill="currentColor" />
                </span>
              </span>
            </>
          )}
        </div>
      ) : (
        <div className="flex min-h-28 items-center justify-center bg-violet-50 text-violet-600 dark:bg-violet-950/30">
          <ImageIcon size={24} />
        </div>
      )}

      {post.caption ? (
        <p className="line-clamp-2 px-3 py-3 text-xs font-semibold leading-relaxed text-slate-700 dark:text-slate-200">
          {post.caption}
        </p>
      ) : null}
    </button>
  );
}

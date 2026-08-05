"use client";

import { Bookmark, Heart, MessageCircle, Play } from "lucide-react";
import { DiscoverPost, PostAttachmentType } from "../../types";
import {
  formatCompactNumber,
  formatPostTime,
  getAuthorName,
} from "./discover-utils";

import Image from "next/image";

interface PostTileProps {
  post: DiscoverPost;
  selected?: boolean;
  onSelect: () => void;
}

export function PostTile({ post, selected, onSelect }: PostTileProps) {
  const media = post.attachments[0];
  const ratio =
    media?.width && media?.height
      ? Math.min(1.45, Math.max(0.72, media.width / media.height))
      : 1;

  return (
    <article
      className={`group mb-4 break-inside-avoid overflow-hidden rounded-[22px] border bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-slate-950 ${
        selected
          ? "border-violet-500 ring-2 ring-violet-500/15"
          : "border-slate-200 dark:border-slate-800"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="block w-full text-left"
      >
        {media ? (
          <div
            className="relative w-full overflow-hidden bg-slate-100 dark:bg-slate-900"
            style={{ aspectRatio: ratio }}
          >
            {media.type === PostAttachmentType.IMAGE ? (
              <Image
                src={media.url}
                alt={media.filename ?? post.caption ?? "Discover post"}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                placeholder={media.blurDataURL ? "blur" : "empty"}
                blurDataURL={media.blurDataURL ?? undefined}
                className="object-cover transition duration-500 group-hover:scale-[1.03]"
              />
            ) : (
              <video
                src={media.url}
                muted
                playsInline
                preload="metadata"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              />
            )}

            {media.type === PostAttachmentType.VIDEO ? (
              <span className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-black/55 text-white backdrop-blur-sm">
                <Play size={16} fill="currentColor" />
              </span>
            ) : null}

            {post.attachments.length > 1 ? (
              <span className="absolute right-3 top-3 rounded-lg bg-black/55 px-2 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                1/{post.attachments.length}
              </span>
            ) : null}

            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/70 via-black/15 to-transparent p-3 pt-14 text-white opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="flex items-center gap-1.5">
                  <Heart
                    size={15}
                    fill={post.viewer.liked ? "currentColor" : "none"}
                  />
                  {formatCompactNumber(post.likeCount)}
                </span>
                <span className="flex items-center gap-1.5">
                  <MessageCircle size={15} />
                  {formatCompactNumber(post.commentCount)}
                </span>
              </div>
              {post.viewer.saved ? (
                <Bookmark size={17} fill="currentColor" />
              ) : null}
            </div>
          </div>
        ) : (
          <div className="min-h-48 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-950 p-6 text-white">
            <p className="line-clamp-6 text-xl font-black leading-snug">
              {post.caption}
            </p>
          </div>
        )}

        <div className="p-3.5">
          {media && post.caption ? (
            <p className="mb-3 line-clamp-2 text-sm font-semibold leading-relaxed text-slate-800 dark:text-slate-100">
              {post.caption}
            </p>
          ) : null}

          <div className="flex items-center gap-2.5">
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950">
              {post.author.userPfpUrl ? (
                <Image
                  src={post.author.userPfpUrl}
                  alt={getAuthorName(post)}
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xs font-black">
                  {post.author.firstname?.[0]?.toUpperCase() ??
                    post.author.username[0]?.toUpperCase()}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                {getAuthorName(post)}
              </p>
              <p className="truncate text-[11px] font-medium text-slate-400">
                @{post.author.username} · {formatPostTime(post.createdAt)}
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-300 sm:hidden">
              <Heart size={14} /> {formatCompactNumber(post.likeCount)}
            </div>
          </div>
        </div>
      </button>
    </article>
  );
}

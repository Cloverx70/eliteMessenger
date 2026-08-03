"use client";

import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Share2,
} from "lucide-react";
import { ProfilePost, ProfileUser } from "../types";

import ProfileAvatar from "./ProfileAvatar";
import SectionCard from "./SectionCard";
import { profileRoutes } from "../profile-routes";
import { useRouter } from "next/navigation";

interface RecentPostsProps {
  user: ProfileUser;
  posts: ProfilePost[];
}

export default function RecentPosts({ user, posts }: RecentPostsProps) {
  const router = useRouter();

  return (
    <SectionCard title="Recent posts">
      <div className="divide-y divide-slate-200 dark:divide-slate-800">
        {posts.length > 0 ? (
          posts.map((post) => (
            <article key={post.id} className="p-5">
              <div className="flex min-w-0 items-start gap-3">
                <ProfileAvatar person={user} size="md" />

                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-950 dark:text-white">
                        {user.firstname} {user.lastname}
                        <span className="ml-2 text-xs font-semibold text-slate-400">
                          @{user.username}
                        </span>
                      </p>

                      <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
                        {formatPostDate(post.createdAt)}
                      </p>
                    </div>

                    <button
                      type="button"
                      aria-label="Post options"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
                    >
                      <MoreHorizontal size={19} />
                    </button>
                  </div>

                  {post.caption ? (
                    <button
                      type="button"
                      onClick={() => router.push(profileRoutes.post(post.id))}
                      className="mt-3 block w-full text-left text-sm leading-6 text-slate-700 dark:text-slate-200"
                    >
                      {post.caption}
                    </button>
                  ) : null}

                  {post.attachments.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => router.push(profileRoutes.post(post.id))}
                      className="mt-4 block w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900"
                    >
                      {post.attachments[0].type === "IMAGE" ? (
                        <img
                          src={post.attachments[0].url}
                          alt={
                            post.attachments[0].filename ?? "Post attachment"
                          }
                          className="max-h-[420px] w-full object-cover"
                        />
                      ) : (
                        <video
                          src={post.attachments[0].url}
                          muted
                          preload="metadata"
                          className="max-h-[420px] w-full object-cover"
                        />
                      )}
                    </button>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400">
                    <PostMetric
                      icon={Heart}
                      value={post.likeCount}
                      label="likes"
                    />
                    <PostMetric
                      icon={MessageCircle}
                      value={post.commentCount}
                      label="comments"
                    />
                    <PostMetric
                      icon={Share2}
                      value={post.shareCount}
                      label="shares"
                    />

                    <button
                      type="button"
                      className="ml-auto flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100 hover:text-violet-700 dark:hover:bg-slate-900"
                      aria-label="Save post"
                    >
                      <Bookmark size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="flex min-h-52 items-center justify-center px-5 py-10 text-center text-sm font-semibold text-slate-400">
            No posts published yet.
          </div>
        )}
      </div>
    </SectionCard>
  );
}

interface PostMetricProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  value: number;
  label: string;
}

function PostMetric({ icon: Icon, value, label }: PostMetricProps) {
  return (
    <span className="flex items-center gap-1.5">
      <Icon size={16} />
      {value.toLocaleString()} {label}
    </span>
  );
}

function formatPostDate(dateValue: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateValue));
}

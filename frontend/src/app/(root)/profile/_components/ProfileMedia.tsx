"use client";

import { Play } from "lucide-react";
import { ProfileMediaItem } from "../types";
import SectionCard from "./SectionCard";
import { profileRoutes } from "../profile-routes";
import { useRouter } from "next/navigation";

interface ProfileMediaProps {
  media: ProfileMediaItem[];
}

export default function ProfileMedia({ media }: ProfileMediaProps) {
  const router = useRouter();

  return (
    <SectionCard
      title="Media"
      action={
        <button
          type="button"
          onClick={() => router.push(profileRoutes.media)}
          className="text-xs font-black text-violet-700 hover:text-violet-900 dark:text-violet-300"
        >
          See all
        </button>
      }
      className="h-full"
    >
      <div className="grid grid-cols-2 gap-2 px-5 pb-5 sm:grid-cols-3">
        {media.length > 0 ? (
          media.slice(0, 6).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => router.push(profileRoutes.post(item.postId))}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-950 dark:to-slate-900"
            >
              <img
                src={item.url}
                alt={item.filename ?? "Profile media"}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />

              {item.type === "VIDEO" ? (
                <span className="absolute inset-0 flex items-center justify-center bg-black/15">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur">
                    <Play size={16} fill="currentColor" />
                  </span>
                </span>
              ) : null}
            </button>
          ))
        ) : (
          <div className="col-span-full flex min-h-48 items-center justify-center rounded-xl bg-slate-50 text-sm font-semibold text-slate-400 dark:bg-slate-900">
            No media shared yet.
          </div>
        )}
      </div>
    </SectionCard>
  );
}

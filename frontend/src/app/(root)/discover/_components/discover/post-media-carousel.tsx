"use client";

import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { PostAttachment, PostAttachmentType } from "../../types";
import { useEffect, useState } from "react";

import Image from "next/image";

interface PostMediaCarouselProps {
  attachments: PostAttachment[];
  compact?: boolean;
}

export function PostMediaCarousel({
  attachments,
  compact = false,
}: PostMediaCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [attachments]);

  if (attachments.length === 0) return null;

  const active = attachments[activeIndex];
  const ratio =
    active.width && active.height
      ? Math.min(1.6, Math.max(0.68, active.width / active.height))
      : 1;

  const move = (direction: -1 | 1) => {
    setActiveIndex((current) => {
      const next = current + direction;
      if (next < 0) return attachments.length - 1;
      if (next >= attachments.length) return 0;
      return next;
    });
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900">
      <div
        className={`relative w-full ${compact ? "max-h-[420px]" : "max-h-[620px]"}`}
        style={{ aspectRatio: ratio }}
      >
        {active.type === PostAttachmentType.IMAGE ? (
          <Image
            key={active.id}
            src={active.url}
            alt={active.filename ?? "Post media"}
            fill
            priority
            sizes="(max-width: 1280px) 100vw, 420px"
            placeholder={active.blurDataURL ? "blur" : "empty"}
            blurDataURL={active.blurDataURL ?? undefined}
            className="object-contain"
          />
        ) : (
          <video
            key={active.id}
            src={active.url}
            controls
            playsInline
            preload="metadata"
            className="h-full w-full bg-black object-contain"
          />
        )}

        {active.type === PostAttachmentType.VIDEO ? (
          <span className="pointer-events-none absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-black/50 text-white backdrop-blur-sm">
            <Play size={16} fill="currentColor" />
          </span>
        ) : null}
      </div>

      {attachments.length > 1 ? (
        <>
          <button
            type="button"
            onClick={() => move(-1)}
            className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/65"
            aria-label="Previous media"
          >
            <ChevronLeft size={21} />
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/65"
            aria-label="Next media"
          >
            <ChevronRight size={21} />
          </button>

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/35 px-2 py-1.5 backdrop-blur-sm">
            {attachments.map((attachment, index) => (
              <button
                key={attachment.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`h-1.5 rounded-full transition ${
                  index === activeIndex ? "w-5 bg-white" : "w-1.5 bg-white/55"
                }`}
                aria-label={`Show media ${index + 1}`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

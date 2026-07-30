"use client";

import {
  FaArrowDown,
  FaArrowUp,
  FaDownload,
  FaFile,
  FaFilePdf,
  FaImage,
  FaLink,
  FaNewspaper,
  FaPlay,
  FaUsers,
  FaVideo,
} from "react-icons/fa";
import { GetAllMedia, MediaSources as MediaSourcesEnum } from "../action";
import React, { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { IoChatbubbleEllipses } from "react-icons/io5";
import { MdGif } from "react-icons/md";
import { MediaSourceCombobox } from "@/components/ui/ComboBox";
import { MediaSources } from "@/app/constants";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

type SortOrder = "newest" | "oldest";

type MediaTypeFilter = "ALL" | "IMAGE" | "VIDEO" | "GIF" | "FILE" | "LINK";

const typeFilters: Array<{
  label: string;
  value: MediaTypeFilter;
}> = [
  { label: "All", value: "ALL" },
  { label: "Photos", value: "IMAGE" },
  { label: "Videos", value: "VIDEO" },
  { label: "GIFs", value: "GIF" },
  { label: "Files", value: "FILE" },
  { label: "Links", value: "LINK" },
];

const formatBytes = (bytes?: number | null) => {
  if (!bytes || bytes <= 0) return "";

  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );

  const size = bytes / 1024 ** unitIndex;

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const getFileExtension = (filename?: string | null) => {
  if (!filename?.includes(".")) return "";

  return filename.split(".").pop()?.toLowerCase() ?? "";
};

const getLinkHost = (url: string) => {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
};

const MediaMap = () => {
  const router = useRouter();

  const [selectedSource, setSelectedSource] = useState("All Sources");
  const [selectedType, setSelectedType] = useState<MediaTypeFilter>("ALL");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");

  const {
    data: media,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["GETALLMEDIA"],
    queryFn: () => GetAllMedia(),
  });

  const mediaItems = useMemo(() => {
    const chatItems =
      media?.chats?.items?.map((item) => ({
        ...item,
        source: "chat" as const,
      })) ?? [];

    const groupItems =
      media?.groupchats?.items?.map((item) => ({
        ...item,
        source: "group" as const,
      })) ?? [];

    let items = [...chatItems, ...groupItems];

    if (selectedSource === "Chats") {
      items = items.filter((item) => item.source === "chat");
    }

    if (selectedSource === "Group Chats") {
      items = items.filter((item) => item.source === "group");
    }

    if (selectedType !== "ALL") {
      items = items.filter((item) => item.type?.toUpperCase() === selectedType);
    }

    return [...items].sort((a, b) => {
      const firstDate = new Date(a.createdAt).getTime();
      const secondDate = new Date(b.createdAt).getTime();

      return sortOrder === "newest"
        ? secondDate - firstDate
        : firstDate - secondDate;
    });
  }, [media, selectedSource, selectedType, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder((current) => (current === "newest" ? "oldest" : "newest"));
  };

  const handleOnClickMedia = (mediaId: string, source: MediaSourcesEnum) => {
    router.push(`/media/${mediaId}?source=${source}`);
  };

  return (
    <section className="w-full">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <MediaSourceCombobox
              items={MediaSources}
              value={selectedSource}
              onValueChange={setSelectedSource}
            />

            <Button
              type="button"
              variant="outline"
              onClick={toggleSortOrder}
              className="h-11 rounded-xl border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 shadow-none transition-all hover:border-elitePurple hover:bg-elitePurpleHover hover:text-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
            >
              <FaNewspaper size={17} />

              {sortOrder === "newest" ? "Newest First" : "Oldest First"}

              {sortOrder === "newest" ? (
                <FaArrowDown size={11} />
              ) : (
                <FaArrowUp size={11} />
              )}
            </Button>
          </div>

          {!isLoading && (
            <p className="text-sm font-medium text-slate-500">
              {mediaItems.length} {mediaItems.length === 1 ? "item" : "items"}
            </p>
          )}
        </div>

        {/* Type filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {typeFilters.map((filter) => {
            const isActive = selectedType === filter.value;

            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => setSelectedType(filter.value)}
                className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition-all ${
                  isActive
                    ? "border-elitePurple bg-elitePurple text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-elitePurple hover:text-elitePurple dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="aspect-[4/3] animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"
            />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && !isLoading && (
        <div className="mt-8 flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-red-200 bg-red-50/50 px-6 text-center dark:border-red-950 dark:bg-red-950/10">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-500 dark:bg-red-950">
            <FaImage size={22} />
          </div>

          <h3 className="font-bold text-slate-900 dark:text-white">
            Could not load media
          </h3>

          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Something went wrong while retrieving your shared media.
          </p>

          <Button
            type="button"
            variant="outline"
            className="mt-4 rounded-xl"
            onClick={() => refetch()}
          >
            Try again
          </Button>
        </div>
      )}

      {/* Gallery */}
      {!isLoading && !isError && mediaItems.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {mediaItems.map((item) => {
            const sender = item.message?.sender;

            const senderName = sender
              ? `${sender.firstname ?? ""} ${sender.lastname ?? ""}`.trim() ||
                sender.username ||
                "Unknown user"
              : "Unknown user";

            const normalizedType = item.type?.toUpperCase() as MediaTypeFilter;

            const extension = getFileExtension(item.filename);
            const isPdf =
              extension === "pdf" ||
              item.filename?.toLowerCase().endsWith(".pdf");

            const blurDataURL =
              "blurDataURL" in item && typeof item.blurDataURL === "string"
                ? item.blurDataURL
                : undefined;

            const sourceLabel =
              item.source === "group" ? "Group chat" : "Direct chat";

            return (
              <article
                key={`${item.source}-${item.id}`}
                onClick={() =>
                  handleOnClickMedia(
                    item.id,
                    item.source === "chat"
                      ? MediaSourcesEnum.CHATS
                      : MediaSourcesEnum.GROUPCHATS,
                  )
                }
                className="group overflow-hidden cursor-pointer rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
                  {/* Image */}
                  {normalizedType === "IMAGE" && (
                    <Image
                      src={item.url}
                      alt={item.filename ?? `Shared image from ${senderName}`}
                      fill
                      loading="lazy"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      placeholder={blurDataURL ? "blur" : "empty"}
                      blurDataURL={blurDataURL}
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}

                  {/* Animated GIF */}
                  {normalizedType === "GIF" && (
                    <Image
                      src={item.url}
                      alt={item.filename ?? `Shared GIF from ${senderName}`}
                      fill
                      unoptimized
                      loading="lazy"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}

                  {/* Video */}
                  {normalizedType === "VIDEO" && (
                    <video
                      src={item.url}
                      controls
                      playsInline
                      preload="metadata"
                      className="h-full w-full bg-black object-cover"
                    >
                      Your browser does not support video playback.
                    </video>
                  )}

                  {/* PDF */}
                  {normalizedType === "FILE" && isPdf && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-red-50 to-white px-5 text-center dark:from-red-950/30 dark:to-slate-950"
                    >
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-500 dark:bg-red-950">
                        <FaFilePdf size={30} />
                      </div>

                      <p className="mt-4 line-clamp-2 text-sm font-bold text-slate-800 dark:text-slate-100">
                        {item.filename ?? "PDF document"}
                      </p>

                      <p className="mt-1 text-xs font-medium text-slate-400">
                        {formatBytes(item.size)}
                      </p>
                    </a>
                  )}

                  {/* General file */}
                  {normalizedType === "FILE" && !isPdf && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-violet-50 to-white px-5 text-center dark:from-violet-950/30 dark:to-slate-950"
                    >
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-elitePurple dark:bg-violet-950">
                        <FaFile size={27} />
                      </div>

                      <p className="mt-4 line-clamp-2 text-sm font-bold text-slate-800 dark:text-slate-100">
                        {item.filename ?? "Shared file"}
                      </p>

                      <p className="mt-1 text-xs font-medium uppercase text-slate-400">
                        {extension || "File"}{" "}
                        {formatBytes(item.size)
                          ? `• ${formatBytes(item.size)}`
                          : ""}
                      </p>
                    </a>
                  )}

                  {/* Link */}
                  {normalizedType === "LINK" && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white px-5 text-center dark:from-blue-950/30 dark:to-slate-950"
                    >
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950">
                        <FaLink size={25} />
                      </div>

                      <p className="mt-4 max-w-full truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                        {getLinkHost(item.url)}
                      </p>

                      <p className="mt-1 line-clamp-2 max-w-full text-xs text-slate-400">
                        {item.url}
                      </p>
                    </a>
                  )}

                  {/* Unknown type fallback */}
                  {!["IMAGE", "VIDEO", "GIF", "FILE", "LINK"].includes(
                    normalizedType,
                  ) && (
                    <div className="flex h-full w-full flex-col items-center justify-center">
                      <FaFile size={28} className="text-slate-400" />

                      <p className="mt-3 text-sm font-bold text-slate-600">
                        Unsupported media
                      </p>
                    </div>
                  )}

                  {/* Source badge */}
                  <div className="pointer-events-none absolute left-2 top-2 z-10 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
                    {item.source === "group" ? (
                      <FaUsers size={11} />
                    ) : (
                      <IoChatbubbleEllipses size={12} />
                    )}

                    {sourceLabel}
                  </div>

                  {/* Video badge */}
                  {normalizedType === "VIDEO" && (
                    <div className="pointer-events-none absolute right-2 top-2 z-10 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
                      <FaPlay size={8} />
                      Video
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                      {item.filename ?? senderName}
                    </p>

                    <p className="mt-1 text-[10px] font-medium text-slate-400">
                      {senderName} •{" "}
                      {new Date(item.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${item.filename ?? "media"}`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:border-elitePurple hover:bg-elitePurple hover:text-white dark:border-slate-800"
                  >
                    <FaDownload size={13} />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && mediaItems.length === 0 && (
        <div className="mt-8 flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 text-center dark:border-slate-800 dark:bg-slate-950/40">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-elitePurple/10 text-elitePurple">
            {selectedType === "VIDEO" ? (
              <FaVideo size={27} />
            ) : selectedType === "FILE" ? (
              <FaFile size={27} />
            ) : selectedType === "GIF" ? (
              <MdGif size={36} />
            ) : selectedType === "LINK" ? (
              <FaLink size={25} />
            ) : (
              <FaImage size={27} />
            )}
          </div>

          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No shared media yet
          </h3>

          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
            Shared photos, videos, GIFs, files and links will appear here.
          </p>
        </div>
      )}
    </section>
  );
};

export default MediaMap;

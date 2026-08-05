"use client";

import {
  useMemo,
  useState,
} from "react";
import {
  ArrowDown,
  ArrowUp,
  Download,
  File,
  FileText,
  ImageIcon,
  Link2,
  Play,
  Search,
  Users,
  Video,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { IoChatbubbleEllipses } from "react-icons/io5";
import { MdGif } from "react-icons/md";

import { Button } from "@/components/ui/button";
import { MediaSourceCombobox } from "@/components/ui/ComboBox";
import { MediaSources } from "@/app/constants";

import {
  GetAllMedia,
  MediaSources as MediaSourcesEnum,
} from "../action";

type SortOrder =
  | "newest"
  | "oldest";

type MediaTypeFilter =
  | "ALL"
  | "IMAGE"
  | "VIDEO"
  | "GIF"
  | "FILE"
  | "LINK";

const typeFilters: Array<{
  label: string;
  value: MediaTypeFilter;
}> = [
  {
    label: "All",
    value: "ALL",
  },
  {
    label: "Photos",
    value: "IMAGE",
  },
  {
    label: "Videos",
    value: "VIDEO",
  },
  {
    label: "GIFs",
    value: "GIF",
  },
  {
    label: "Files",
    value: "FILE",
  },
  {
    label: "Links",
    value: "LINK",
  },
];

const formatBytes = (
  bytes?: number | null,
) => {
  if (!bytes || bytes <= 0) {
    return "";
  }

  const units = [
    "B",
    "KB",
    "MB",
    "GB",
  ];

  const unitIndex = Math.min(
    Math.floor(
      Math.log(bytes) /
        Math.log(1024),
    ),
    units.length - 1,
  );

  const size =
    bytes / 1024 ** unitIndex;

  return `${size.toFixed(
    unitIndex === 0 ? 0 : 1,
  )} ${units[unitIndex]}`;
};

const getFileExtension = (
  filename?: string | null,
) => {
  if (!filename?.includes(".")) {
    return "";
  }

  return (
    filename
      .split(".")
      .pop()
      ?.toLowerCase() ?? ""
  );
};

const getLinkHost = (
  url: string,
) => {
  try {
    return new URL(url).hostname.replace(
      "www.",
      "",
    );
  } catch {
    return url;
  }
};

const normalizeType = (
  value?: string | null,
): MediaTypeFilter => {
  const normalized =
    value?.toUpperCase();

  if (
    normalized === "DOCUMENT"
  ) {
    return "FILE";
  }

  if (
    normalized === "IMAGE" ||
    normalized === "VIDEO" ||
    normalized === "GIF" ||
    normalized === "FILE" ||
    normalized === "LINK"
  ) {
    return normalized;
  }

  return "FILE";
};

const MediaMap = () => {
  const router = useRouter();

  const [
    selectedSource,
    setSelectedSource,
  ] = useState("All Sources");

  const [
    selectedType,
    setSelectedType,
  ] =
    useState<MediaTypeFilter>(
      "ALL",
    );

  const [
    sortOrder,
    setSortOrder,
  ] =
    useState<SortOrder>(
      "newest",
    );

  const [search, setSearch] =
    useState("");

  const {
    data: media,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["GETALLMEDIA"],
    queryFn: () => GetAllMedia(),
  });

  const mediaItems =
    useMemo(() => {
      const chatItems =
        media?.chats?.items?.map(
          (item) => ({
            ...item,
            source:
              "chat" as const,
          }),
        ) ?? [];

      const groupItems =
        media?.groupchats?.items?.map(
          (item) => ({
            ...item,
            source:
              "group" as const,
          }),
        ) ?? [];

      let items = [
        ...chatItems,
        ...groupItems,
      ];

      if (
        selectedSource === "Chats"
      ) {
        items = items.filter(
          (item) =>
            item.source === "chat",
        );
      }

      if (
        selectedSource ===
        "Group Chats"
      ) {
        items = items.filter(
          (item) =>
            item.source === "group",
        );
      }

      if (
        selectedType !== "ALL"
      ) {
        items = items.filter(
          (item) =>
            normalizeType(
              item.type,
            ) === selectedType,
        );
      }

      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      if (normalizedSearch) {
        items = items.filter(
          (item) => {
            const sender =
              item.message?.sender;

            const searchable = [
              item.filename,
              item.url,
              item.type,
              sender?.username,
              sender?.firstname,
              sender?.lastname,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            return searchable.includes(
              normalizedSearch,
            );
          },
        );
      }

      return [...items].sort(
        (first, second) => {
          const firstDate =
            new Date(
              first.createdAt,
            ).getTime();

          const secondDate =
            new Date(
              second.createdAt,
            ).getTime();

          return sortOrder ===
            "newest"
            ? secondDate -
                firstDate
            : firstDate -
                secondDate;
        },
      );
    }, [
      media,
      search,
      selectedSource,
      selectedType,
      sortOrder,
    ]);

  const openMedia = (
    mediaId: string,
    source: MediaSourcesEnum,
  ) => {
    router.push(
      `/media/${mediaId}?source=${source}`,
    );
  };

  return (
    <section className="w-full min-w-0">
      <div className="space-y-3">
        <label
          className="
            flex
            h-11
            w-full
            min-w-0
            items-center
            gap-2
            rounded-2xl
            border
            border-slate-200
            bg-white
            px-3
            shadow-sm
            dark:border-slate-800
            dark:bg-slate-950
          "
        >
          <Search
            size={18}
            className="shrink-0 text-slate-400"
          />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
            placeholder="Search media, people or links..."
            className="
              min-w-0
              flex-1
              bg-transparent
              text-sm
              text-slate-900
              outline-none
              placeholder:text-slate-400
              dark:text-white
            "
          />
        </label>

        <div
          className="
            grid
            grid-cols-1
            gap-2
            sm:grid-cols-[minmax(0,1fr)_auto]
          "
        >
          <div className="min-w-0">
            <MediaSourceCombobox
              items={MediaSources}
              value={selectedSource}
              onValueChange={
                setSelectedSource
              }
            />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setSortOrder(
                (current) =>
                  current ===
                  "newest"
                    ? "oldest"
                    : "newest",
              )
            }
            className="
              h-11
              w-full
              justify-center
              rounded-xl
              border-slate-200
              bg-white
              px-4
              text-xs
              font-black
              text-slate-600
              shadow-none
              transition
              hover:border-elitePurple
              hover:bg-elitePurple
              hover:text-white
              dark:border-slate-800
              dark:bg-slate-950
              dark:text-slate-300
              sm:w-auto
            "
          >
            {sortOrder ===
            "newest" ? (
              <ArrowDown
                size={15}
              />
            ) : (
              <ArrowUp
                size={15}
              />
            )}

            {sortOrder ===
            "newest"
              ? "Newest"
              : "Oldest"}
          </Button>
        </div>

        <div
          className="
            flex
            w-full
            items-center
            gap-2
            overflow-x-auto
            pb-1
            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden
          "
        >
          {typeFilters.map(
            (filter) => {
              const isActive =
                selectedType ===
                filter.value;

              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() =>
                    setSelectedType(
                      filter.value,
                    )
                  }
                  className={`
                    h-9
                    shrink-0
                    rounded-full
                    border
                    px-4
                    text-xs
                    font-black
                    transition
                    ${
                      isActive
                        ? "border-elitePurple bg-elitePurple text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-elitePurple hover:text-elitePurple dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                    }
                  `}
                >
                  {filter.label}
                </button>
              );
            },
          )}
        </div>

        {!isLoading ? (
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {mediaItems.length}{" "}
            {mediaItems.length === 1
              ? "item"
              : "items"}
          </p>
        ) : null}
      </div>

      {isLoading ? (
        <div
          className="
            mt-4
            grid
            grid-cols-2
            gap-2
            sm:gap-4
            md:grid-cols-3
            2xl:grid-cols-4
          "
        >
          {Array.from({
            length: 8,
          }).map((_, index) => (
            <div
              key={index}
              className="aspect-square animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"
            />
          ))}
        </div>
      ) : null}

      {isError && !isLoading ? (
        <div
          className="
            mt-6
            flex
            min-h-72
            flex-col
            items-center
            justify-center
            rounded-2xl
            border
            border-dashed
            border-red-200
            bg-red-50/50
            px-6
            text-center
            dark:border-red-950
            dark:bg-red-950/10
          "
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-500 dark:bg-red-950">
            <ImageIcon size={22} />
          </span>

          <h3 className="mt-4 font-black text-slate-900 dark:text-white">
            Could not load media
          </h3>

          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Something went wrong while retrieving your shared media.
          </p>

          <Button
            type="button"
            variant="outline"
            className="mt-4 rounded-xl"
            onClick={() =>
              refetch()
            }
          >
            Try again
          </Button>
        </div>
      ) : null}

      {!isLoading &&
      !isError &&
      mediaItems.length > 0 ? (
        <div
          className="
            mt-4
            grid
            grid-cols-2
            gap-2
            sm:gap-4
            md:grid-cols-3
            2xl:grid-cols-4
          "
        >
          {mediaItems.map(
            (item) => {
              const sender =
                item.message?.sender;

              const senderName =
                sender
                  ? `${sender.firstname ?? ""} ${sender.lastname ?? ""}`.trim() ||
                    sender.username ||
                    "Unknown user"
                  : "Unknown user";

              const normalizedType =
                normalizeType(
                  item.type,
                );

              const extension =
                getFileExtension(
                  item.filename,
                );

              const isPdf =
                extension ===
                  "pdf" ||
                item.filename
                  ?.toLowerCase()
                  .endsWith(".pdf");

              const blurDataURL =
                "blurDataURL" in
                  item &&
                typeof item.blurDataURL ===
                  "string"
                  ? item.blurDataURL
                  : undefined;

              const source =
                item.source ===
                "chat"
                  ? MediaSourcesEnum.CHATS
                  : MediaSourcesEnum.GROUPCHATS;

              return (
                <article
                  key={`${item.source}-${item.id}`}
                  className="
                    group
                    min-w-0
                    overflow-hidden
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    shadow-sm
                    transition
                    hover:-translate-y-0.5
                    hover:shadow-lg
                    dark:border-slate-800
                    dark:bg-slate-950
                  "
                >
                  <button
                    type="button"
                    onClick={() =>
                      openMedia(
                        item.id,
                        source,
                      )
                    }
                    className="block w-full text-left"
                  >
                    <div className="relative aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
                      {normalizedType ===
                      "IMAGE" ? (
                        <Image
                          src={item.url}
                          alt={
                            item.filename ??
                            `Shared image from ${senderName}`
                          }
                          fill
                          loading="lazy"
                          sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
                          placeholder={
                            blurDataURL
                              ? "blur"
                              : "empty"
                          }
                          blurDataURL={
                            blurDataURL
                          }
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : null}

                      {normalizedType ===
                      "GIF" ? (
                        <Image
                          src={item.url}
                          alt={
                            item.filename ??
                            `Shared GIF from ${senderName}`
                          }
                          fill
                          unoptimized
                          loading="lazy"
                          sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : null}

                      {normalizedType ===
                      "VIDEO" ? (
                        <>
                          <video
                            src={item.url}
                            muted
                            playsInline
                            preload="metadata"
                            className="h-full w-full bg-black object-cover"
                          />

                          <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur">
                              <Play
                                size={15}
                                fill="currentColor"
                              />
                            </span>
                          </span>
                        </>
                      ) : null}

                      {normalizedType ===
                        "FILE" &&
                      isPdf ? (
                        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-red-50 to-white px-3 text-center dark:from-red-950/30 dark:to-slate-950">
                          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-500 dark:bg-red-950">
                            <FileText
                              size={24}
                            />
                          </span>

                          <p className="mt-3 line-clamp-2 text-xs font-black text-slate-800 dark:text-slate-100">
                            {item.filename ??
                              "PDF document"}
                          </p>

                          <p className="mt-1 text-[10px] font-semibold text-slate-400">
                            {formatBytes(
                              item.size,
                            )}
                          </p>
                        </div>
                      ) : null}

                      {normalizedType ===
                        "FILE" &&
                      !isPdf ? (
                        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-violet-50 to-white px-3 text-center dark:from-violet-950/30 dark:to-slate-950">
                          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-elitePurple dark:bg-violet-950">
                            <File
                              size={23}
                            />
                          </span>

                          <p className="mt-3 line-clamp-2 text-xs font-black text-slate-800 dark:text-slate-100">
                            {item.filename ??
                              "Shared file"}
                          </p>

                          <p className="mt-1 text-[10px] font-semibold uppercase text-slate-400">
                            {extension ||
                              "File"}
                          </p>
                        </div>
                      ) : null}

                      {normalizedType ===
                      "LINK" ? (
                        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white px-3 text-center dark:from-blue-950/30 dark:to-slate-950">
                          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950">
                            <Link2
                              size={23}
                            />
                          </span>

                          <p className="mt-3 max-w-full truncate text-xs font-black text-slate-800 dark:text-slate-100">
                            {getLinkHost(
                              item.url,
                            )}
                          </p>
                        </div>
                      ) : null}

                      <span
                        className="
                          pointer-events-none
                          absolute
                          left-2
                          top-2
                          z-10
                          flex
                          h-7
                          max-w-[calc(100%-1rem)]
                          items-center
                          gap-1
                          rounded-full
                          bg-black/60
                          px-2
                          text-[9px]
                          font-black
                          text-white
                          backdrop-blur-md
                        "
                      >
                        {item.source ===
                        "group" ? (
                          <Users
                            size={10}
                          />
                        ) : (
                          <IoChatbubbleEllipses
                            size={11}
                          />
                        )}

                        <span className="truncate">
                          {item.source ===
                          "group"
                            ? "Group"
                            : "Chat"}
                        </span>
                      </span>
                    </div>

                    <div className="min-w-0 p-2.5 sm:p-3">
                      <p className="truncate text-[11px] font-black text-slate-800 dark:text-slate-100 sm:text-xs">
                        {item.filename ??
                          senderName}
                      </p>

                      <p className="mt-1 truncate text-[9px] font-semibold text-slate-400 sm:text-[10px]">
                        {senderName}
                      </p>
                    </div>
                  </button>

                  <div className="border-t border-slate-100 px-2.5 py-2 dark:border-slate-800 sm:px-3">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${item.filename ?? "media"}`}
                      className="
                        flex
                        h-9
                        w-full
                        items-center
                        justify-center
                        gap-1.5
                        rounded-xl
                        text-[10px]
                        font-black
                        text-slate-500
                        transition
                        hover:bg-elitePurple
                        hover:text-white
                        dark:text-slate-300
                      "
                    >
                      <Download
                        size={13}
                      />
                      Open
                    </a>
                  </div>
                </article>
              );
            },
          )}
        </div>
      ) : null}

      {!isLoading &&
      !isError &&
      mediaItems.length === 0 ? (
        <div
          className="
            mt-6
            flex
            min-h-72
            flex-col
            items-center
            justify-center
            rounded-2xl
            border
            border-dashed
            border-slate-300
            bg-slate-50/60
            px-6
            text-center
            dark:border-slate-800
            dark:bg-slate-950/40
          "
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-elitePurple/10 text-elitePurple">
            {selectedType ===
            "VIDEO" ? (
              <Video size={27} />
            ) : selectedType ===
              "FILE" ? (
              <File size={27} />
            ) : selectedType ===
              "GIF" ? (
              <MdGif size={36} />
            ) : selectedType ===
              "LINK" ? (
              <Link2 size={25} />
            ) : (
              <ImageIcon
                size={27}
              />
            )}
          </span>

          <h3 className="mt-4 text-base font-black text-slate-900 dark:text-white">
            No matching media
          </h3>

          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
            Try another media type, source or search term.
          </p>
        </div>
      ) : null}
    </section>
  );
};

export default MediaMap;

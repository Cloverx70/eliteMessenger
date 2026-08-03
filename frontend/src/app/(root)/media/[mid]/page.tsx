"use client";

import {
  ArrowLeft,
  CalendarDays,
  Download,
  ExternalLink,
  FileText,
  HardDrive,
  ImageIcon,
  MessageCircle,
  Users,
  Video,
  X,
} from "lucide-react";
import {
  GetAttachmentById,
  IGroupMessageAttachment,
  IMessageAttachment,
  MediaSources,
} from "../action";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";

type MediaAttachment = IMessageAttachment | IGroupMessageAttachment;

function formatBytes(size?: number | null) {
  if (!size || size <= 0) {
    return "Unknown size";
  }

  const units = ["B", "KB", "MB", "GB"];

  const index = Math.min(
    Math.floor(Math.log(size) / Math.log(1024)),
    units.length - 1,
  );

  const formattedSize = size / 1024 ** index;

  return `${formattedSize.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function getFileExtension(filename?: string | null) {
  if (!filename?.includes(".")) {
    return "";
  }

  return filename.split(".").pop()?.toLowerCase() ?? "";
}

function getSenderName(attachment: MediaAttachment) {
  const sender = attachment.message.sender;

  const fullname = `${sender.firstname ?? ""} ${sender.lastname ?? ""}`.trim();

  return fullname || sender.username || "Unknown user";
}

function MediaPreview({ attachment }: { attachment: MediaAttachment }) {
  const normalizedType = attachment.type?.toUpperCase();

  const extension = getFileExtension(attachment.filename);

  const isPdf =
    (normalizedType === "FILE" || normalizedType === "DOCUMENT") &&
    (extension === "pdf" ||
      attachment.filename?.toLowerCase().endsWith(".pdf"));

  const blurDataURL =
    "blurDataURL" in attachment && typeof attachment.blurDataURL === "string"
      ? attachment.blurDataURL
      : undefined;

  if (normalizedType === "IMAGE") {
    return (
      <div
        className="
          relative
          aspect-[4/3]
          w-full
          overflow-hidden
          rounded-2xl
          bg-slate-100
          dark:bg-slate-900
        "
      >
        <Image
          src={attachment.url}
          alt={attachment.filename ?? "Shared image"}
          fill
          priority
          sizes="(max-width: 1280px) 100vw, 390px"
          placeholder={blurDataURL ? "blur" : "empty"}
          blurDataURL={blurDataURL}
          className="object-contain"
        />
      </div>
    );
  }

  if (normalizedType === "GIF") {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900">
        <Image
          src={attachment.url}
          alt={attachment.filename ?? "Shared GIF"}
          fill
          priority
          unoptimized
          sizes="(max-width: 1280px) 100vw, 390px"
          className="object-contain"
        />
      </div>
    );
  }

  if (normalizedType === "VIDEO") {
    return (
      <div className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl bg-black">
        <video
          src={attachment.url}
          controls
          playsInline
          preload="metadata"
          className="max-h-full w-full object-contain"
        >
          Your browser does not support video playback.
        </video>
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className="h-[56dvh] min-h-[420px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <iframe
          src={attachment.url}
          title={attachment.filename ?? "PDF document"}
          className="h-full w-full"
        />
      </div>
    );
  }

  return (
    <div
      className="
        flex
        min-h-72
        w-full
        flex-col
        items-center
        justify-center
        rounded-2xl
        border
        border-slate-200
        bg-gradient-to-br
        from-violet-50
        via-white
        to-slate-50
        px-6
        text-center
        dark:border-slate-800
        dark:from-violet-950/20
        dark:via-slate-950
        dark:to-slate-950
      "
    >
      <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-elitePurple/10 text-elitePurple">
        <FileText size={36} />
      </span>

      <h2 className="mt-5 max-w-full truncate text-base font-black text-slate-900 dark:text-white">
        {attachment.filename ?? "Shared file"}
      </h2>

      <p className="mt-2 text-xs font-semibold text-slate-500">
        {extension ? extension.toUpperCase() : "FILE"} ·{" "}
        {formatBytes(attachment.size)}
      </p>

      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-elitePurple px-5 text-sm font-black text-white transition hover:brightness-110"
      >
        <ExternalLink size={17} />
        Open file
      </a>
    </div>
  );
}

export default function MediaDynamicPage() {
  const router = useRouter();

  const params = useParams<{
    mid: string;
  }>();

  const searchParams = useSearchParams();

  const attachmentId = params.mid;

  const rawSource = searchParams.get("source");

  const source: MediaSources | null =
    rawSource === MediaSources.CHATS
      ? MediaSources.CHATS
      : rawSource === MediaSources.GROUPCHATS
        ? MediaSources.GROUPCHATS
        : null;

  const {
    data: attachment,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["ATTACHMENTPAGE", attachmentId, source],

    queryFn: () => {
      if (!source) {
        throw new Error("Invalid attachment source");
      }

      return GetAttachmentById(attachmentId, source);
    },

    enabled: Boolean(attachmentId && source),
  });

  if (!source) {
    return (
      <section className="flex h-full min-h-0 w-full items-center justify-center p-5">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-center text-sm font-semibold text-red-600 dark:border-red-950 dark:bg-red-950/20">
          Invalid or missing media source.
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="h-full min-h-0 w-full overflow-y-auto p-4">
        <div className="animate-pulse">
          <div className="mb-4 h-11 w-28 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="aspect-[4/3] rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="mt-4 h-24 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </section>
    );
  }

  if (isError || !attachment) {
    return (
      <section className="flex h-full min-h-0 w-full items-center justify-center p-5">
        <div className="max-w-sm rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-center dark:border-red-950 dark:bg-red-950/20">
          <p className="font-black text-red-600">Could not load this media</p>

          <p className="mt-2 text-sm text-red-500">
            {error instanceof Error
              ? error.message
              : "The attachment may have been deleted or is unavailable."}
          </p>
        </div>
      </section>
    );
  }

  const sender = attachment.message.sender;

  const senderName = getSenderName(attachment);

  const conversationId =
    source === MediaSources.GROUPCHATS
      ? (attachment as IGroupMessageAttachment).message.groupId
      : (attachment as IMessageAttachment).message.chatroomId;

  const conversationLabel =
    source === MediaSources.GROUPCHATS
      ? "Group conversation"
      : "Direct conversation";

  return (
    <section
      className="
        h-full
        min-h-0
        w-full
        overflow-y-auto
        overflow-x-hidden
        overscroll-contain
        bg-white
        px-3
        py-4
        pb-[max(1rem,env(safe-area-inset-bottom))]
        dark:bg-customBlack
        sm:px-5
      "
    >
      <header className="mb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.push("/media")}
          className="
            flex
            h-11
            items-center
            gap-2
            rounded-xl
            px-3
            text-sm
            font-black
            text-slate-600
            transition
            hover:bg-slate-100
            hover:text-elitePurple
            dark:text-slate-300
            dark:hover:bg-slate-900
          "
        >
          <ArrowLeft size={19} />
          Back
        </button>

        <button
          type="button"
          aria-label="Close media preview"
          onClick={() => router.push("/media")}
          className="
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-full
            border
            border-slate-200
            bg-white
            text-slate-600
            transition
            hover:border-elitePurple
            hover:bg-elitePurple
            hover:text-white
            dark:border-slate-800
            dark:bg-slate-950
            dark:text-slate-300
          "
        >
          <X size={19} />
        </button>
      </header>

      <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <MediaPreview attachment={attachment} />

        <div className="mt-4 flex min-w-0 items-center gap-3">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-elitePurple/10">
            {sender.userPfpUrl ? (
              <Image
                src={sender.userPfpUrl}
                alt={senderName}
                fill
                sizes="44px"
                className="object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-sm font-black text-elitePurple">
                {sender.firstname?.charAt(0).toUpperCase() ??
                  sender.username.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-slate-900 dark:text-white">
              {senderName}
            </p>

            <p className="mt-1 truncate text-[11px] font-semibold text-slate-500">
              @{sender.username}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="
              flex
              min-h-11
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-slate-200
              px-3
              text-xs
              font-black
              text-slate-600
              transition
              hover:border-elitePurple
              hover:text-elitePurple
              dark:border-slate-800
              dark:text-slate-300
            "
          >
            <ExternalLink size={15} />
            Open
          </a>

          <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="
              flex
              min-h-11
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-elitePurple
              px-3
              text-xs
              font-black
              text-white
              transition
              hover:brightness-110
            "
          >
            <Download size={15} />
            Download
          </a>
        </div>

        <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <MetadataRow
            icon={
              attachment.type === "VIDEO"
                ? Video
                : attachment.type === "IMAGE"
                  ? ImageIcon
                  : FileText
            }
            label="Media type"
            value={attachment.type}
          />

          <MetadataRow
            icon={HardDrive}
            label="File size"
            value={formatBytes(attachment.size)}
          />

          <MetadataRow
            icon={CalendarDays}
            label="Shared date"
            value={new Date(attachment.createdAt).toLocaleDateString(
              undefined,
              {
                month: "short",
                day: "numeric",
                year: "numeric",
              },
            )}
          />
        </div>

        <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
          <h2 className="text-sm font-black text-slate-900 dark:text-white">
            Shared in
          </h2>

          <button
            type="button"
            onClick={() => {
              if (source === MediaSources.GROUPCHATS) {
                router.push(`/groups/${conversationId}`);
              } else {
                router.push(`/chats/${conversationId}`);
              }
            }}
            className="
              mt-3
              flex
              w-full
              min-w-0
              items-center
              justify-between
              gap-3
              rounded-2xl
              border
              border-slate-200
              p-3
              text-left
              transition
              hover:border-elitePurple
              hover:bg-elitePurple/5
              dark:border-slate-800
            "
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-elitePurple text-white">
                {source === MediaSources.GROUPCHATS ? (
                  <Users size={18} />
                ) : (
                  <MessageCircle size={18} />
                )}
              </span>

              <span className="min-w-0">
                <span className="block truncate text-sm font-black text-slate-800 dark:text-slate-100">
                  {conversationLabel}
                </span>

                <span className="mt-0.5 block truncate text-[10px] text-slate-400">
                  {conversationId}
                </span>
              </span>
            </span>

            <ExternalLink size={16} className="shrink-0 text-slate-400" />
          </button>
        </div>
      </article>
    </section>
  );
}

interface MetadataRowProps {
  icon: React.ComponentType<{
    size?: number;
    className?: string;
  }>;
  label: string;
  value: string;
}

function MetadataRow({ icon: Icon, label, value }: MetadataRowProps) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-900">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-elitePurple/10 text-elitePurple">
        <Icon size={18} />
      </span>

      <span className="min-w-0">
        <span className="block text-[10px] font-black uppercase tracking-wide text-slate-400">
          {label}
        </span>

        <span className="mt-0.5 block truncate text-xs font-black text-slate-700 dark:text-slate-200">
          {value}
        </span>
      </span>
    </div>
  );
}

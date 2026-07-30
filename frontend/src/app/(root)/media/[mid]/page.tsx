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
  if (!size || size <= 0) return "Unknown size";

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(size) / Math.log(1024)),
    units.length - 1,
  );

  const formattedSize = size / 1024 ** index;

  return `${formattedSize.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function getFileExtension(filename?: string | null) {
  if (!filename?.includes(".")) return "";

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
    normalizedType === "FILE" &&
    (extension === "pdf" ||
      attachment.filename?.toLowerCase().endsWith(".pdf"));

  if (normalizedType === "IMAGE") {
    return (
      <div className="relative min-h-[360px] w-full overflow-hidden rounded-2xl bg-slate-100 sm:min-h-[460px] lg:min-h-[520px] dark:bg-slate-900">
        <Image
          src={attachment.url}
          alt={attachment.filename ?? "Shared image"}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 700px"
          className="object-contain"
        />
      </div>
    );
  }

  if (normalizedType === "GIF") {
    return (
      <div className="relative min-h-[360px] w-full overflow-hidden rounded-2xl bg-slate-100 sm:min-h-[460px] lg:min-h-[520px] dark:bg-slate-900">
        <Image
          src={attachment.url}
          alt={attachment.filename ?? "Shared GIF"}
          fill
          priority
          unoptimized
          sizes="(max-width: 768px) 100vw, 700px"
          className="object-contain"
        />
      </div>
    );
  }

  if (normalizedType === "VIDEO") {
    return (
      <div className="flex min-h-[360px] w-full items-center justify-center overflow-hidden rounded-2xl bg-black sm:min-h-[460px] lg:min-h-[520px]">
        <video
          src={attachment.url}
          controls
          playsInline
          preload="metadata"
          className="max-h-[70vh] w-full object-contain"
        >
          Your browser does not support video playback.
        </video>
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className="min-h-[520px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <iframe
          src={attachment.url}
          title={attachment.filename ?? "PDF document"}
          className="h-[65vh] min-h-[520px] w-full"
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-[420px] w-full flex-col items-center justify-center rounded-2xl border border-slate-200 bg-gradient-to-br from-violet-50 via-white to-slate-50 px-8 text-center dark:border-slate-800 dark:from-violet-950/20 dark:via-slate-950 dark:to-slate-950">
      <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-elitePurple/10 text-elitePurple">
        <FileText size={42} />
      </div>

      <h2 className="mt-6 max-w-md truncate text-lg font-bold text-slate-900 dark:text-white">
        {attachment.filename ?? "Shared file"}
      </h2>

      <p className="mt-2 text-sm font-medium text-slate-500">
        {extension ? extension.toUpperCase() : "FILE"} ·{" "}
        {formatBytes(attachment.size)}
      </p>

      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-elitePurple px-5 text-sm font-bold text-white transition hover:bg-elitePurpleHover"
      >
        <ExternalLink size={17} />
        Open file
      </a>
    </div>
  );
}

export default function MediaDynamicPage() {
  const router = useRouter();
  const params = useParams<{ mid: string }>();
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
      <section className="flex min-h-full w-full items-center justify-center p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-sm font-semibold text-red-600 dark:border-red-950 dark:bg-red-950/20">
          Invalid or missing media source.
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="w-full p-5">
        <div className="mx-auto w-full max-w-5xl animate-pulse">
          <div className="mb-5 flex items-center justify-between">
            <div className="h-10 w-24 rounded-xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
          </div>

          <div className="h-[520px] rounded-2xl bg-slate-200 dark:bg-slate-800" />

          <div className="mt-5 h-24 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </section>
    );
  }

  if (isError || !attachment) {
    return (
      <section className="flex min-h-full w-full items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-center dark:border-red-950 dark:bg-red-950/20">
          <p className="font-bold text-red-600">Could not load this media</p>

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
    <section className="min-h-full w-full bg-slate-50/40 p-4 sm:p-5 dark:bg-slate-950/20">
      <div className="mx-auto w-full max-w-5xl">
        {/* Header */}
        <header className="mb-5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/media")}
            className="group flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-600 transition hover:bg-white hover:text-elitePurple hover:shadow-sm dark:text-slate-300 dark:hover:bg-slate-900"
          >
            <ArrowLeft
              size={19}
              className="transition-transform group-hover:-translate-x-0.5"
            />
            Back
          </button>

          <button
            type="button"
            aria-label="Close media preview"
            onClick={() => router.push("/media")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-elitePurple hover:bg-elitePurple hover:text-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
          >
            <X size={19} />
          </button>
        </header>

        {/* Main card */}
        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4 dark:border-slate-800 dark:bg-slate-950">
          <MediaPreview attachment={attachment} />

          {/* Sender information */}
          <div className="mt-5 flex flex-col gap-4 px-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-elitePurple/10">
                {sender.userPfpUrl ? (
                  <Image
                    src={sender.userPfpUrl}
                    alt={senderName}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-black text-elitePurple">
                    {sender.firstname?.charAt(0).toUpperCase() ??
                      sender.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                  {senderName}
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500">
                  <span>@{sender.username}</span>

                  <span className="h-1 w-1 rounded-full bg-slate-300" />

                  <span>
                    {new Date(attachment.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-600 transition hover:border-elitePurple hover:bg-elitePurple hover:text-white dark:border-slate-800 dark:text-slate-300"
              >
                <ExternalLink size={15} />
                Open
              </a>

              <a
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 items-center gap-2 rounded-xl bg-elitePurple px-4 text-xs font-bold text-white transition hover:bg-elitePurpleHover"
              >
                <Download size={15} />
                Download
              </a>
            </div>
          </div>

          {/* Metadata */}
          <div className="mt-5 grid grid-cols-1 gap-3 border-t border-slate-100 px-1 pt-5 sm:grid-cols-3 dark:border-slate-800">
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-elitePurple/10 text-elitePurple">
                {attachment.type === "VIDEO" ? (
                  <Video size={19} />
                ) : attachment.type === "IMAGE" ? (
                  <ImageIcon size={19} />
                ) : (
                  <FileText size={19} />
                )}
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Media type
                </p>

                <p className="truncate text-xs font-bold text-slate-700 dark:text-slate-200">
                  {attachment.type}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-elitePurple/10 text-elitePurple">
                <HardDrive size={19} />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  File size
                </p>

                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {formatBytes(attachment.size)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-elitePurple/10 text-elitePurple">
                <CalendarDays size={19} />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Shared date
                </p>

                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {new Date(attachment.createdAt).toLocaleDateString(
                    undefined,
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    },
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Shared in */}
          <div className="mt-5 border-t border-slate-100 px-1 pt-5 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
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
              className="mt-3 flex w-full items-center justify-between rounded-2xl border border-slate-200 p-3 text-left transition hover:border-elitePurple hover:bg-elitePurple/5 dark:border-slate-800"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-elitePurple text-white">
                  {source === MediaSources.GROUPCHATS ? (
                    <Users size={19} />
                  ) : (
                    <MessageCircle size={19} />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {conversationLabel}
                  </p>

                  <p className="mt-0.5 truncate text-xs text-slate-400">
                    {conversationId}
                  </p>
                </div>
              </div>

              <ExternalLink size={17} className="shrink-0 text-slate-400" />
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}

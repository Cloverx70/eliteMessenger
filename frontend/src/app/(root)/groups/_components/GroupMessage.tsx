"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  FileText,
  X,
} from "lucide-react";
import { FaRegClock } from "react-icons/fa";
import {
  IoCheckmarkDone,
  IoCheckmarkOutline,
} from "react-icons/io5";

import get12hrTiming from "@/app/constants";

import { AttachmentType } from "../../chats/action";
import { IGroupMessage } from "../group-action";

type GroupMessageProps = {
  message: IGroupMessage;
  isSender: boolean;
  isLast: boolean;
};

const GroupMessage = ({
  message,
  isSender,
  isLast,
}: GroupMessageProps) => {
  const messagesEndRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const [
    selectedImage,
    setSelectedImage,
  ] =
    useState<string | null>(
      null,
    );

  useEffect(() => {
    if (isLast) {
      messagesEndRef.current?.scrollIntoView(
        {
          behavior: "smooth",
          block: "end",
        },
      );
    }
  }, [
    isLast,
    message.status,
  ]);

  const receiptSummary =
    message.receiptSummary;

  const receiptTitle =
    receiptSummary
      ? `${receiptSummary.seenCount} seen · ${receiptSummary.deliveredCount} delivered · ${receiptSummary.totalRecipients} recipients`
      : "Message receipt status";

  return (
    <>
      <div
        ref={messagesEndRef}
        className={`flex w-full min-w-0 ${
          isSender
            ? "justify-end"
            : "justify-start"
        }`}
      >
        <div
          className="
            flex
            min-w-0
            max-w-[88%]
            flex-col
            gap-1
            sm:max-w-[78%]
            lg:max-w-[72%]
          "
        >
          {!isSender &&
          message.sender ? (
            <p className="truncate px-2 text-[10px] font-bold text-slate-500 dark:text-slate-400">
              {message.sender
                .firstname ||
                message.sender
                  .username}
            </p>
          ) : null}

          <div
            className={`
              flex
              min-w-0
              flex-col
              gap-2
              rounded-2xl
              px-3
              py-2.5
              ${
                isSender
                  ? "rounded-br-md bg-elitePurple text-white"
                  : "rounded-bl-md bg-white text-slate-900 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:text-white dark:ring-slate-800"
              }
            `}
          >
            {(message.attachments
              ?.length ??
              0) > 0 ? (
              <div className="flex min-w-0 flex-col gap-2">
                {message.attachments.map(
                  (
                    attachment,
                    index,
                  ) => (
                    <div
                      className="min-w-0"
                      key={
                        attachment.id ??
                        attachment.key ??
                        index
                      }
                    >
                      {attachment.type ===
                        AttachmentType.IMAGE &&
                      attachment.url ? (
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedImage(
                              attachment.url!,
                            )
                          }
                          className="
                            block
                            max-w-full
                            overflow-hidden
                            rounded-xl
                          "
                        >
                          <img
                            src={
                              attachment.url
                            }
                            alt={
                              attachment.key ??
                              "Group attachment"
                            }
                            className="
                              h-auto
                              max-h-[380px]
                              w-[min(72vw,280px)]
                              max-w-full
                              object-cover
                              transition
                              hover:opacity-90
                            "
                          />
                        </button>
                      ) : null}

                      {attachment.type ===
                        AttachmentType.VIDEO &&
                      attachment.url ? (
                        <video
                          src={
                            attachment.url
                          }
                          controls
                          preload="metadata"
                          className="
                            max-h-[380px]
                            w-[min(74vw,320px)]
                            max-w-full
                            rounded-xl
                            bg-black
                          "
                        />
                      ) : null}

                      {attachment.type ===
                        AttachmentType.AUDIO &&
                      attachment.url ? (
                        <audio
                          src={
                            attachment.url
                          }
                          controls
                          className="w-[min(72vw,300px)] max-w-full"
                        />
                      ) : null}

                      {(attachment.type ===
                        AttachmentType.DOCUMENT ||
                        attachment.type ===
                          AttachmentType.FILE) &&
                      attachment.url ? (
                        <a
                          href={
                            attachment.url
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="
                            flex
                            min-w-0
                            items-center
                            gap-2
                            rounded-xl
                            bg-black/10
                            px-3
                            py-3
                            text-sm
                            transition
                            hover:bg-black/20
                          "
                        >
                          <FileText
                            size={18}
                            className="shrink-0"
                          />

                          <span className="min-w-0 flex-1 truncate">
                            {attachment.key ??
                              "Open attachment"}
                          </span>
                        </a>
                      ) : null}
                    </div>
                  ),
                )}
              </div>
            ) : null}

            {message.message ? (
              <p className="whitespace-pre-wrap break-words text-sm leading-5">
                {message.message}
              </p>
            ) : null}

            <div
              className={`
                flex
                items-center
                justify-end
                gap-1
                ${
                  isSender
                    ? "text-white/80"
                    : "text-slate-400"
                }
              `}
            >
              <p className="text-[9px]">
                {get12hrTiming(
                  new Date(
                    message.createdAt,
                  ),
                )}
              </p>

              {isSender ? (
                <span
                  title={
                    receiptTitle
                  }
                >
                  {message.status ===
                  "pending" ? (
                    <FaRegClock
                      size={11}
                    />
                  ) : message.status ===
                    "sent" ? (
                    <IoCheckmarkOutline
                      size={14}
                    />
                  ) : message.status ===
                    "delivered" ? (
                    <IoCheckmarkDone
                      size={14}
                    />
                  ) : (
                    <IoCheckmarkDone
                      size={14}
                      color="#C4B5FD"
                    />
                  )}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {selectedImage ? (
        <div
          className="
            fixed
            inset-0
            z-[90]
            flex
            items-center
            justify-center
            bg-black/95
            p-3
            pt-[max(0.75rem,env(safe-area-inset-top))]
            pb-[max(0.75rem,env(safe-area-inset-bottom))]
          "
          onClick={() =>
            setSelectedImage(null)
          }
        >
          <button
            type="button"
            aria-label="Close image preview"
            onClick={() =>
              setSelectedImage(null)
            }
            className="
              absolute
              right-3
              top-[max(0.75rem,env(safe-area-inset-top))]
              z-10
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-full
              bg-white/10
              text-white
              backdrop-blur
            "
          >
            <X size={22} />
          </button>

          <img
            src={selectedImage}
            alt="Group attachment preview"
            className="max-h-[92dvh] max-w-full rounded-xl object-contain"
            onClick={(event) =>
              event.stopPropagation()
            }
          />
        </div>
      ) : null}
    </>
  );
};

export default GroupMessage;

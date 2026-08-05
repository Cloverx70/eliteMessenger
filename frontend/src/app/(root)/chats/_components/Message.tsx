"use client";

import { AttachmentType, ITempMessage } from "../action";
import { useEffect, useRef, useState } from "react";

import { FaRegClock } from "react-icons/fa";
import { IoCheckmarkDone } from "react-icons/io5";
import { IoCheckmarkOutline } from "react-icons/io5";
import { SharedPostMessageCard } from "./shared-post-message-card";
import get12hrTiming from "@/app/constants";

interface MessageProps {
  message: ITempMessage;
  isSender: boolean;
  isLast: boolean;
}

const Message = ({ message, isSender, isLast }: MessageProps) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (isLast) {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [isLast]);

  const hasAttachments = Boolean(message.attachments?.length);

  const hasSharedPost = Boolean(message.sharedPostId || message.sharedPost);

  const normalizedMessage = message.message?.trim() ?? "";

  const isAutomaticSharedPostText =
    hasSharedPost && normalizedMessage.toLowerCase() === "shared a post";

  const shouldShowText =
    normalizedMessage.length > 0 && !isAutomaticSharedPostText;

  const hasNormalBubble = hasAttachments || shouldShowText;

  return (
    <>
      <div
        ref={messagesEndRef}
        className={`flex w-full ${isSender ? "justify-end" : "justify-start"}`}
      >
        <div
          className={`flex max-w-[85%] flex-col gap-1 sm:max-w-[75%] lg:max-w-[70%] ${
            isSender ? "items-end" : "items-start"
          }`}
        >
          {/* Normal message bubble */}
          {hasNormalBubble ? (
            <div
              className={`
                flex max-w-full flex-col gap-2
                rounded-xl px-3 py-2
                ${
                  isSender
                    ? "bg-elitePurple text-white"
                    : "bg-[#f4f5f7] text-black dark:bg-slate-800 dark:text-white"
                }
              `}
            >
              {/* Attachments */}
              {hasAttachments ? (
                <div className="flex flex-col gap-2">
                  {message.attachments?.map((attachment) => (
                    <div key={attachment.id}>
                      {/* Image */}
                      {attachment.type === AttachmentType.IMAGE &&
                      attachment.url ? (
                        <img
                          src={attachment.url}
                          alt={attachment.key ?? "Message attachment"}
                          className="
                              max-h-[350px]
                              w-auto
                              max-w-full
                              cursor-pointer
                              rounded-xl
                              object-cover
                              transition
                              hover:opacity-90
                              sm:max-w-[260px]
                            "
                          onClick={() => setSelectedImage(attachment.url!)}
                        />
                      ) : null}

                      {/* Video */}
                      {attachment.type === AttachmentType.VIDEO &&
                      attachment.url ? (
                        <video
                          src={attachment.url}
                          controls
                          preload="metadata"
                          className="
                              max-h-[350px]
                              w-full
                              max-w-[300px]
                              rounded-xl
                            "
                        />
                      ) : null}

                      {/* Document or file */}
                      {(attachment.type === AttachmentType.DOCUMENT ||
                        attachment.type === AttachmentType.FILE) &&
                      attachment.url ? (
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="
                              flex
                              max-w-[260px]
                              items-center
                              gap-2
                              rounded-lg
                              bg-black/10
                              px-3
                              py-2
                              text-sm
                              transition
                              hover:bg-black/20
                            "
                        >
                          <span>📄</span>

                          <span className="max-w-[180px] truncate">
                            {attachment.key ?? "Attachment"}
                          </span>
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Normal message text */}
              {shouldShowText ? (
                <p className="whitespace-pre-wrap break-words text-sm">
                  {normalizedMessage}
                </p>
              ) : null}
            </div>
          ) : null}

          {/* Shared post */}
          {hasSharedPost ? (
            <SharedPostMessageCard post={message.sharedPost ?? null} />
          ) : null}

          {/* Time and status */}
          <div
            className={`flex items-center gap-1 px-1 text-slate-400 ${
              isSender ? "justify-end" : "justify-start"
            }`}
          >
            <p className="text-[9px]">
              {get12hrTiming(new Date(message.createdAt))}
            </p>

            {isSender ? (
              message.status === "pending" ? (
                <FaRegClock size={11} />
              ) : message.status === "sent" ? (
                <IoCheckmarkOutline size={13} />
              ) : message.status === "delivered" ? (
                <IoCheckmarkDone size={13} />
              ) : (
                <IoCheckmarkDone size={13} className="text-elitePurple" />
              )
            ) : null}
          </div>
        </div>
      </div>

      {/* Image viewer */}
      {selectedImage ? (
        <div
          role="button"
          tabIndex={0}
          className="
            fixed
            inset-0
            z-50
            flex
            cursor-pointer
            items-center
            justify-center
            bg-black/80
            p-4
          "
          onClick={() => setSelectedImage(null)}
          onKeyDown={(event) => {
            if (event.key === "Escape" || event.key === "Enter") {
              setSelectedImage(null);
            }
          }}
        >
          <img
            src={selectedImage}
            alt="Attachment preview"
            className="
              max-h-[90vh]
              max-w-[90vw]
              rounded-xl
              object-contain
            "
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  );
};

export default Message;

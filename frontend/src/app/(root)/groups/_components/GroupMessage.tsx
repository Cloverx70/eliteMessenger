"use client";

import { IoCheckmarkDone, IoCheckmarkOutline } from "react-icons/io5";
import React, { useEffect, useRef, useState } from "react";

import { AttachmentType } from "../../chats/action";
import { FaRegClock } from "react-icons/fa";
import { IGroupMessage } from "../group-action";
import get12hrTiming from "@/app/constants";

type GroupMessageProps = {
  message: IGroupMessage;
  isSender: boolean;
  isLast: boolean;
};

const GroupMessage = ({ message, isSender, isLast }: GroupMessageProps) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (isLast) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isLast, message.status]);

  const receiptTitle = `${message.receiptSummary.seenCount} seen · ${message.receiptSummary.deliveredCount} delivered · ${message.receiptSummary.totalRecipients} recipients`;

  return (
    <>
      <div
        ref={messagesEndRef}
        className={`flex w-full ${isSender ? "justify-end" : "justify-start"}`}
      >
        <div className="flex max-w-[75%] flex-col gap-1">
          {!isSender && message.sender && (
            <p className="px-2 text-[10px] font-semibold text-slate-500">
              {message.sender.firstname || message.sender.username}
            </p>
          )}

          <div
            className={`flex flex-col gap-2 rounded-xl px-3 py-2 ${
              isSender ? "bg-elitePurple text-white" : "bg-[#f4f5f7] text-black"
            }`}
          >
            {(message.attachments?.length ?? 0) > 0 && (
              <div className="flex flex-col gap-2">
                {message.attachments.map((attachment, index) => (
                  <div key={attachment.id ?? attachment.key ?? index}>
                    {attachment.type === AttachmentType.IMAGE &&
                      attachment.url && (
                        <img
                          src={attachment.url}
                          alt={attachment.key ?? "Group attachment"}
                          className="max-w-[260px] cursor-pointer rounded-xl transition hover:opacity-80"
                          onClick={() => setSelectedImage(attachment.url!)}
                        />
                      )}

                    {attachment.type === AttachmentType.VIDEO &&
                      attachment.url && (
                        <video
                          src={attachment.url}
                          controls
                          className="max-w-[300px] rounded-xl"
                        />
                      )}

                    {(attachment.type === AttachmentType.DOCUMENT ||
                      attachment.type === AttachmentType.FILE) &&
                      attachment.url && (
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-lg bg-black/10 px-3 py-2 text-sm transition hover:bg-black/20"
                        >
                          <span>📄</span>
                          <span className="max-w-[180px] truncate">
                            {attachment.key ?? "Open attachment"}
                          </span>
                        </a>
                      )}
                  </div>
                ))}
              </div>
            )}

            {message.message && (
              <p className="break-words text-sm">{message.message}</p>
            )}

            <div className="flex items-center justify-end gap-1">
              <p className="text-[9px]">
                {get12hrTiming(new Date(message.createdAt))}
              </p>

              {isSender && (
                <span title={receiptTitle}>
                  {message.status === "pending" ? (
                    <FaRegClock size={12} />
                  ) : message.status === "sent" ? (
                    <IoCheckmarkOutline size={14} />
                  ) : message.status === "delivered" ? (
                    <IoCheckmarkDone size={14} />
                  ) : (
                    <IoCheckmarkDone size={14} color="#C4B5FD" />
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 z-[70] flex cursor-pointer items-center justify-center bg-black/85"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Group attachment preview"
            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain"
          />
        </div>
      )}
    </>
  );
};

export default GroupMessage;

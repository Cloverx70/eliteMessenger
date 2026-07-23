"use client";

import { AttachmentType, ITempMessage } from "../action";
import React, { useEffect, useRef, useState } from "react";

import { FaRegClock } from "react-icons/fa";
import { IoCheckmarkDone } from "react-icons/io5";
import { IoCheckmarkOutline } from "react-icons/io5";
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
      });
    }
  }, [isLast]);

  return (
    <>
      <div
        ref={messagesEndRef}
        className={`w-full flex items-center ${
          isSender ? "justify-end" : "justify-start"
        }`}
      >
        <div
          className={`
          max-w-[70%]
          px-3 py-2
          flex flex-col gap-2
          rounded-xl
          ${isSender ? "bg-elitePurple text-white" : "bg-[#f4f5f7] text-black"}
          `}
        >
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-col gap-2">
              {message.attachments.map((attachment) => (
                <div key={attachment.id}>
                  {/* IMAGE */}
                  {attachment.type === AttachmentType.IMAGE &&
                    attachment.url && (
                      <img
                        src={attachment.url}
                        alt={attachment.key}
                        className="
                          max-w-[260px]
                          rounded-xl
                          cursor-pointer
                          hover:opacity-80
                          transition
                          "
                        onClick={() => setSelectedImage(attachment.url!)}
                      />
                    )}

                  {/* VIDEO */}
                  {attachment.type === AttachmentType.VIDEO &&
                    attachment.url && (
                      <video
                        src={attachment.url}
                        controls
                        className="
                          max-w-[300px]
                          rounded-xl
                          "
                      />
                    )}

                  {/* DOCUMENT / FILE */}
                  {(attachment.type === AttachmentType.DOCUMENT ||
                    attachment.type === AttachmentType.FILE) &&
                    attachment.url && (
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="
                          flex
                          items-center
                          gap-2
                          bg-black/10
                          px-3
                          py-2
                          rounded-lg
                          text-sm
                          hover:bg-black/20
                          transition
                          "
                      >
                        <span>📄</span>

                        <span className="truncate max-w-[180px]">
                          {attachment.key}
                        </span>
                      </a>
                    )}
                </div>
              ))}
            </div>
          )}

          {/* Text */}
          {message.message && (
            <p className="text-sm break-words">{message.message}</p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-1">
            <p className="text-[9px]">
              {get12hrTiming(new Date(message.createdAt))}
            </p>

            {isSender &&
              (message.status === "pending" ? (
                <FaRegClock size={12} />
              ) : message.status === "sent" ? (
                <IoCheckmarkOutline size={14} />
              ) : message.status === "delivered" ? (
                <IoCheckmarkDone size={14} />
              ) : (
                <IoCheckmarkDone size={14} color="#6D28D9" />
              ))}
          </div>
        </div>
      </div>

      {/* Image Viewer */}
      {selectedImage && (
        <div
          className="
          fixed
          inset-0
          z-50
          bg-black/80
          flex
          items-center
          justify-center
          cursor-pointer
          "
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="preview"
            className="
            max-h-[90vh]
            max-w-[90vw]
            rounded-xl
            "
          />
        </div>
      )}
    </>
  );
};

export default Message;

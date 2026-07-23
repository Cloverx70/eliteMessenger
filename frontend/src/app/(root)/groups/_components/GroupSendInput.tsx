"use client";

import {
  AttachmentType,
  IAttachment,
  UploadMessageAttachments,
} from "../../chats/action";
import { IGroupHeader, IGroupMessage } from "../group-action";
import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import AttachmentBar from "../../chats/_components/AttachmentBar";
import AttachmentPreview from "../../chats/_components/AttachmentPreview";
import { BsEmojiSmile } from "react-icons/bs";
import EmojiPicker from "emoji-picker-react";
import { FaPaperclip } from "react-icons/fa6";
import { IUser } from "@/app/auth/actions";
import { IoIosSend } from "react-icons/io";
import { useSocket } from "@/app/hooks/useSocket";
import { v4 as uuidv4 } from "uuid";

type GroupSendInputProps = {
  user: IUser;
  group: IGroupHeader;
  setMessages: React.Dispatch<React.SetStateAction<IGroupMessage[]>>;
};

const GroupSendInput = ({ user, group, setMessages }: GroupSendInputProps) => {
  const queryClient = useQueryClient();
  const { sendGroupMessage } = useSocket(user.id);

  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentBarActive, setAttachmentBarActive] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const { mutateAsync: uploadAttachments } = useMutation({
    mutationFn: (data: FormData) => UploadMessageAttachments(data),
    mutationKey: ["UPLOAD_GROUP_MESSAGE_ATTACHMENTS"],
  });

  const handleSendMessage = async () => {
    const text = value.trim();
    if ((!text && attachments.length === 0) || sending) return;

    const tempId = uuidv4();
    const selectedFiles = [...attachments];
    const temporaryAttachments: IAttachment[] = selectedFiles.map((file) => ({
      id: uuidv4(),
      url: URL.createObjectURL(file),
      type: getFileType(file),
      size: file.size,
      key: file.name,
    }));

    const optimisticMessage: IGroupMessage = {
      id: tempId,
      tempId,
      message: text,
      groupId: group.id,
      senderId: user.id,
      sid: user.id,
      sender: user,
      attachments: temporaryAttachments,
      status: "pending",
      receiptSummary: {
        totalRecipients: Math.max(group.memberCount - 1, 0),
        deliveredCount: 0,
        seenCount: 0,
        status: "sent",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    setMessages((previous) => [...previous, optimisticMessage]);
    setValue("");
    setAttachments([]);
    setAttachmentBarActive(false);
    setEmojiOpen(false);
    setSending(true);

    try {
      let uploadedAttachments: IAttachment[] = [];

      if (selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach((file) => formData.append("files", file));
        uploadedAttachments = (await uploadAttachments(formData)) ?? [];
      }

      sendGroupMessage(user.id, group.id, text, tempId, uploadedAttachments);

      queryClient.invalidateQueries({ queryKey: ["GROUPS"] });
    } catch {
      setMessages((previous) =>
        previous.filter((message) => message.id !== tempId),
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative flex h-12 w-full items-center justify-center rounded-2xl border px-3 py-7">
      <div className="flex w-full items-center justify-start gap-3">
        <div className="relative flex items-center">
          <FaPaperclip
            size={18}
            className="cursor-pointer text-slate-500 transition hover:text-elitePurple"
            onClick={() => setAttachmentBarActive((previous) => !previous)}
          />

          {attachmentBarActive && (
            <div className="absolute bottom-10 left-0 z-50">
              <AttachmentBar
                setAttachments={setAttachments}
                setattachmentBarActive={setAttachmentBarActive}
              />
            </div>
          )}
        </div>

        <AttachmentPreview
          files={attachments}
          removeFile={(index) =>
            setAttachments((previous) =>
              previous.filter((_, fileIndex) => fileIndex !== index),
            )
          }
        />

        <input
          placeholder={`Message ${group.name}...`}
          type="text"
          className="h-full flex-1 border-none bg-transparent text-sm outline-none"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void handleSendMessage();
            }
          }}
        />

        <div className="relative">
          <BsEmojiSmile
            className="mr-0.5 cursor-pointer text-slate-600"
            size={18}
            onClick={() => setEmojiOpen((previous) => !previous)}
          />

          {emojiOpen && (
            <div className="absolute bottom-10 right-0 z-50">
              <EmojiPicker
                onEmojiClick={(emojiData) => {
                  setValue((previous) => previous + emojiData.emoji);
                  setEmojiOpen(false);
                }}
              />
            </div>
          )}
        </div>

        <button
          type="button"
          disabled={sending}
          onClick={() => void handleSendMessage()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-elitePurple p-1 transition-transform duration-75 ease-in-out hover:scale-90 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="Send group message"
        >
          <IoIosSend className="mr-0.5 text-white" size={25} />
        </button>
      </div>
    </div>
  );
};

export default GroupSendInput;

const getFileType = (file: File): AttachmentType => {
  if (file.type.startsWith("image/")) return AttachmentType.IMAGE;
  if (file.type.startsWith("video/")) return AttachmentType.VIDEO;
  if (file.type.startsWith("audio/")) return AttachmentType.AUDIO;

  if (
    file.type === "application/pdf" ||
    file.type.includes("document") ||
    file.type.includes("word")
  ) {
    return AttachmentType.DOCUMENT;
  }

  return AttachmentType.FILE;
};

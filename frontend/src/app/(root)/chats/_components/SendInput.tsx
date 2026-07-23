"use client";

import {
  AttachmentType,
  IAttachment,
  IChatRoom,
  ITempMessage,
  UploadMessageAttachments,
} from "../action";
import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import AttachmentBar from "./AttachmentBar";
import AttachmentPreview from "./AttachmentPreview";
import { BsEmojiSmile } from "react-icons/bs";
import EmojiPicker from "emoji-picker-react";
import { FaPaperclip } from "react-icons/fa6";
import { IUser } from "@/app/auth/actions";
import { IoIosSend } from "react-icons/io";
import { useSocket } from "@/app/hooks/useSocket";
import { v4 as uuidv4 } from "uuid";

type SendInputProps = {
  user: IUser;
  rid: string | undefined;
  crid: string;
  setMessages: React.Dispatch<React.SetStateAction<ITempMessage[]>>;
  chatroom: IChatRoom;
};
const SendInput = ({
  user,
  rid,
  crid,
  setMessages,
  chatroom,
}: SendInputProps) => {
  const client = useQueryClient();

  const [value, setValue] = useState<string>("");
  const [attachments, setAttachments] = useState<File[]>([]);

  const [attachmentBarActive, setattachmentBarActive] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);

  const { sendMessage } = useSocket(user.id);

  const { mutateAsync: uploadMessageAttachmentsMutationAsync } = useMutation({
    mutationFn: (data: FormData) => UploadMessageAttachments(data),
    mutationKey: ["UPLOADMESSAGEATTACHMENTS"],
  });

  const handleSendMessage = async (text: string) => {
    if (text === "" && attachments.length === 0) return;

    const tempAttachments = attachments.map((file) => ({
      id: uuidv4(),
      url: URL.createObjectURL(file),
      type: getFileType(file),
    }));

    const newMessage: ITempMessage = {
      id: uuidv4(),

      message: text,

      // required:x
      chatRoom: chatroom, // will be replaced by server message

      chatroomId: crid,
      sender: user, // you must provide this
      sid: user.id,

      createdAt: new Date(),
      updatedAt: new Date(),
      status: "pending" as const,

      attachments: tempAttachments,

      // optional:
      deletedAt: null,
    };

    setMessages((prev) => [
      ...prev,
      {
        ...newMessage,
      },
    ]);

    setattachmentBarActive(false);
    setAttachments([]);

    let uploadedAttachments: IAttachment[] | undefined = [];

    if (attachments.length > 0) {
      const formdata = new FormData();

      attachments.forEach((file) => {
        formdata.append("files", file);
      });
      uploadedAttachments =
        await uploadMessageAttachmentsMutationAsync(formdata);
    }

    sendMessage(user.id, rid!, text, crid, newMessage.id, uploadedAttachments);

    setValue("");
    client.invalidateQueries({ queryKey: ["CHATROOMS"] });
  };
  return (
    <div className="relative w-full h-12 border rounded-2xl  flex items-center justify-center py-7 px-3">
      <div className="w-full flex justify-start items-center gap-3">
        <div className="relative flex items-center">
          <FaPaperclip
            size={18}
            className="text-slate-500 cursor-pointer hover:text-elitePurple transition"
            onClick={() => setattachmentBarActive((prev) => !prev)}
          />

          {attachmentBarActive && (
            <div className="absolute bottom-10 left-0 z-50">
              <AttachmentBar
                setAttachments={setAttachments}
                setattachmentBarActive={setattachmentBarActive}
              />
            </div>
          )}
        </div>
        <AttachmentPreview
          files={attachments}
          removeFile={(index) =>
            setAttachments((prev) => prev.filter((_, i) => i !== index))
          }
        />
        <input
          placeholder="Type a message..."
          type="text"
          className="flex-1 h-full text-sm bg-transparent border-none outline-none"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && value.length > 0) {
              e.preventDefault();
              handleSendMessage(value);
            }
          }}
          value={value}
        />

        <div className="relative">
          <BsEmojiSmile
            className="cursor-pointer text-slate-600 mr-0.5"
            size={18}
            onClick={() => setEmojiOpen((prev) => !prev)}
          />

          {emojiOpen && (
            <div className="absolute bottom-10 right-0 z-50">
              <EmojiPicker
                onEmojiClick={(emojiData) => {
                  setValue((prev) => prev + emojiData.emoji);
                  setEmojiOpen(false);
                }}
              />
            </div>
          )}
        </div>
        <div className=" bg-elitePurple rounded-full w-10 h-10 p-1 flex items-center justify-center hover:scale-90 transition-transform duration-75 ease-in-out">
          <IoIosSend
            className="cursor-pointer text-white mr-0.5"
            size={25}
            onClick={() => handleSendMessage(value)}
          />
        </div>
      </div>
    </div>
  );
};

export default SendInput;

const getFileType = (file: File): AttachmentType => {
  if (file.type.startsWith("image/")) {
    return AttachmentType.IMAGE;
  }

  if (file.type.startsWith("video/")) {
    return AttachmentType.VIDEO;
  }

  if (
    file.type === "application/pdf" ||
    file.type.includes("document") ||
    file.type.includes("word")
  ) {
    return AttachmentType.DOCUMENT;
  }

  return AttachmentType.DOCUMENT;
};

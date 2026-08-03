"use client";

import {
  useRef,
  useState,
} from "react";
import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import EmojiPicker from "emoji-picker-react";
import { BsEmojiSmile } from "react-icons/bs";
import { FaPaperclip } from "react-icons/fa6";
import { IoIosSend } from "react-icons/io";
import { v4 as uuidv4 } from "uuid";

import { IUser } from "@/app/auth/actions";
import { useSocket } from "@/app/hooks/useSocket";

import {
  AttachmentType,
  IAttachment,
  UploadMessageAttachments,
} from "../../chats/action";
import {
  IGroupHeader,
  IGroupMessage,
} from "../group-action";
import AttachmentBar from "../../chats/_components/AttachmentBar";
import AttachmentPreview from "../../chats/_components/AttachmentPreview";

type GroupSendInputProps = {
  user: IUser;
  group: IGroupHeader;
  setMessages: React.Dispatch<
    React.SetStateAction<
      IGroupMessage[]
    >
  >;
};

const GroupSendInput = ({
  user,
  group,
  setMessages,
}: GroupSendInputProps) => {
  const queryClient =
    useQueryClient();

  const textareaRef =
    useRef<HTMLTextAreaElement | null>(
      null,
    );

  const { sendGroupMessage } =
    useSocket(user.id);

  const [value, setValue] =
    useState("");

  const [
    attachments,
    setAttachments,
  ] = useState<File[]>([]);

  const [
    attachmentBarActive,
    setAttachmentBarActive,
  ] = useState(false);

  const [
    emojiOpen,
    setEmojiOpen,
  ] = useState(false);

  const [
    sending,
    setSending,
  ] = useState(false);

  const {
    mutateAsync:
      uploadAttachments,
  } = useMutation({
    mutationFn: (
      data: FormData,
    ) =>
      UploadMessageAttachments(data),
    mutationKey: [
      "UPLOAD_GROUP_MESSAGE_ATTACHMENTS",
    ],
  });

  const canSend =
    Boolean(value.trim()) ||
    attachments.length > 0;

  const resizeTextarea = () => {
    const textarea =
      textareaRef.current;

    if (!textarea) return;

    textarea.style.height =
      "auto";

    textarea.style.height = `${Math.min(
      textarea.scrollHeight,
      128,
    )}px`;
  };

  const handleSendMessage =
    async () => {
      const text = value.trim();

      if (
        (!text &&
          attachments.length ===
            0) ||
        sending
      ) {
        return;
      }

      const tempId = uuidv4();
      const selectedFiles = [
        ...attachments,
      ];

      const temporaryAttachments:
        IAttachment[] =
        selectedFiles.map(
          (file) => ({
            id: uuidv4(),
            url:
              URL.createObjectURL(
                file,
              ),
            type:
              getFileType(file),
            size: file.size,
            key: file.name,
          }),
        );

      const optimisticMessage:
        IGroupMessage = {
        id: tempId,
        tempId,
        message: text,
        groupId: group.id,
        senderId: user.id,
        sid: user.id,
        sender: user,
        attachments:
          temporaryAttachments,
        status: "pending",
        receiptSummary: {
          totalRecipients:
            Math.max(
              group.memberCount - 1,
              0,
            ),
          deliveredCount: 0,
          seenCount: 0,
          status: "sent",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      setMessages((previous) => [
        ...previous,
        optimisticMessage,
      ]);

      setValue("");
      setAttachments([]);
      setAttachmentBarActive(
        false,
      );
      setEmojiOpen(false);
      setSending(true);

      if (textareaRef.current) {
        textareaRef.current.style.height =
          "44px";
      }

      try {
        let uploadedAttachments:
          IAttachment[] = [];

        if (
          selectedFiles.length > 0
        ) {
          const formData =
            new FormData();

          selectedFiles.forEach(
            (file) =>
              formData.append(
                "files",
                file,
              ),
          );

          uploadedAttachments =
            (await uploadAttachments(
              formData,
            )) ?? [];
        }

        sendGroupMessage(
          user.id,
          group.id,
          text,
          tempId,
          uploadedAttachments,
        );

        queryClient.invalidateQueries({
          queryKey: ["GROUPS"],
        });
      } catch {
        setMessages((previous) =>
          previous.filter(
            (message) =>
              message.id !== tempId,
          ),
        );
      } finally {
        setSending(false);
      }
    };

  return (
    <div className="relative flex w-full min-w-0 flex-col gap-2">
      {attachments.length > 0 ? (
        <div className="max-w-full overflow-x-auto pb-1">
          <AttachmentPreview
            files={attachments}
            removeFile={(index) =>
              setAttachments(
                (previous) =>
                  previous.filter(
                    (_, fileIndex) =>
                      fileIndex !==
                      index,
                  ),
              )
            }
          />
        </div>
      ) : null}

      <div
        className="
          flex
          min-w-0
          items-end
          gap-1.5
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-1.5
          shadow-sm
          dark:border-slate-700
          dark:bg-slate-900
          sm:gap-2
          sm:p-2
        "
      >
        <div className="relative shrink-0">
          <button
            type="button"
            aria-label="Add attachment"
            onClick={() => {
              setAttachmentBarActive(
                (previous) =>
                  !previous,
              );

              setEmojiOpen(false);
            }}
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-full
              text-slate-500
              transition
              hover:bg-slate-100
              hover:text-elitePurple
              dark:hover:bg-slate-800
            "
          >
            <FaPaperclip size={18} />
          </button>

          {attachmentBarActive ? (
            <div className="absolute bottom-14 left-0 z-50 max-w-[calc(100vw-1rem)]">
              <AttachmentBar
                setAttachments={
                  setAttachments
                }
                setattachmentBarActive={
                  setAttachmentBarActive
                }
              />
            </div>
          ) : null}
        </div>

        <textarea
          ref={textareaRef}
          rows={1}
          placeholder={`Message ${group.name}...`}
          className="
            min-h-11
            max-h-32
            min-w-0
            flex-1
            resize-none
            overflow-y-auto
            border-none
            bg-transparent
            px-1
            py-3
            text-sm
            leading-5
            text-slate-900
            outline-none
            placeholder:text-slate-400
            dark:text-white
          "
          value={value}
          onChange={(event) => {
            setValue(
              event.target.value,
            );
            resizeTextarea();
          }}
          onKeyDown={(event) => {
            if (
              event.key ===
                "Enter" &&
              !event.shiftKey
            ) {
              event.preventDefault();
              void handleSendMessage();
            }
          }}
        />

        <div className="relative shrink-0">
          <button
            type="button"
            aria-label="Open emoji picker"
            onClick={() => {
              setEmojiOpen(
                (previous) =>
                  !previous,
              );

              setAttachmentBarActive(
                false,
              );
            }}
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-full
              text-slate-600
              transition
              hover:bg-slate-100
              hover:text-elitePurple
              dark:text-slate-300
              dark:hover:bg-slate-800
            "
          >
            <BsEmojiSmile size={19} />
          </button>

          {emojiOpen ? (
            <div className="absolute bottom-14 right-0 z-50 w-[min(320px,calc(100vw-1rem))] overflow-hidden rounded-2xl shadow-2xl">
              <EmojiPicker
                width="100%"
                height={380}
                onEmojiClick={(
                  emojiData,
                ) => {
                  setValue(
                    (previous) =>
                      previous +
                      emojiData.emoji,
                  );

                  setEmojiOpen(false);

                  requestAnimationFrame(
                    () => {
                      textareaRef.current?.focus();
                      resizeTextarea();
                    },
                  );
                }}
              />
            </div>
          ) : null}
        </div>

        <button
          type="button"
          disabled={
            !canSend || sending
          }
          onClick={() =>
            void handleSendMessage()
          }
          className="
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-full
            bg-elitePurple
            text-white
            transition
            hover:scale-95
            hover:brightness-110
            disabled:cursor-not-allowed
            disabled:opacity-50
            disabled:hover:scale-100
          "
          aria-label="Send group message"
        >
          <IoIosSend size={24} />
        </button>
      </div>
    </div>
  );
};

export default GroupSendInput;

const getFileType = (
  file: File,
): AttachmentType => {
  if (
    file.type.startsWith(
      "image/",
    )
  ) {
    return AttachmentType.IMAGE;
  }

  if (
    file.type.startsWith(
      "video/",
    )
  ) {
    return AttachmentType.VIDEO;
  }

  if (
    file.type.startsWith(
      "audio/",
    )
  ) {
    return AttachmentType.AUDIO;
  }

  if (
    file.type ===
      "application/pdf" ||
    file.type.includes(
      "document",
    ) ||
    file.type.includes("word")
  ) {
    return AttachmentType.DOCUMENT;
  }

  return AttachmentType.FILE;
};

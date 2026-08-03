"use client";

import {
  AttachmentType,
  IAttachment,
  IChatRoom,
  ITempMessage,
  UploadMessageAttachments,
} from "../action";
import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import EmojiPicker from "emoji-picker-react";
import {
  useRef,
  useState,
} from "react";
import { BsEmojiSmile } from "react-icons/bs";
import { FaPaperclip } from "react-icons/fa6";
import { IoIosSend } from "react-icons/io";
import { v4 as uuidv4 } from "uuid";

import { IUser } from "@/app/auth/actions";
import { useSocket } from "@/app/hooks/useSocket";

import AttachmentBar from "./AttachmentBar";
import AttachmentPreview from "./AttachmentPreview";

type SendInputProps = {
  user: IUser;
  rid: string | undefined;
  crid: string;
  setMessages: React.Dispatch<
    React.SetStateAction<
      ITempMessage[]
    >
  >;
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
  const textareaRef =
    useRef<HTMLTextAreaElement | null>(
      null,
    );

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
  const [isSending, setIsSending] =
    useState(false);

  const { sendMessage } = useSocket(
    user.id,
  );

  const {
    mutateAsync:
      uploadMessageAttachments,
  } = useMutation({
    mutationFn: (
      data: FormData,
    ) =>
      UploadMessageAttachments(data),
    mutationKey: [
      "UPLOADMESSAGEATTACHMENTS",
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
        !rid ||
        isSending ||
        (!text &&
          attachments.length === 0)
      ) {
        return;
      }

      setIsSending(true);

      try {
        let uploadedAttachments:
          | IAttachment[]
          | undefined = [];

        if (
          attachments.length > 0
        ) {
          const formData =
            new FormData();

          attachments.forEach(
            (file) => {
              formData.append(
                "files",
                file,
              );
            },
          );

          uploadedAttachments =
            await uploadMessageAttachments(
              formData,
            );
        }

        const tempAttachments =
          attachments.map((file) => ({
            id: uuidv4(),
            url: URL.createObjectURL(
              file,
            ),
            type: getFileType(file),
          }));

        const tempId = uuidv4();

        const newMessage: ITempMessage =
          {
            id: tempId,
            message: text,
            chatRoom: chatroom,
            chatroomId: crid,
            sender: user,
            sid: user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
            status:
              "pending" as const,
            attachments:
              tempAttachments,
            deletedAt: null,
          };

        setMessages((previous) => [
          ...previous,
          newMessage,
        ]);

        sendMessage(
          user.id,
          rid,
          text,
          crid,
          tempId,
          uploadedAttachments,
        );

        setValue("");
        setAttachments([]);
        setAttachmentBarActive(
          false,
        );
        setEmojiOpen(false);

        if (
          textareaRef.current
        ) {
          textareaRef.current.style.height =
            "44px";
        }

        client.invalidateQueries({
          queryKey: ["CHATROOMS"],
        });
      } finally {
        setIsSending(false);
      }
    };

  return (
    <div className="relative flex w-full min-w-0 flex-col gap-2">
      {attachments.length > 0 ? (
        <div
          className="
            max-w-full
            overflow-x-auto
            pb-1
          "
        >
          <AttachmentPreview
            files={attachments}
            removeFile={(index) =>
              setAttachments(
                (previous) =>
                  previous.filter(
                    (_, itemIndex) =>
                      itemIndex !==
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
            <div
              className="
                absolute
                bottom-14
                left-0
                z-50
                max-w-[calc(100vw-1rem)]
              "
            >
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
          placeholder="Type a message..."
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
          value={value}
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
            <BsEmojiSmile
              size={19}
            />
          </button>

          {emojiOpen ? (
            <div
              className="
                absolute
                bottom-14
                right-0
                z-50
                w-[min(320px,calc(100vw-1rem))]
                overflow-hidden
                rounded-2xl
                shadow-2xl
              "
            >
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
          aria-label="Send message"
          disabled={
            !canSend ||
            isSending ||
            !rid
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
        >
          <IoIosSend size={24} />
        </button>
      </div>
    </div>
  );
};

export default SendInput;

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

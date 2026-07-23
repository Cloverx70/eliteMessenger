"use client";

import { FaFile, FaImage, FaVideo } from "react-icons/fa";

import { IoDocumentText } from "react-icons/io5";
import { useRef } from "react";

type AttachmentBarProps = {
  setAttachments: React.Dispatch<React.SetStateAction<File[]>>;
  setattachmentBarActive: React.Dispatch<React.SetStateAction<boolean>>;
};

const AttachmentBar = ({
  setAttachments,
  setattachmentBarActive,
}: AttachmentBarProps) => {
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const documentRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "video" | "document" | "file",
  ) => {
    const files = Array.from(e.target.files || []);

    let max = 0;

    switch (type) {
      case "image":
        max = 4;
        break;

      case "video":
        max = 1;
        break;

      case "document":
        max = 2;
        break;

      case "file":
        max = 2;
        break;
    }

    setAttachments((prev) => {
      const combined = [...prev, ...files];

      return combined.slice(0, max);
    });

    setattachmentBarActive(false);
  };

  return (
    <div className="w-52 rounded-2xl border bg-white dark:bg-customBlack shadow-xl p-3 flex flex-col gap-2">
      <input
        ref={imageRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => handleFiles(e, "image")}
      />

      <input
        ref={videoRef}
        type="file"
        accept="video/*"
        hidden
        onChange={(e) => handleFiles(e, "video")}
      />

      <input
        ref={documentRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        multiple
        hidden
        onChange={(e) => handleFiles(e, "document")}
      />

      <input
        ref={fileRef}
        type="file"
        multiple
        hidden
        onChange={(e) => handleFiles(e, "file")}
      />

      <button
        onClick={() => imageRef.current?.click()}
        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm"
      >
        <FaImage className="text-green-500" />
        Image
      </button>

      <button
        onClick={() => videoRef.current?.click()}
        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm"
      >
        <FaVideo className="text-purple-500" />
        Video
      </button>

      <button
        onClick={() => documentRef.current?.click()}
        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm"
      >
        <IoDocumentText className="text-blue-500" />
        Document
      </button>

      <button
        onClick={() => fileRef.current?.click()}
        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm"
      >
        <FaFile className="text-orange-500" />
        File
      </button>
    </div>
  );
};

export default AttachmentBar;

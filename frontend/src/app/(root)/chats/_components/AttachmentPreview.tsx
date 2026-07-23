"use client";

import Image from "next/image";
import { IoClose } from "react-icons/io5";

type Props = {
  files: File[];
  removeFile: (index: number) => void;
};

const AttachmentPreview = ({ files, removeFile }: Props) => {
  if (!files.length) return null;

  return (
    <div className="absolute bottom-16 left-0 w-full px-3 z-40">
      <div className="bg-white dark:bg-customBlack border rounded-2xl shadow-xl p-3 flex gap-3 overflow-x-auto">
        <div className=" flex flex-col gap-2">
          <p className=" text-xs text-slate-500">
            {files.length} Selected file(s) :{" "}
          </p>
          <div className=" flex gap-2">
            {files.map((file, index) => {
              const preview = URL.createObjectURL(file);

              const isImage = file.type.startsWith("image");
              const isVideo = file.type.startsWith("video");

              return (
                <div
                  key={index}
                  className="relative w-20 h-20 rounded-xl overflow-hidden border shrink-0 group"
                >
                  {isImage ? (
                    <Image
                      src={preview}
                      fill
                      alt={file.name}
                      className="object-cover"
                    />
                  ) : isVideo ? (
                    <video
                      src={preview}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 p-2">
                      <span className="text-xs truncate w-full text-center">
                        {file.name}
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => removeFile(index)}
                    className="
                  absolute
                  top-1
                  right-1
                  bg-black/60
                  text-white
                  rounded-full
                  w-5
                  h-5
                  flex
                  items-center
                  justify-center
                  opacity-0
                  group-hover:opacity-100
                  transition
                "
                  >
                    <IoClose size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttachmentPreview;

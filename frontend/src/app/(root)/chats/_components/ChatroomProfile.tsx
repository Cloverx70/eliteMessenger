"use client";

import { AttachmentType, GetChatroomInfo } from "../action";
import React, { useEffect, useState } from "react";
import { UsersRound, X } from "lucide-react";
import { useParams, usePathname } from "next/navigation";

import { ChatroomProfileLinks } from "@/app/constants";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";

type SelectedMedia = {
  url: string;
  type: AttachmentType;
};

const ChatroomProfile = () => {
  const { cid } = useParams();
  const path = usePathname();

  const safeCid: string = Array.isArray(cid) ? cid[0] : (cid ?? "");

  const [showAllMedia, setShowAllMedia] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia | null>(
    null,
  );

  const { data: ChatroomInfo } = useQuery({
    queryKey: ["CHATROOMINFO", safeCid],
    queryFn: () => GetChatroomInfo(safeCid),
    enabled: Boolean(safeCid),
  });

  useEffect(() => {
    const shouldLockScroll = showAllMedia || selectedMedia;

    if (shouldLockScroll) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [showAllMedia, selectedMedia]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      if (selectedMedia) {
        setSelectedMedia(null);
        return;
      }

      if (showAllMedia) {
        setShowAllMedia(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [showAllMedia, selectedMedia]);

  if (path !== `/chats/${safeCid}`) return null;

  const media = ChatroomInfo?.media ?? [];
  const links = ChatroomInfo?.links ?? [];

  const openMedia = (item: SelectedMedia) => {
    setSelectedMedia(item);
  };

  return (
    <>
      <section className="flex h-full w-full flex-col justify-start gap-10 overflow-y-auto px-10 py-10">
        {/* User information */}
        <div className="flex items-center justify-start gap-5">
          <div className="relative">
            <div
              className={`absolute bottom-1 right-1 z-10 h-4 w-4 rounded-full ${
                ChatroomInfo?.chatroom.recIsActive
                  ? "bg-green-500"
                  : "bg-slate-500"
              }`}
            />

            <div className="relative h-[70px] w-[70px] shrink-0">
              {ChatroomInfo?.chatroom.recUserPfpUrl ? (
                <Image
                  src={ChatroomInfo?.chatroom.recUserPfpUrl}
                  alt={`${ChatroomInfo?.chatroom.recUsername} avatar`}
                  fill
                  sizes="40px"
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="flex h-[70px] w-[70px] items-center justify-center rounded-full bg-elitePurple/10 text-elitePurple">
                  <UsersRound size={30} />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col">
            <h1 className="text-xl font-bold">
              {ChatroomInfo?.chatroom.recUsername}
            </h1>

            <p className="text-xs">
              {ChatroomInfo?.chatroom.recIsActive ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* Profile actions */}
        <div className="flex items-center justify-center gap-10 border-b pb-7">
          {ChatroomProfileLinks.map((link) => (
            <div
              className="flex cursor-pointer flex-col items-center justify-center gap-2 text-slate-600"
              key={link.label}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f5f6f7] transition-transform duration-75 ease-linear hover:scale-90">
                <link.icon size={25} className="text-slate-600" />
              </div>

              <p className="text-xs">{link.label}</p>
            </div>
          ))}
        </div>

        {/* About */}
        <div className="flex flex-col gap-3 border-b pb-7">
          <h1 className="font-bold">About</h1>

          <p className="break-words text-sm text-slate-600">
            {ChatroomInfo?.chatroom.recBio || "No bio available."}
          </p>
        </div>

        {/* Media */}
        <div className="flex flex-col gap-5 border-b pb-7">
          <div className="flex w-full items-start justify-between">
            <h1 className="font-bold">Media</h1>

            {media.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAllMedia(true)}
                className="cursor-pointer text-sm font-bold text-elitePurple transition-transform duration-75 ease-linear hover:scale-90"
              >
                See all
              </button>
            )}
          </div>

          {media.length === 0 ? (
            <div className="flex items-center justify-center">
              <p className="text-xs text-slate-600">No shared media...</p>
            </div>
          ) : (
            <div className="flex items-start gap-5 overflow-hidden">
              {media.slice(0, 4).map((item, index) => (
                <button
                  key={`${item.url}-${index}`}
                  type="button"
                  onClick={() =>
                    openMedia({
                      url: item.url,
                      type: item.type,
                    })
                  }
                  className="relative h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-2xl"
                >
                  {item.type === AttachmentType.IMAGE && (
                    <Image
                      alt="Shared media"
                      src={item.url}
                      fill
                      sizes="80px"
                      className="object-cover transition-transform duration-200 hover:scale-105"
                    />
                  )}

                  {item.type === AttachmentType.VIDEO && (
                    <video
                      src={item.url}
                      muted
                      preload="metadata"
                      className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Shared links */}
        <div className="flex w-full flex-col items-start justify-between">
          <div className="flex w-full items-start justify-between">
            <h1 className="font-bold">Shared Links</h1>

            <p className="cursor-pointer text-sm font-bold text-elitePurple transition-transform duration-75 ease-linear hover:scale-90">
              See all
            </p>
          </div>

          <div className="flex w-full flex-col gap-4 py-5">
            {links.length === 0 ? (
              <div className="flex items-center justify-center">
                <p className="text-xs text-slate-600">No shared links...</p>
              </div>
            ) : (
              links.slice(0, 4).map((link, index) => (
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={link.url}
                  key={`${link.url}-${index}`}
                  className="flex h-16 w-full items-center justify-start overflow-hidden rounded-2xl bg-gray-100 p-4 px-6 transition-colors duration-100 ease-linear hover:bg-elitePurple hover:text-white"
                >
                  <div className="flex min-w-0 flex-col items-start justify-center gap-2">
                    <h1 className="text-sm font-bold">{link.name}</h1>

                    <p className="w-full truncate text-xs">
                      {new URL(link.url).host}
                    </p>
                  </div>
                </a>
              ))
            )}
          </div>
        </div>
      </section>

      {/* All media container */}
      {showAllMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowAllMedia(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-bold">Shared Media</h2>

                <p className="text-xs text-slate-500">
                  {media.length} {media.length === 1 ? "item" : "items"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAllMedia(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200"
                aria-label="Close shared media"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {media.map((item, index) => (
                  <button
                    key={`${item.url}-${index}`}
                    type="button"
                    onClick={() =>
                      openMedia({
                        url: item.url,
                        type: item.type,
                      })
                    }
                    className="relative aspect-square cursor-pointer overflow-hidden rounded-2xl bg-gray-100"
                  >
                    {item.type === AttachmentType.IMAGE && (
                      <Image
                        src={item.url}
                        alt="Shared media"
                        fill
                        sizes="(max-width: 640px) 50vw, 200px"
                        className="object-cover transition-transform duration-200 hover:scale-105"
                      />
                    )}

                    {item.type === AttachmentType.VIDEO && (
                      <video
                        src={item.url}
                        muted
                        preload="metadata"
                        className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
                      />
                    )}

                    {item.type === AttachmentType.VIDEO && (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/15">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white">
                          ▶
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen media preview */}
      {selectedMedia && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <button
            type="button"
            onClick={() => setSelectedMedia(null)}
            className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            aria-label="Close media preview"
          >
            <X size={25} />
          </button>

          <div
            className="relative flex h-full max-h-[90vh] w-full max-w-6xl items-center justify-center"
            onClick={(event) => event.stopPropagation()}
          >
            {selectedMedia.type === AttachmentType.IMAGE && (
              <Image
                src={selectedMedia.url}
                alt="Fullscreen shared media"
                fill
                priority
                sizes="100vw"
                className="object-contain"
              />
            )}

            {selectedMedia.type === AttachmentType.VIDEO && (
              <video
                src={selectedMedia.url}
                controls
                autoPlay
                className="max-h-full max-w-full object-contain"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ChatroomProfile;

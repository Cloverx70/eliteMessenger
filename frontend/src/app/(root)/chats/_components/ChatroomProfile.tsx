"use client";

import { AttachmentType, GetChatroomInfo } from "../action";
import { ChatroomProfileLinks, getAgoTiming } from "@/app/constants";
import React, { useEffect, useState } from "react";
import { UsersRound, X } from "lucide-react";
import { useParams, usePathname } from "next/navigation";

import Image from "next/image";
import { usePresenceStore } from "@/app/stores/PresenceStore";
import { useQuery } from "@tanstack/react-query";

type SelectedMedia = {
  url: string;
  type: AttachmentType;
};

const ChatroomProfile = () => {
  const { cid } = useParams();
  const path = usePathname();

  const safeCid: string = Array.isArray(cid) ? cid[0] : (cid ?? "");

  const presenceByUserId = usePresenceStore((state) => state.presenceByUserId);

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
    const shouldLockScroll = showAllMedia || Boolean(selectedMedia);

    if (shouldLockScroll) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [showAllMedia, selectedMedia]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

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

  if (path !== `/chats/${safeCid}`) {
    return null;
  }

  const chatroom = ChatroomInfo?.chatroom;

  const media = ChatroomInfo?.media ?? [];

  const links = ChatroomInfo?.links ?? [];

  const recipientId = chatroom?.recId;

  const livePresence = recipientId ? presenceByUserId[recipientId] : undefined;

  const recipientIsActive =
    livePresence?.isActive ?? Boolean(chatroom?.recIsActive);

  const recipientLastSeen =
    livePresence?.lastSeen ??
    (chatroom?.recLastSeen ? String(chatroom.recLastSeen) : null);

  const presenceLabel = recipientIsActive
    ? "Online"
    : recipientLastSeen
      ? `Last seen ${getAgoTiming(new Date(recipientLastSeen))}`
      : "Offline";

  const recipientName = chatroom?.recUsername || "Elite user";

  const openMedia = (item: SelectedMedia) => {
    setSelectedMedia(item);
  };

  return (
    <>
      <section
        className="
          flex
          h-full
          min-h-0
          w-full
          min-w-0
          flex-col
          gap-6
          overflow-y-auto
          overflow-x-hidden
          overscroll-contain
          px-4
          py-5
          sm:px-5
          sm:py-6
          xl:px-6
        "
      >
        {/* User information */}
        <div
          className="
            flex
            min-w-0
            items-center
            gap-3
            border-b
            border-slate-200
            pb-6
            dark:border-slate-800
          "
        >
          <div className="relative shrink-0">
            <div
              className="
                relative
                h-14
                w-14
                shrink-0
                sm:h-16
                sm:w-16
              "
            >
              {chatroom?.recUserPfpUrl ? (
                <Image
                  src={chatroom.recUserPfpUrl}
                  alt={`${recipientName} avatar`}
                  fill
                  sizes="64px"
                  className="rounded-full object-cover"
                />
              ) : (
                <div
                  className="
                    flex
                    h-full
                    w-full
                    items-center
                    justify-center
                    rounded-full
                    bg-elitePurple/10
                    text-elitePurple
                  "
                >
                  <UsersRound size={26} />
                </div>
              )}
            </div>

            <span
              aria-label={recipientIsActive ? "Online" : "Offline"}
              className={`
                absolute
                bottom-0
                right-0
                z-10
                h-3.5
                w-3.5
                rounded-full
                border-2
                border-white
                dark:border-customBlack
                ${recipientIsActive ? "bg-emerald-500" : "bg-slate-400"}
              `}
            />
          </div>

          <div className="min-w-0 flex-1">
            <h1
              className="
                truncate
                text-base
                font-black
                text-slate-900
                dark:text-white
                sm:text-lg
              "
            >
              {recipientName}
            </h1>

            <p
              className="
                mt-1
                truncate
                text-[11px]
                font-medium
                text-slate-500
                dark:text-slate-400
              "
            >
              {presenceLabel}
            </p>
          </div>
        </div>

        {/* Profile actions */}
        <div
          className="
            grid
            w-full
            min-w-0
            grid-cols-3
            gap-2
            border-b
            border-slate-200
            pb-6
            dark:border-slate-800
            sm:gap-3
          "
        >
          {ChatroomProfileLinks.map((link) => (
            <button
              type="button"
              key={link.label}
              aria-label={link.label}
              className="
                  flex
                  min-w-0
                  flex-col
                  items-center
                  justify-start
                  gap-2
                  rounded-2xl
                  px-1
                  py-2
                  text-slate-600
                  transition
                  hover:bg-slate-50
                  dark:text-slate-300
                  dark:hover:bg-slate-900
                "
            >
              <span
                className="
                    flex
                    h-11
                    w-11
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-slate-100
                    transition-transform
                    hover:scale-95
                    dark:bg-slate-900
                    sm:h-12
                    sm:w-12
                  "
              >
                <link.icon size={21} />
              </span>

              <span
                className="
                    w-full
                    truncate
                    text-center
                    text-[10px]
                    font-bold
                    sm:text-[11px]
                  "
              >
                {link.label}
              </span>
            </button>
          ))}
        </div>

        {/* About */}
        <div
          className="
            flex
            min-w-0
            flex-col
            gap-3
            border-b
            border-slate-200
            pb-6
            dark:border-slate-800
          "
        >
          <h2
            className="
              text-sm
              font-black
              text-slate-900
              dark:text-white
            "
          >
            About
          </h2>

          <p
            className="
              max-w-full
              break-words
              text-sm
              leading-6
              text-slate-600
              dark:text-slate-400
            "
          >
            {chatroom?.recBio || "No bio available."}
          </p>
        </div>

        {/* Media */}
        <div
          className="
            flex
            min-w-0
            flex-col
            gap-4
            border-b
            border-slate-200
            pb-6
            dark:border-slate-800
          "
        >
          <div
            className="
              flex
              min-w-0
              items-center
              justify-between
              gap-3
            "
          >
            <h2
              className="
                text-sm
                font-black
                text-slate-900
                dark:text-white
              "
            >
              Media
            </h2>

            {media.length > 0 ? (
              <button
                type="button"
                onClick={() => setShowAllMedia(true)}
                className="
                  shrink-0
                  text-xs
                  font-black
                  text-elitePurple
                  transition-opacity
                  hover:opacity-70
                "
              >
                See all
              </button>
            ) : null}
          </div>

          {media.length === 0 ? (
            <div
              className="
                flex
                min-h-20
                items-center
                justify-center
                rounded-2xl
                bg-slate-50
                px-3
                dark:bg-slate-900/60
              "
            >
              <p
                className="
                  text-center
                  text-xs
                  text-slate-500
                  dark:text-slate-400
                "
              >
                No shared media
              </p>
            </div>
          ) : (
            <div
              className="
                grid
                w-full
                min-w-0
                grid-cols-3
                gap-2
                sm:grid-cols-4
              "
            >
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
                  className="
                        relative
                        aspect-square
                        min-w-0
                        overflow-hidden
                        rounded-xl
                        bg-slate-100
                        dark:bg-slate-900
                        sm:rounded-2xl
                      "
                >
                  {item.type === AttachmentType.IMAGE && (
                    <Image
                      alt="Shared media"
                      src={item.url}
                      fill
                      sizes="100px"
                      className="
                            object-cover
                            transition-transform
                            duration-200
                            hover:scale-105
                          "
                    />
                  )}

                  {item.type === AttachmentType.VIDEO && (
                    <>
                      <video
                        src={item.url}
                        muted
                        preload="metadata"
                        className="
                              h-full
                              w-full
                              object-cover
                            "
                      />

                      <span
                        className="
                              pointer-events-none
                              absolute
                              inset-0
                              flex
                              items-center
                              justify-center
                              bg-black/10
                            "
                      >
                        <span
                          className="
                                flex
                                h-8
                                w-8
                                items-center
                                justify-center
                                rounded-full
                                bg-black/60
                                text-xs
                                text-white
                              "
                        >
                          ▶
                        </span>
                      </span>
                    </>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Shared links */}
        <div
          className="
            flex
            min-w-0
            flex-col
            gap-4
            pb-3
          "
        >
          <div
            className="
              flex
              min-w-0
              items-center
              justify-between
              gap-3
            "
          >
            <h2
              className="
                truncate
                text-sm
                font-black
                text-slate-900
                dark:text-white
              "
            >
              Shared Links
            </h2>

            {links.length > 4 ? (
              <button
                type="button"
                className="
                  shrink-0
                  text-xs
                  font-black
                  text-elitePurple
                  transition-opacity
                  hover:opacity-70
                "
              >
                See all
              </button>
            ) : null}
          </div>

          {links.length === 0 ? (
            <div
              className="
                flex
                min-h-20
                items-center
                justify-center
                rounded-2xl
                bg-slate-50
                px-3
                dark:bg-slate-900/60
              "
            >
              <p
                className="
                  text-center
                  text-xs
                  text-slate-500
                  dark:text-slate-400
                "
              >
                No shared links
              </p>
            </div>
          ) : (
            <div
              className="
                flex
                w-full
                min-w-0
                flex-col
                gap-3
              "
            >
              {links.slice(0, 4).map((link, index) => (
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={link.url}
                  key={`${link.url}-${index}`}
                  className="
                        flex
                        min-h-14
                        w-full
                        min-w-0
                        items-center
                        overflow-hidden
                        rounded-2xl
                        bg-slate-100
                        px-4
                        py-3
                        transition-colors
                        hover:bg-elitePurple
                        hover:text-white
                        dark:bg-slate-900
                      "
                >
                  <div
                    className="
                          min-w-0
                          flex-1
                        "
                  >
                    <h3
                      className="
                            truncate
                            text-sm
                            font-bold
                          "
                    >
                      {link.name}
                    </h3>

                    <p
                      className="
                            mt-1
                            truncate
                            text-xs
                            opacity-70
                          "
                    >
                      {new URL(link.url).host}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* All media modal */}
      {showAllMedia ? (
        <div
          role="presentation"
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            overflow-hidden
            bg-black/60
            p-3
            backdrop-blur-sm
            sm:p-5
          "
          onClick={() => setShowAllMedia(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Shared media"
            className="
              flex
              max-h-[90dvh]
              w-full
              min-w-0
              max-w-4xl
              flex-col
              overflow-hidden
              rounded-2xl
              bg-white
              shadow-2xl
              dark:bg-customBlack
              sm:rounded-3xl
            "
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="
                flex
                shrink-0
                items-center
                justify-between
                gap-3
                border-b
                border-slate-200
                px-4
                py-4
                dark:border-slate-800
                sm:px-6
              "
            >
              <div className="min-w-0">
                <h2
                  className="
                    truncate
                    text-base
                    font-black
                    sm:text-lg
                  "
                >
                  Shared Media
                </h2>

                <p
                  className="
                    mt-1
                    text-xs
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  {media.length} {media.length === 1 ? "item" : "items"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAllMedia(false)}
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-slate-100
                  transition-colors
                  hover:bg-slate-200
                  dark:bg-slate-900
                  dark:hover:bg-slate-800
                "
                aria-label="Close shared media"
              >
                <X size={20} />
              </button>
            </div>

            <div
              className="
                min-h-0
                flex-1
                overflow-y-auto
                overscroll-contain
                p-3
                sm:p-5
                md:p-6
              "
            >
              <div
                className="
                  grid
                  grid-cols-2
                  gap-2
                  sm:grid-cols-3
                  sm:gap-4
                  md:grid-cols-4
                "
              >
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
                    className="
                        relative
                        aspect-square
                        min-w-0
                        overflow-hidden
                        rounded-xl
                        bg-slate-100
                        dark:bg-slate-900
                        sm:rounded-2xl
                      "
                  >
                    {item.type === AttachmentType.IMAGE && (
                      <Image
                        src={item.url}
                        alt="Shared media"
                        fill
                        sizes="
                            (max-width: 640px) 50vw,
                            (max-width: 768px) 33vw,
                            220px
                          "
                        className="
                            object-cover
                            transition-transform
                            duration-200
                            hover:scale-105
                          "
                      />
                    )}

                    {item.type === AttachmentType.VIDEO && (
                      <>
                        <video
                          src={item.url}
                          muted
                          preload="metadata"
                          className="
                              h-full
                              w-full
                              object-cover
                            "
                        />

                        <span
                          className="
                              pointer-events-none
                              absolute
                              inset-0
                              flex
                              items-center
                              justify-center
                              bg-black/15
                            "
                        >
                          <span
                            className="
                                flex
                                h-9
                                w-9
                                items-center
                                justify-center
                                rounded-full
                                bg-black/60
                                text-white
                              "
                          >
                            ▶
                          </span>
                        </span>
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Fullscreen media preview */}
      {selectedMedia ? (
        <div
          role="presentation"
          className="
            fixed
            inset-0
            z-[60]
            flex
            items-center
            justify-center
            overflow-hidden
            bg-black/95
            p-2
            sm:p-4
          "
          onClick={() => setSelectedMedia(null)}
        >
          <button
            type="button"
            onClick={() => setSelectedMedia(null)}
            className="
              absolute
              right-3
              top-3
              z-10
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              bg-white/10
              text-white
              backdrop-blur-sm
              transition-colors
              hover:bg-white/20
              sm:right-5
              sm:top-5
              sm:h-11
              sm:w-11
            "
            aria-label="Close media preview"
          >
            <X size={24} />
          </button>

          <div
            className="
              relative
              flex
              h-full
              max-h-[92dvh]
              w-full
              min-w-0
              max-w-6xl
              items-center
              justify-center
              overflow-hidden
            "
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
                className="
                  max-h-full
                  max-w-full
                  object-contain
                "
              />
            )}
          </div>
        </div>
      ) : null}
    </>
  );
};

export default ChatroomProfile;

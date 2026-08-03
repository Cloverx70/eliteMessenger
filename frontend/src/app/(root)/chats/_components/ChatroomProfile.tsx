"use client";

import { ChatroomProfileLinks } from "@/app/constants";
import {
  useQuery,
} from "@tanstack/react-query";
import {
  Play,
  UsersRound,
  X,
} from "lucide-react";
import Image from "next/image";
import {
  useParams,
  usePathname,
} from "next/navigation";
import {
  useEffect,
  useState,
} from "react";

import {
  AttachmentType,
  GetChatroomInfo,
} from "../action";

type SelectedMedia = {
  url: string;
  type: AttachmentType;
};

const ChatroomProfile = () => {
  const { cid } = useParams();
  const path = usePathname();

  const safeCid: string =
    Array.isArray(cid)
      ? cid[0]
      : (cid ?? "");

  const [
    showAllMedia,
    setShowAllMedia,
  ] = useState(false);

  const [
    selectedMedia,
    setSelectedMedia,
  ] =
    useState<SelectedMedia | null>(
      null,
    );

  const {
    data: ChatroomInfo,
  } = useQuery({
    queryKey: [
      "CHATROOMINFO",
      safeCid,
    ],
    queryFn: () =>
      GetChatroomInfo(safeCid),
    enabled: Boolean(safeCid),
  });

  useEffect(() => {
    const shouldLockScroll =
      showAllMedia ||
      Boolean(selectedMedia);

    if (shouldLockScroll) {
      document.body.style.overflow =
        "hidden";
    }

    return () => {
      document.body.style.overflow =
        "";
    };
  }, [
    showAllMedia,
    selectedMedia,
  ]);

  useEffect(() => {
    const handleEscape = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key !== "Escape"
      ) {
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

    window.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [
    showAllMedia,
    selectedMedia,
  ]);

  if (
    path !== `/chats/${safeCid}`
  ) {
    return null;
  }

  const media =
    ChatroomInfo?.media ?? [];
  const links =
    ChatroomInfo?.links ?? [];

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
          gap-7
          overflow-y-auto
          overflow-x-hidden
          overscroll-contain
          px-4
          py-6
          dark:text-white
          sm:px-6
          xl:px-7
        "
      >
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative shrink-0">
            <div
              className={`
                absolute
                bottom-1
                right-1
                z-10
                h-4
                w-4
                rounded-full
                border-2
                border-white
                dark:border-customBlack
                ${
                  ChatroomInfo?.chatroom
                    .recIsActive
                    ? "bg-emerald-500"
                    : "bg-slate-500"
                }
              `}
            />

            <div className="relative h-[70px] w-[70px]">
              {ChatroomInfo?.chatroom
                .recUserPfpUrl ? (
                <Image
                  src={
                    ChatroomInfo
                      .chatroom
                      .recUserPfpUrl
                  }
                  alt={`${ChatroomInfo?.chatroom.recUsername} avatar`}
                  fill
                  sizes="70px"
                  className="rounded-full object-cover"
                />
              ) : (
                <div
                  className="
                    flex
                    h-[70px]
                    w-[70px]
                    items-center
                    justify-center
                    rounded-full
                    bg-elitePurple/10
                    text-elitePurple
                  "
                >
                  <UsersRound
                    size={30}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-black text-slate-900 dark:text-white">
              {
                ChatroomInfo?.chatroom
                  .recUsername
              }
            </h1>

            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {ChatroomInfo?.chatroom
                .recIsActive
                ? "Online"
                : "Offline"}
            </p>
          </div>
        </div>

        <div
          className="
            grid
            grid-cols-3
            gap-2
            border-b
            border-slate-200
            pb-6
            dark:border-slate-800
          "
        >
          {ChatroomProfileLinks.map(
            (link) => (
              <button
                type="button"
                className="
                  flex
                  min-w-0
                  flex-col
                  items-center
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
                key={link.label}
              >
                <span
                  className="
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-full
                    bg-[#f5f6f7]
                    transition
                    hover:scale-95
                    dark:bg-slate-900
                  "
                >
                  <link.icon
                    size={21}
                  />
                </span>

                <span className="max-w-full truncate text-[11px] font-semibold">
                  {link.label}
                </span>
              </button>
            ),
          )}
        </div>

        <div
          className="
            border-b
            border-slate-200
            pb-6
            dark:border-slate-800
          "
        >
          <h2 className="font-black text-slate-900 dark:text-white">
            About
          </h2>

          <p className="mt-3 break-words text-sm leading-6 text-slate-600 dark:text-slate-400">
            {ChatroomInfo?.chatroom
              .recBio ||
              "No bio available."}
          </p>
        </div>

        <div
          className="
            border-b
            border-slate-200
            pb-6
            dark:border-slate-800
          "
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-black text-slate-900 dark:text-white">
              Media
            </h2>

            {media.length > 0 ? (
              <button
                type="button"
                onClick={() =>
                  setShowAllMedia(true)
                }
                className="text-xs font-black text-elitePurple"
              >
                See all
              </button>
            ) : null}
          </div>

          {media.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">
              No shared media...
            </p>
          ) : (
            <div
              className="
                mt-4
                grid
                grid-cols-2
                gap-2
              "
            >
              {media
                .slice(0, 4)
                .map(
                  (
                    item,
                    index,
                  ) => (
                    <button
                      key={`${item.url}-${index}`}
                      type="button"
                      onClick={() =>
                        setSelectedMedia(
                          {
                            url: item.url,
                            type: item.type,
                          },
                        )
                      }
                      className="
                        relative
                        aspect-square
                        min-w-0
                        overflow-hidden
                        rounded-2xl
                        bg-slate-100
                        dark:bg-slate-900
                      "
                    >
                      {item.type ===
                      AttachmentType.IMAGE ? (
                        <Image
                          alt="Shared media"
                          src={item.url}
                          fill
                          sizes="150px"
                          className="object-cover transition hover:scale-105"
                        />
                      ) : null}

                      {item.type ===
                      AttachmentType.VIDEO ? (
                        <>
                          <video
                            src={item.url}
                            muted
                            preload="metadata"
                            className="h-full w-full object-cover"
                          />

                          <span className="absolute inset-0 flex items-center justify-center bg-black/15">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white">
                              <Play
                                size={15}
                                fill="currentColor"
                              />
                            </span>
                          </span>
                        </>
                      ) : null}
                    </button>
                  ),
                )}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-black text-slate-900 dark:text-white">
              Shared links
            </h2>
          </div>

          <div className="mt-4 space-y-3">
            {links.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500">
                No shared links...
              </p>
            ) : (
              links
                .slice(0, 4)
                .map(
                  (
                    link,
                    index,
                  ) => (
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href={link.url}
                      key={`${link.url}-${index}`}
                      className="
                        flex
                        min-h-16
                        min-w-0
                        items-center
                        rounded-2xl
                        bg-slate-100
                        px-4
                        transition
                        hover:bg-elitePurple
                        hover:text-white
                        dark:bg-slate-900
                      "
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-black">
                          {
                            link.name
                          }
                        </span>

                        <span className="mt-1 block truncate text-xs opacity-70">
                          {new URL(
                            link.url,
                          ).host}
                        </span>
                      </span>
                    </a>
                  ),
                )
            )}
          </div>
        </div>
      </section>

      {showAllMedia ? (
        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-end
            justify-center
            bg-black/60
            p-0
            backdrop-blur-sm
            sm:items-center
            sm:p-4
          "
          onClick={() =>
            setShowAllMedia(false)
          }
        >
          <div
            className="
              flex
              max-h-[92dvh]
              w-full
              flex-col
              overflow-hidden
              rounded-t-3xl
              bg-white
              shadow-2xl
              dark:bg-slate-950
              sm:max-h-[85dvh]
              sm:max-w-4xl
              sm:rounded-3xl
            "
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <header
              className="
                flex
                shrink-0
                items-center
                justify-between
                border-b
                border-slate-200
                px-4
                py-4
                dark:border-slate-800
                sm:px-6
              "
            >
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  Shared media
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {media.length}{" "}
                  {media.length === 1
                    ? "item"
                    : "items"}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowAllMedia(
                    false,
                  )
                }
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-full
                  bg-slate-100
                  text-slate-700
                  dark:bg-slate-900
                  dark:text-white
                "
                aria-label="Close shared media"
              >
                <X size={20} />
              </button>
            </header>

            <div
              className="
                min-h-0
                flex-1
                overflow-y-auto
                p-4
                pb-[max(1rem,env(safe-area-inset-bottom))]
                sm:p-6
              "
            >
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {media.map(
                  (
                    item,
                    index,
                  ) => (
                    <button
                      key={`${item.url}-${index}`}
                      type="button"
                      onClick={() =>
                        setSelectedMedia(
                          {
                            url: item.url,
                            type: item.type,
                          },
                        )
                      }
                      className="
                        relative
                        aspect-square
                        overflow-hidden
                        rounded-2xl
                        bg-slate-100
                        dark:bg-slate-900
                      "
                    >
                      {item.type ===
                      AttachmentType.IMAGE ? (
                        <Image
                          src={item.url}
                          alt="Shared media"
                          fill
                          sizes="(max-width: 640px) 50vw, 200px"
                          className="object-cover transition hover:scale-105"
                        />
                      ) : null}

                      {item.type ===
                      AttachmentType.VIDEO ? (
                        <>
                          <video
                            src={item.url}
                            muted
                            preload="metadata"
                            className="h-full w-full object-cover"
                          />

                          <span className="absolute inset-0 flex items-center justify-center bg-black/15">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white">
                              <Play
                                size={16}
                                fill="currentColor"
                              />
                            </span>
                          </span>
                        </>
                      ) : null}
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {selectedMedia ? (
        <div
          className="
            fixed
            inset-0
            z-[60]
            flex
            items-center
            justify-center
            bg-black/95
            p-3
            pt-[max(0.75rem,env(safe-area-inset-top))]
            pb-[max(0.75rem,env(safe-area-inset-bottom))]
          "
          onClick={() =>
            setSelectedMedia(null)
          }
        >
          <button
            type="button"
            onClick={() =>
              setSelectedMedia(null)
            }
            className="
              absolute
              right-3
              top-[max(0.75rem,env(safe-area-inset-top))]
              z-10
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-full
              bg-white/10
              text-white
              backdrop-blur-sm
              transition
              hover:bg-white/20
              sm:right-5
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
              max-w-6xl
              items-center
              justify-center
            "
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {selectedMedia.type ===
            AttachmentType.IMAGE ? (
              <Image
                src={
                  selectedMedia.url
                }
                alt="Fullscreen shared media"
                fill
                priority
                sizes="100vw"
                className="object-contain"
              />
            ) : null}

            {selectedMedia.type ===
            AttachmentType.VIDEO ? (
              <video
                src={
                  selectedMedia.url
                }
                controls
                autoPlay
                className="max-h-full max-w-full object-contain"
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
};

export default ChatroomProfile;

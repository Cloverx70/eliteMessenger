"use client";

import {
  useEffect,
  useState,
} from "react";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import ChatroomProfile from "./ChatroomProfile";
import ChatroomsList from "./ChatroomsList";

interface ChatsResponsiveShellProps {
  children: ReactNode;
}

export default function ChatsResponsiveShell({
  children,
}: ChatsResponsiveShellProps) {
  const pathname = usePathname();

  const [
    mobileProfileOpen,
    setMobileProfileOpen,
  ] = useState(false);

  const hasOpenChat =
    pathname !== "/chats" &&
    pathname.startsWith("/chats/");

  useEffect(() => {
    setMobileProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const openProfile = () => {
      setMobileProfileOpen(true);
    };

    window.addEventListener(
      "open-chat-profile",
      openProfile,
    );

    return () => {
      window.removeEventListener(
        "open-chat-profile",
        openProfile,
      );
    };
  }, []);

  return (
    <>
      <div
        className="
          grid
          h-full
          min-h-0
          w-full
          min-w-0
          grid-cols-1
          overflow-hidden
          bg-white
          dark:bg-customBlack
          md:grid-cols-[300px_minmax(0,1fr)]
          xl:grid-cols-[320px_minmax(0,1fr)_320px]
        "
      >
        <aside
          className={`
            min-h-0
            min-w-0
            overflow-hidden
            border-r
            border-slate-200
            bg-white
            dark:border-slate-800
            dark:bg-customBlack
            ${hasOpenChat ? "hidden md:block" : "block"}
          `}
        >
          <ChatroomsList />
        </aside>

        <main
          className={`
            min-h-0
            min-w-0
            overflow-hidden
            bg-white
            dark:bg-customBlack
            ${hasOpenChat ? "block" : "hidden md:block"}
          `}
        >
          {children}
        </main>

        <aside
          className="
            hidden
            min-h-0
            min-w-0
            overflow-hidden
            border-l
            border-slate-200
            bg-white
            dark:border-slate-800
            dark:bg-customBlack
            xl:block
          "
        >
          <ChatroomProfile />
        </aside>
      </div>

      {hasOpenChat && mobileProfileOpen ? (
        <div className="fixed inset-0 z-[70] xl:hidden">
          <button
            type="button"
            aria-label="Close conversation details"
            onClick={() =>
              setMobileProfileOpen(false)
            }
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
          />

          <aside
            className="
              absolute
              inset-y-0
              right-0
              w-[min(88vw,380px)]
              overflow-hidden
              bg-white
              shadow-2xl
              dark:bg-customBlack
            "
          >
            <button
              type="button"
              aria-label="Close conversation details"
              onClick={() =>
                setMobileProfileOpen(false)
              }
              className="
                absolute
                right-3
                top-[max(0.75rem,env(safe-area-inset-top))]
                z-20
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-full
                bg-white/90
                text-slate-700
                shadow-lg
                backdrop-blur
                dark:bg-slate-900/90
                dark:text-white
              "
            >
              <X size={20} />
            </button>

            <ChatroomProfile />
          </aside>
        </div>
      ) : null}
    </>
  );
}

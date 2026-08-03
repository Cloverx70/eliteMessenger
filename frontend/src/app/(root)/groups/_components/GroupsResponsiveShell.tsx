"use client";

import {
  useEffect,
  useState,
} from "react";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import GroupChatProfile from "./GroupChatProfile";
import GroupChatsList from "./GroupChatList";

interface GroupsResponsiveShellProps {
  children: ReactNode;
}

export default function GroupsResponsiveShell({
  children,
}: GroupsResponsiveShellProps) {
  const pathname = usePathname();

  const [
    mobileProfileOpen,
    setMobileProfileOpen,
  ] = useState(false);

  const hasOpenGroup =
    pathname !== "/groups" &&
    pathname.startsWith("/groups/");

  useEffect(() => {
    setMobileProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const openProfile = () => {
      setMobileProfileOpen(true);
    };

    window.addEventListener(
      "open-group-profile",
      openProfile,
    );

    return () => {
      window.removeEventListener(
        "open-group-profile",
        openProfile,
      );
    };
  }, []);

  useEffect(() => {
    if (!mobileProfileOpen) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [mobileProfileOpen]);

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
          xl:grid-cols-[320px_minmax(0,1fr)_340px]
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
            ${hasOpenGroup ? "hidden md:block" : "block"}
          `}
        >
          <GroupChatsList />
        </aside>

        <main
          className={`
            min-h-0
            min-w-0
            overflow-hidden
            bg-white
            dark:bg-customBlack
            ${hasOpenGroup ? "block" : "hidden md:block"}
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
          <GroupChatProfile />
        </aside>
      </div>

      {hasOpenGroup &&
      mobileProfileOpen ? (
        <div className="fixed inset-0 z-[70] xl:hidden">
          <button
            type="button"
            aria-label="Close group details"
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
              w-[min(92vw,420px)]
              overflow-hidden
              bg-white
              shadow-2xl
              dark:bg-customBlack
            "
          >
            <button
              type="button"
              aria-label="Close group details"
              onClick={() =>
                setMobileProfileOpen(false)
              }
              className="
                absolute
                right-3
                top-[max(0.75rem,env(safe-area-inset-top))]
                z-30
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

            <GroupChatProfile />
          </aside>
        </div>
      ) : null}
    </>
  );
}

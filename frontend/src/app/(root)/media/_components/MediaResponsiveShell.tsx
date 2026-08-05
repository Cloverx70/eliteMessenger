"use client";

import type { ReactNode } from "react";
import {
  ImageIcon,
  Search,
} from "lucide-react";
import { usePathname } from "next/navigation";

import MediaMap from "./MediaMap";

interface MediaResponsiveShellProps {
  children: ReactNode;
}

export default function MediaResponsiveShell({
  children,
}: MediaResponsiveShellProps) {
  const pathname = usePathname();

  const hasSelectedMedia =
    pathname !== "/media" &&
    pathname.startsWith("/media/");

  return (
    <div
      className="
        grid
        h-full
        min-h-0
        w-full
        min-w-0
        grid-cols-1
        overflow-hidden
        bg-slate-50
        dark:bg-customBlack
        xl:grid-cols-[minmax(0,1fr)_390px]
      "
    >
      <section
        className={`
          min-h-0
          min-w-0
          overflow-hidden
          bg-slate-50
          dark:bg-customBlack
          xl:block
          ${
            hasSelectedMedia
              ? "hidden"
              : "block"
          }
        `}
      >
        <div
          className="
            flex
            h-full
            min-h-0
            min-w-0
            flex-col
            overflow-hidden
          "
        >
          <header
            className="
              flex
              shrink-0
              items-center
              justify-between
              gap-3
              border-b
              border-slate-200
              bg-white/90
              px-4
              py-4
              backdrop-blur-xl
              dark:border-slate-800
              dark:bg-customBlack/90
              sm:px-6
              lg:px-8
            "
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  bg-elitePurple/10
                  text-elitePurple
                "
              >
                <ImageIcon size={21} />
              </span>

              <div className="min-w-0">
                <h1 className="truncate text-xl font-black text-slate-900 dark:text-white">
                  Media
                </h1>

                <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                  Photos, videos, files and links shared in your conversations
                </p>
              </div>
            </div>

            <span
              className="
                hidden
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-full
                border
                border-slate-200
                bg-white
                text-slate-500
                dark:border-slate-800
                dark:bg-slate-950
                sm:flex
              "
              aria-hidden="true"
            >
              <Search size={18} />
            </span>
          </header>

          <div
            className="
              min-h-0
              flex-1
              overflow-y-auto
              overflow-x-hidden
              overscroll-contain
              px-3
              py-4
              pb-[max(1rem,env(safe-area-inset-bottom))]
              sm:px-5
              lg:px-7
            "
          >
            <MediaMap />
          </div>
        </div>
      </section>

      <main
        className={`
          min-h-0
          min-w-0
          overflow-hidden
          border-l
          border-slate-200
          bg-white
          dark:border-slate-800
          dark:bg-customBlack
          xl:block
          ${
            hasSelectedMedia
              ? "block"
              : "hidden"
          }
        `}
      >
        {children}
      </main>
    </div>
  );
}

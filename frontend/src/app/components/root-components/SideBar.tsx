"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { IoPersonCircle, IoPersonCircleOutline } from "react-icons/io5";
import { Menu, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import type { IUser } from "@/app/auth/actions";
import Image from "next/image";
import { Links } from "@/app/constants";
import Logo from "../../../../public/EliteMessengerLogo.png";
import { TbLogout2 } from "react-icons/tb";
import { logout } from "@/app/auth/actions";
import toaster from "../toaster";
import { useChatStore } from "@/app/stores/ChatStore";
import { useMutation } from "@tanstack/react-query";

interface ISidebarProps {
  user: IUser;
}

const SideBar = ({ user }: ISidebarProps) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const unreadCounts = useChatStore((state) => state.unreadCounts);

  const router = useRouter();
  const path = usePathname();

  const totalUnread = Object.values(unreadCounts).reduce(
    (total, count) => total + count,
    0,
  );

  const isProfileActive = path.startsWith("/profile");

  const { mutate: LogoutMutation, isPending: isLoggingOut } = useMutation({
    mutationFn: logout,
    mutationKey: ["LOGOUT"],

    onSuccess: () => {
      setIsMobileOpen(false);

      router.replace("/auth/login");

      router.refresh();

      toaster("Success", "Logged out successfully.");
    },

    onError: (error: unknown) => {
      toaster(
        "Error",
        error instanceof Error ? error.message : "Could not log out.",
      );
    },
  });

  useEffect(() => {
    setIsMobileOpen(false);
  }, [path]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const navigateTo = (href: string) => {
    setIsMobileOpen(false);
    router.push(href);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        aria-label="Open navigation menu"
        aria-expanded={isMobileOpen}
        aria-controls="elite-sidebar"
        onClick={() => setIsMobileOpen(true)}
        className={`
          fixed
          left-3
          top-3
          z-[55]
          flex
          h-11
          w-11
          items-center
          justify-center
          rounded-2xl
          border
          border-white/70
          bg-white/90
          text-elitePurple
          shadow-lg
          shadow-black/10
          backdrop-blur-xl
          transition
          hover:scale-95
          dark:border-white/10
          dark:bg-customBlack/90
          md:hidden
          ${isMobileOpen ? "pointer-events-none opacity-0" : "opacity-100"}
        `}
      >
        <Menu size={22} />
      </button>

      {/* Mobile backdrop */}
      {isMobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setIsMobileOpen(false)}
          className="
            fixed
            inset-0
            z-[60]
            bg-black/55
            backdrop-blur-[2px]
            md:hidden
          "
        />
      ) : null}

      <section
        id="elite-sidebar"
        className={`
          sidebar
          fixed
          inset-y-0
          left-0
          z-[70]
          flex
          h-dvh
          w-[270px]
          min-w-0
          flex-col
          overflow-x-hidden
          overflow-y-auto
          rounded-r-[30px]
          shadow-2xl
          transition-transform
          duration-300
          ease-out

          md:static
          md:z-auto
          md:h-full
          md:w-20
          md:shrink-0
          md:translate-x-0
          md:overflow-hidden
          md:rounded-r-3xl
          md:shadow-none

          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Mobile close button */}
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setIsMobileOpen(false)}
          className="
            absolute
            right-4
            top-4
            z-10
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-full
            bg-white/15
            text-white
            backdrop-blur-lg
            transition
            hover:bg-white/25
            md:hidden
          "
        >
          <X size={21} />
        </button>

        {/* Logo */}
        <button
          type="button"
          aria-label="Go to home"
          onClick={() => navigateTo("/")}
          className="
            flex
            min-h-24
            w-full
            shrink-0
            items-center
            gap-3
            px-5
            text-left
            text-white
            md:h-20
            md:min-h-20
            md:justify-center
            md:px-0
          "
        >
          <Image
            src={Logo}
            alt="Elite Messenger"
            width={70}
            height={70}
            priority
            className="
              h-14
              w-14
              shrink-0
              object-contain
              py-1
              transition-transform
              duration-150
              hover:scale-95
              md:h-[70px]
              md:w-[70px]
              md:py-2
            "
          />

          <span className="min-w-0 md:hidden">
            <span
              className="
                block
                truncate
                text-sm
                font-black
              "
            >
              Elite Messenger
            </span>

            <span
              className="
                mt-1
                block
                truncate
                text-[10px]
                font-semibold
                text-white/60
              "
            >
              Connect without limits
            </span>
          </span>
        </button>

        <TooltipProvider delayDuration={100}>
          {/* Navigation */}
          <nav
            className="
              flex
              min-h-0
              w-full
              flex-1
              flex-col
              justify-center
              gap-1
              px-3
              py-4
              md:items-center
              md:px-0
              md:py-0
            "
          >
            {Links.map((link) => {
              const isHomeLink = link.href === "/";

              const isActive = isHomeLink
                ? path === "/"
                : path.startsWith(link.href);

              return (
                <Tooltip key={link.href}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={link.label}
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => navigateTo(link.href)}
                      className={`
                        relative
                        flex
                        min-h-12
                        w-full
                        min-w-0
                        items-center
                        justify-start
                        gap-4
                        rounded-2xl
                        px-4
                        py-2
                        text-left
                        text-white
                        transition-all
                        duration-150

                        md:my-1
                        md:min-h-0
                        md:justify-center
                        md:gap-0
                        md:rounded-none
                        md:px-2

                        ${
                          isActive
                            ? `
                              bg-white/15
                              shadow-inner
                              md:rounded-l-full
                              md:bg-gray-50
                              md:shadow-none
                              md:dark:bg-customBlack
                            `
                            : `
                              bg-transparent
                              hover:bg-white/10
                              md:hover:bg-transparent
                            `
                        }
                      `}
                    >
                      {isActive ? (
                        <link.filledIcon
                          size={25}
                          className="
                            shrink-0
                            text-white
                            transition-transform
                            md:text-[#6D28D9]
                          "
                        />
                      ) : (
                        <link.icon
                          size={25}
                          className="
                            shrink-0
                            text-white
                            transition-transform
                            hover:scale-95
                          "
                        />
                      )}

                      <span
                        className="
                          min-w-0
                          flex-1
                          truncate
                          text-sm
                          font-bold
                          md:hidden
                        "
                      >
                        {link.label}
                      </span>

                      {link.label === "Chats" && totalUnread > 0 ? (
                        <span
                          className="
                            flex
                            h-5
                            min-w-5
                            shrink-0
                            items-center
                            justify-center
                            rounded-full
                            bg-red-500
                            px-1.5
                            text-[10px]
                            font-black
                            text-white

                            md:absolute
                            md:right-2
                            md:top-1
                          "
                        >
                          {totalUnread > 99 ? "99+" : totalUnread}
                        </span>
                      ) : null}
                    </button>
                  </TooltipTrigger>

                  <TooltipContent
                    side="right"
                    sideOffset={6}
                    className="
                      hidden
                      rounded-md
                      border
                      border-slate-200
                      bg-white
                      px-3
                      py-1.5
                      text-black
                      shadow-lg
                      md:block
                    "
                  >
                    <p>{link.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </nav>

          {/* Profile and logout */}
          <div
            className="
              flex
              w-full
              shrink-0
              flex-col
              gap-2
              border-t
              border-white/10
              px-3
              pb-[max(1rem,env(safe-area-inset-bottom))]
              pt-4
              md:items-center
              md:border-none
              md:px-0
              md:pb-4
              md:pt-0
            "
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Open profile"
                  onClick={() => navigateTo("/profile")}
                  className={`
                    flex
                    min-h-12
                    w-full
                    min-w-0
                    items-center
                    gap-4
                    rounded-2xl
                    px-4
                    py-2
                    text-white
                    transition
                    hover:bg-white/10

                    md:h-11
                    md:min-h-11
                    md:w-11
                    md:justify-center
                    md:gap-0
                    md:rounded-full
                    md:px-0
                    md:py-0
                    md:hover:scale-95

                    ${isProfileActive ? "bg-white/15 md:bg-transparent" : ""}
                  `}
                >
                  {user?.userPfpUrl ? (
                    <span
                      className={`
                        relative
                        h-9
                        w-9
                        shrink-0
                        overflow-hidden
                        rounded-full
                        border-2
                        ${
                          isProfileActive
                            ? "border-white ring-2 ring-violet-300"
                            : "border-white/70"
                        }
                      `}
                    >
                      <Image
                        src={user.userPfpUrl}
                        alt={
                          user.username
                            ? `${user.username}'s profile picture`
                            : "Profile picture"
                        }
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    </span>
                  ) : isProfileActive ? (
                    <IoPersonCircle size={32} className="shrink-0" />
                  ) : (
                    <IoPersonCircleOutline size={32} className="shrink-0" />
                  )}

                  <span
                    className="
                      min-w-0
                      flex-1
                      text-left
                      md:hidden
                    "
                  >
                    <span
                      className="
                        block
                        truncate
                        text-sm
                        font-black
                      "
                    >
                      Profile
                    </span>

                    <span
                      className="
                        mt-0.5
                        block
                        truncate
                        text-[10px]
                        font-semibold
                        text-white/60
                      "
                    >
                      {user?.username
                        ? `@${user.username}`
                        : "View your profile"}
                    </span>
                  </span>
                </button>
              </TooltipTrigger>

              <TooltipContent
                side="right"
                sideOffset={8}
                className="
                  hidden
                  rounded-md
                  border
                  border-slate-200
                  bg-white
                  px-3
                  py-1.5
                  text-black
                  shadow-lg
                  md:block
                "
              >
                <p>{user?.username ? `@${user.username}` : "Profile"}</p>
              </TooltipContent>
            </Tooltip>

            <Dialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      aria-label="Log out"
                      className="
                        flex
                        min-h-12
                        w-full
                        min-w-0
                        items-center
                        gap-4
                        rounded-2xl
                        px-4
                        py-2
                        text-white
                        transition
                        hover:bg-red-500/15
                        hover:text-red-200

                        md:h-11
                        md:min-h-11
                        md:w-11
                        md:justify-center
                        md:gap-0
                        md:rounded-full
                        md:px-0
                        md:py-0
                        md:hover:scale-95
                      "
                    >
                      <TbLogout2 size={25} className="shrink-0" />

                      <span
                        className="
                          min-w-0
                          flex-1
                          truncate
                          text-left
                          text-sm
                          font-bold
                          md:hidden
                        "
                      >
                        Logout
                      </span>
                    </button>
                  </DialogTrigger>
                </TooltipTrigger>

                <TooltipContent
                  side="right"
                  sideOffset={8}
                  className="
                    hidden
                    rounded-md
                    border
                    border-slate-200
                    bg-white
                    px-3
                    py-1.5
                    text-black
                    shadow-lg
                    md:block
                  "
                >
                  <p>Logout</p>
                </TooltipContent>
              </Tooltip>

              <DialogContent
                className="
                  w-[calc(100%-2rem)]
                  max-w-md
                  gap-8
                  rounded-3xl
                  border-slate-200
                  bg-white
                  dark:border-slate-800
                  dark:bg-customBlack
                "
              >
                <DialogHeader>
                  <DialogTitle
                    className="
                      text-2xl
                      font-black
                      text-slate-950
                      dark:text-white
                    "
                  >
                    Log out of Elite Messenger?
                  </DialogTitle>

                  <DialogDescription
                    className="
                      text-sm
                      leading-6
                      text-slate-500
                      dark:text-slate-400
                    "
                  >
                    You’ll be signed out and returned to the login page. You can
                    log back in anytime.
                  </DialogDescription>
                </DialogHeader>

                <Button
                  type="button"
                  disabled={isLoggingOut}
                  onClick={() => LogoutMutation()}
                  className="
                    min-h-12
                    rounded-2xl
                    bg-elitePurple
                    font-black
                    hover:bg-elitePurpleHover
                  "
                >
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </Button>
              </DialogContent>
            </Dialog>
          </div>
        </TooltipProvider>
      </section>
    </>
  );
};

export default SideBar;

"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { IUser, logout } from "@/app/auth/actions";
import { IoPersonCircle, IoPersonCircleOutline } from "react-icons/io5";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Links } from "@/app/constants";
import Logo from "./../../../../public/EliteMessengerLogo.png";
import { TbLogout2 } from "react-icons/tb";
import toaster from "../toaster";
import { useChatStore } from "@/app/stores/ChatStore";
import { useMutation } from "@tanstack/react-query";

interface ISidebarProps {
  user: IUser;
}

const SideBar = ({ user }: ISidebarProps) => {
  const unreadCounts = useChatStore((state) => state.unreadCounts);

  const router = useRouter();
  const path = usePathname();

  const totalUnread = Object.values(unreadCounts).reduce(
    (total, count) => total + count,
    0,
  );

  const isProfileActive = path.startsWith("/profile");

  const { mutate: LogoutMutation } = useMutation({
    mutationFn: logout,
    mutationKey: ["LOGOUT"],
    onSuccess: () => {
      router.push("/auth/login");
      toaster("Success", "Logged out successfully..");
    },

    onError: (e) => {
      toaster("Error", e.message);
    },
  });

  return (
    <section
      className="
        sidebar
        flex
        h-full
        w-20
        shrink-0
        flex-col
        items-center
        justify-between
        rounded-r-3xl
      "
    >
      {/* Logo */}
      <button
        type="button"
        aria-label="Go to home"
        onClick={() => router.push("/")}
        className="
          flex
          h-20
          w-full
          items-center
          justify-center
        "
      >
        <Image
          src={Logo}
          alt="Elite Messenger"
          width={70}
          height={70}
          priority
          className="
            cursor-pointer
            py-2
            transition-transform
            duration-150
            hover:scale-95
          "
        />
      </button>

      <TooltipProvider>
        {/* Navigation links */}
        <div
          className="
            flex
            w-full
            flex-1
            flex-col
            items-center
            justify-center
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
                    onClick={() => router.push(link.href)}
                    className={`
                      relative
                      my-1
                      flex
                      w-full
                      items-center
                      justify-center
                      p-2
                      text-white
                      transition-all
                      duration-100
                      ${
                        isActive
                          ? "rounded-l-full bg-gray-50 dark:bg-customBlack"
                          : "bg-transparent"
                      }
                    `}
                  >
                    {isActive ? (
                      <link.filledIcon
                        color="#6D28D9"
                        size={25}
                        className="
                          cursor-pointer
                          transition-transform
                          duration-150
                        "
                      />
                    ) : (
                      <link.icon
                        size={25}
                        className="
                          cursor-pointer
                          transition-transform
                          duration-150
                          hover:scale-95
                        "
                      />
                    )}

                    {/* Chat unread badge */}
                    {link.label === "Chats" && totalUnread > 0 ? (
                      <span
                        className="
                          absolute
                          right-2
                          top-1
                          flex
                          h-5
                          min-w-5
                          items-center
                          justify-center
                          rounded-full
                          bg-red-500
                          px-1
                          text-[10px]
                          font-bold
                          text-white
                        "
                      >
                        {totalUnread > 99 ? "99+" : totalUnread}
                      </span>
                    ) : null}
                  </button>
                </TooltipTrigger>

                <TooltipContent
                  side="right"
                  sideOffset={4}
                  className="
                    rounded-md
                    border-black
                    bg-white
                    px-3
                    py-1
                    text-black
                    shadow-lg
                  "
                >
                  <p>{link.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Profile & Logout */}
        <div
          className="
    flex
    w-full
    shrink-0
    flex-col
    items-center
    justify-end
    gap-2
    pb-4
  "
        >
          {/* Profile tooltip */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="Open profile"
                onClick={() => router.push("/profile")}
                className="
          flex
          h-11
          w-11
          shrink-0
          items-center
          justify-center
          rounded-full
          text-white
          transition-transform
          duration-150
          hover:scale-95
        "
              >
                {user?.userPfpUrl ? (
                  <span
                    className={`
              relative
              h-9
              w-9
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
                  <IoPersonCircle
                    size={32}
                    className="
              cursor-pointer
              transition-transform
              duration-150
            "
                  />
                ) : (
                  <IoPersonCircleOutline
                    size={32}
                    className="
              cursor-pointer
              transition-transform
              duration-150
            "
                  />
                )}
              </button>
            </TooltipTrigger>

            <TooltipContent
              side="right"
              sideOffset={8}
              className="
        rounded-md
        border
        border-slate-200
        bg-white
        px-3
        py-1.5
        text-black
        shadow-lg
      "
            >
              <p>{user?.username ? `@${user.username}` : "Profile"}</p>
            </TooltipContent>
          </Tooltip>

          {/* Logout tooltip */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Dialog>
                <DialogTrigger
                  type="button"
                  aria-label="Log out"
                  className="
          flex
          h-11
          w-11
          shrink-0
          items-center
          justify-center
          rounded-full
          text-white
          transition-all
          duration-150
          hover:scale-95
          hover:bg-white/10
          hover:text-red-300
        "
                >
                  <TbLogout2 size={25} />
                </DialogTrigger>
                <DialogContent className=" gap-10">
                  <DialogHeader>
                    <DialogTitle className=" font-bold text-2xl">
                      Log out of Elite Messenger?
                    </DialogTitle>
                    <DialogDescription className=" text-xs">
                      You’ll be signed out of your account and returned to the
                      login page. You can log back in anytime.
                    </DialogDescription>
                  </DialogHeader>

                  <Button
                    onClick={() => LogoutMutation()}
                    className=" bg-elitePurple hover:bg-elitePurpleHover"
                  >
                    Logout
                  </Button>
                </DialogContent>
              </Dialog>
            </TooltipTrigger>

            <TooltipContent
              side="right"
              sideOffset={8}
              className="
        rounded-md
        border
        border-slate-200
        bg-white
        px-3
        py-1.5
        text-black
        shadow-lg
      "
            >
              <p>Logout</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </section>
  );
};

export default SideBar;

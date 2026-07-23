"use client";

import { IoPersonCircle, IoPersonCircleOutline } from "react-icons/io5";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePathname, useRouter } from "next/navigation";

import Image from "next/image";
import { Links } from "@/app/constants";
import Logo from "./../../../../public/EliteMessengerLogo.png";
import { useChatStore } from "@/app/stores/ChatStore";
import { useEffect } from "react";

const SideBar = () => {
  const unreadCounts = useChatStore((state) => state.unreadCounts);

  const router = useRouter();
  const path = usePathname();

  const totalUnread = Object.values(unreadCounts).reduce(
    (total, count) => total + count,
    0,
  );

  useEffect(() => {
    console.log(totalUnread);
  }, [totalUnread]);

  return (
    <section className="sidebar h-screen w-20 rounded-r-3xl flex flex-col items-center justify-between">
      <Image
        src={Logo}
        alt="icon"
        className="hover:scale-95 transition-all delay-100 cursor-pointer py-2"
        width={70}
        height={70}
        onClick={() => router.push("/")}
      />

      <TooltipProvider>
        <div className="w-full flex flex-col items-center justify-center flex-1">
          {Links.map((link, index) => {
            const isActive = path.startsWith(link.href);

            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => router.push(link.href)}
                    className={`relative my-1 text-white w-full p-2 flex items-center justify-center transition-all ease-linear duration-100 ${
                      isActive
                        ? "bg-gray-50 dark:bg-customBlack rounded-l-full"
                        : "bg-transparent"
                    }`}
                  >
                    {isActive ? (
                      <link.filledIcon
                        color="#6D28D9"
                        size={25}
                        className="transition-all delay-100 cursor-pointer"
                      />
                    ) : (
                      <link.icon
                        size={25}
                        className="hover:scale-95 transition-all delay-100 cursor-pointer"
                      />
                    )}

                    {/* Chat unread badge */}
                    {link.label === "Chats" && totalUnread > 0 && (
                      <span className="absolute top-1 right-2 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {totalUnread > 99 ? "99+" : totalUnread}
                      </span>
                    )}
                  </button>
                </TooltipTrigger>

                <TooltipContent
                  side="right"
                  sideOffset={4}
                  className="bg-white text-black border-black shadow-lg rounded-md px-3 py-1"
                >
                  <p>{link.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        <div className="w-full h-[100px] flex items-end justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => router.push("/profile")}
                className="my-4 text-white"
              >
                {path.startsWith("/profile") ? (
                  <IoPersonCircle
                    size={30}
                    className="transition-all delay-100 cursor-pointer"
                  />
                ) : (
                  <IoPersonCircleOutline
                    size={30}
                    className={
                      "hover:scale-95 transition-all delay-100 cursor-pointer"
                    }
                  />
                )}
              </button>
            </TooltipTrigger>

            <TooltipContent
              side="right"
              sideOffset={4}
              className="bg-white text-black border-black shadow-lg rounded-md px-3 py-1"
            >
              <p>Profile</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </section>
  );
};

export default SideBar;

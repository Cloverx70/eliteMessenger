"use client";
import Image from "next/image";
import Logo from "./../../../../public/EliteMessenger.png";
import { usePathname, useRouter } from "next/navigation";
import { Links } from "@/app/constants";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IoPersonCircleOutline, IoPersonCircle } from "react-icons/io5";

const SideBar = () => {
  const router = useRouter();

  const path = usePathname();

  return (
    <section className=" h-screen w-20 bg-customOlive rounded-r-3xl flex flex-col items-center justify-between">
      <Image
        src={Logo}
        alt="icon"
        className=" hover:scale-95 transition-all delay-100 cursor-pointer"
        onClick={() => router.push("/")}
      />

      <TooltipProvider>
        <div className=" w-full flex flex-col items-center justify-center flex-1">
          {Links.map((link, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => router.push(link.href)}
                  className={`my-1 text-white w-full p-2 flex items-center justify-center transition-all ease-linear duration-100  ${
                    path.startsWith(link.href)
                      ? "bg-gray-50 dark:bg-customBlack rounded-l-full "
                      : "bg-transparent"
                  }`}
                >
                  {path.startsWith(link.href) ? (
                    <link.filledIcon
                      color={path.startsWith(link.href) ? "#6D9886" : undefined}
                      size={25}
                      className="transition-all delay-100 cursor-pointer"
                    />
                  ) : (
                    <link.icon
                      size={25}
                      className="hover:scale-95 transition-all delay-100 cursor-pointer"
                    />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                sideOffset={4}
                className="bg-white text-black  border-black shadow-lg rounded-md px-3 py-1"
              >
                <p>{link.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        <div className="w-full h-[100px] flex items-end justify-center ">
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
                    className="hover:scale-95 transition-all delay-100 cursor-pointer"
                  />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              sideOffset={4}
              className="bg-white text-black  border-black shadow-lg rounded-md px-3 py-1"
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

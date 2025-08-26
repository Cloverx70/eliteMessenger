"use client";

import React from "react";
import SearchInput from "./SearchInput";
import { useQuery } from "@tanstack/react-query";
import { GetChatList } from "../action";
import Image from "next/image";
import { useRouter } from "next/navigation";
const ChatroomsList = () => {
  const { data: Chatrooms } = useQuery({
    queryKey: ["CHATROOMS"],
    queryFn: GetChatList,
  });

  const router = useRouter();

  return (
    <div className=" w-full h-full  flex flex-col px-4 border-r border-gray-200">
      <div className=" w-full py-5 ">
        <SearchInput />
      </div>
      <div className=" w-full h-full flex flex-col items-start overflow-y-auto">
        {Chatrooms?.map((room, _index) => (
          <div
            className={`w-full hover:bg-slate-200 transition-all duration-100 ease-linear cursor-pointer h-20 flex items-start justify-between px-3 border-t border-gray-300 ${
              _index === Chatrooms.length - 1 ? "border-b " : ""
            } `}
            key={room.id}
            onClick={() => router.push(`/chats/${room.id}`)}
          >
            <div className=" h-full flex gap-4 items-center justify-start">
              <div>
                <Image
                  src={room.recUserPfpUrl}
                  className="rounded-full ring-2 ring-customOlive"
                  alt="pfp"
                  width={45}
                  height={45}
                />
              </div>

              <div className="h-full flex flex-col items-start justify-center">
                <h1 className=" text-sm ">{room.recUsername}</h1>
                <p className=" text-xs text-neutral-400 w-[90%]">
                  {room.lastMessage || "Say Hi to your new friend"}
                </p>
              </div>
            </div>
            <div className="h-full flex items-center justify-end">
              <p className=" text-xs font-bold">
                {room.lastMessageDate?.toDateString() ||
                  new Date().toDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatroomsList;

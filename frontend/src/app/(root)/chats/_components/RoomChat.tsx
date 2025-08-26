"use client";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { GetChatroomAndMesseges } from "../action";
import { useParams } from "next/navigation";
import SearchInput from "./SearchInput";

const RoomChat = () => {
  const { cid } = useParams();

  const safeCid: string = Array.isArray(cid) ? cid[0] : cid ?? "";

  const { data: ChatroomAndMessages } = useQuery({
    queryKey: ["CHATROOMANDMESSAGES"],
    queryFn: () => GetChatroomAndMesseges(safeCid, 50, 1),
  });
  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-white/70 left-0 h-14 z-10 px-5 py-1 flex items-center">
        <h1 className="text-xl font-semibold z-20">
          {ChatroomAndMessages?.chatroom.recUsername}
        </h1>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-2">
        {/* map your messages here */}
      </div>

      {/* Input */}
      <div className="w-full  p-2 sticky bottom-0">
        <SearchInput />
      </div>
    </div>
  );
};

export default RoomChat;

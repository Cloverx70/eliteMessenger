"use client";

import { UserRoundPlus, UsersRound } from "lucide-react";

import { GetReceivedRequests } from "../action";
import React from "react";
import { useQuery } from "@tanstack/react-query";

export type FriendsTab = "people" | "requests";

type UserNavigationProps = {
  selectedTab: FriendsTab;
  onTabChange: (tab: FriendsTab) => void;
};

const UserNavigation = ({ selectedTab, onTabChange }: UserNavigationProps) => {
  const { data: receivedRequests } = useQuery({
    queryKey: ["RECEIVEDREQUESTS"],
    queryFn: GetReceivedRequests,
  });

  const requestCount = receivedRequests?.data?.length ?? 0;

  return (
    <div className="grid w-full grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => onTabChange("people")}
        className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-all duration-150 ${
          selectedTab === "people"
            ? "border-elitePurple bg-elitePurple text-white shadow-sm"
            : "border-slate-200 bg-white text-slate-600 hover:border-elitePurple/40 hover:bg-elitePurple/5 dark:border-slate-700 dark:bg-customBlack dark:text-slate-300"
        }`}
      >
        <UsersRound size={18} />

        <span>People you may know</span>
      </button>

      <button
        type="button"
        onClick={() => onTabChange("requests")}
        className={`relative flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-all duration-150 ${
          selectedTab === "requests"
            ? "border-elitePurple bg-elitePurple text-white shadow-sm"
            : "border-slate-200 bg-white text-slate-600 hover:border-elitePurple/40 hover:bg-elitePurple/5 dark:border-slate-700 dark:bg-customBlack dark:text-slate-300"
        }`}
      >
        <UserRoundPlus size={18} />

        <span>Friend requests</span>

        {requestCount > 0 && (
          <span
            className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
              selectedTab === "requests"
                ? "bg-white text-elitePurple"
                : "bg-elitePurple text-white"
            }`}
          >
            {requestCount > 99 ? "99+" : requestCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default UserNavigation;

"use client";

import React, { useState } from "react";
import UserNavigation, { FriendsTab } from "./_components/userNavigation";

import FriendRequestsPanel from "./_components/FriendRequestsPanel";
import PeopleYouMayKnow from "./_components/peopleYouMayKnow";
import SearchInput from "../chats/_components/SearchInput";
import SuggestedUsers from "@/app/(root)/friends/_components/SuggestedUsers";

export default function FriendsPage() {
  const [query, setQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<FriendsTab>("people");

  return (
    <section className="h-screen min-h-0 w-full overflow-hidden bg-[#FBFCFF] dark:bg-customBlack">
      <div className="grid h-full min-h-0 w-full grid-cols-1 grid-rows-[minmax(0,1fr)] overflow-hidden xl:grid-cols-[minmax(0,7fr)_minmax(300px,3fr)]">
        {/* Main friends content */}
        <main className="flex min-h-0 min-w-0 flex-col overflow-hidden border-r border-slate-200 dark:border-slate-800">
          {/* Fixed search and tabs */}
          <header className="z-10 flex shrink-0 flex-col gap-4 border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur-md dark:border-slate-800 dark:bg-customBlack/95">
            <SearchInput value={query} onChange={setQuery} />

            <UserNavigation
              selectedTab={selectedTab}
              onTabChange={setSelectedTab}
            />
          </header>

          {/* Independently scrollable main content */}
          <div className="min-h-0 flex-[7] overflow-y-auto px-6 py-6">
            {selectedTab === "people" ? (
              <section className="flex min-h-0 flex-col gap-5">
                <div className="flex shrink-0 items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                  <div>
                    <h1 className="text-xl font-bold text-customBlack dark:text-white">
                      People you may know
                    </h1>

                    <p className="mt-1 text-xs text-slate-500">
                      Discover people through mutual connections.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="text-xs font-semibold text-elitePurple transition-opacity hover:opacity-70"
                  >
                    View all
                  </button>
                </div>

                <PeopleYouMayKnow query={query} />
              </section>
            ) : (
              <FriendRequestsPanel />
            )}
          </div>
        </main>

        {/* Independently scrollable suggested users */}
        <aside className="hidden min-h-0 overflow-y-auto flex-[3] bg-white px-5 py-6 dark:bg-customBlack xl:block">
          <div className="mb-5 flex shrink-0 items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-customBlack dark:text-white">
                Suggested for you
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Expand your network.
              </p>
            </div>

            <button
              type="button"
              className="text-xs font-semibold text-elitePurple hover:opacity-70"
            >
              View all
            </button>
          </div>

          <SuggestedUsers />
        </aside>
      </div>
    </section>
  );
}

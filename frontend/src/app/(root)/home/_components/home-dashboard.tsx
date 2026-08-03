"use client";

import {
  containsSearch,
  normalizeConversations,
  normalizeMedia,
  normalizeNotifications,
  normalizePosts,
} from "../utils";
import { getHomeCurrentUser, getHomeSuggestedFriends } from "../action";
import {
  loadHomeDirectConversations,
  loadHomeGroups,
  loadHomeMedia,
  loadHomeNotifications,
  loadHomePosts,
} from "../source-adapters";
import { useMemo, useState } from "react";

import ContinueConversations from "./continue-conversations";
import DiscoverPreview from "./discover-preview";
import HomeHeader from "./home-header";
import QuickActions from "./quick-actions";
import RecentActivity from "./recent-activity";
import RecentMedia from "./recent-media";
import SuggestedFriends from "./suggested-friends";
import { useQuery } from "@tanstack/react-query";

const HOME_STALE_TIME = 30_000;

export default function HomeDashboard() {
  const [search, setSearch] = useState("");

  const currentUserQuery = useQuery({
    queryKey: ["HOME", "CURRENT_USER"],
    queryFn: getHomeCurrentUser,
    staleTime: 5 * 60_000,
    retry: false,
  });

  const directQuery = useQuery({
    queryKey: ["HOME", "DIRECT_CONVERSATIONS"],
    queryFn: loadHomeDirectConversations,
    staleTime: HOME_STALE_TIME,
  });

  const groupsQuery = useQuery({
    queryKey: ["HOME", "GROUP_CONVERSATIONS"],
    queryFn: loadHomeGroups,
    staleTime: HOME_STALE_TIME,
  });

  const notificationsQuery = useQuery({
    queryKey: ["HOME", "NOTIFICATIONS"],
    queryFn: loadHomeNotifications,
    staleTime: HOME_STALE_TIME,
  });

  const postsQuery = useQuery({
    queryKey: ["HOME", "POSTS"],
    queryFn: loadHomePosts,
    staleTime: 60_000,
  });

  const mediaQuery = useQuery({
    queryKey: ["HOME", "MEDIA"],
    queryFn: loadHomeMedia,
    staleTime: 60_000,
  });

  const suggestionsQuery = useQuery({
    queryKey: ["HOME", "SUGGESTED_FRIENDS"],
    queryFn: getHomeSuggestedFriends,
    staleTime: 2 * 60_000,
    retry: false,
  });

  const conversations = useMemo(
    () =>
      normalizeConversations(directQuery.data, groupsQuery.data).filter(
        (conversation) =>
          containsSearch(
            search,
            conversation.name,
            conversation.username,
            conversation.lastMessage,
          ),
      ),
    [directQuery.data, groupsQuery.data, search],
  );

  const notifications = useMemo(
    () =>
      normalizeNotifications(notificationsQuery.data).filter((notification) =>
        containsSearch(
          search,
          notification.title,
          notification.description,
          notification.actor?.username,
          notification.actor?.firstname,
          notification.actor?.lastname,
        ),
      ),
    [notificationsQuery.data, search],
  );

  const posts = useMemo(
    () =>
      normalizePosts(postsQuery.data).filter((post) =>
        containsSearch(
          search,
          post.caption,
          post.author.username,
          post.author.firstname,
          post.author.lastname,
        ),
      ),
    [postsQuery.data, search],
  );

  const media = useMemo(
    () =>
      normalizeMedia(mediaQuery.data).filter((item) =>
        containsSearch(search, item.filename, item.senderName, item.type),
      ),
    [mediaQuery.data, search],
  );

  const suggestions = useMemo(
    () =>
      (suggestionsQuery.data ?? []).filter((user) =>
        containsSearch(search, user.username, user.firstname, user.lastname),
      ),
    [suggestionsQuery.data, search],
  );

  const unreadCount = normalizeNotifications(notificationsQuery.data).filter(
    (notification) => !notification.isRead,
  ).length;

  const retryConversations = () => {
    void Promise.all([directQuery.refetch(), groupsQuery.refetch()]);
  };

  return (
    <div className="w-full min-w-0 overflow-x-hidden bg-[#f8f7fc] text-[#17132f]">
      <div className="w-full px-4 py-6 pb-10 sm:px-6 lg:px-8 lg:py-8 2xl:px-10">
        <HomeHeader
          user={currentUserQuery.data}
          unreadCount={unreadCount}
          search={search}
          onSearchChange={setSearch}
        />

        <div className="mt-7">
          <QuickActions />
        </div>

        <div className="mt-6 grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <main className="min-w-0 space-y-6">
            <ContinueConversations
              conversations={conversations}
              isLoading={directQuery.isLoading || groupsQuery.isLoading}
              isError={directQuery.isError && groupsQuery.isError}
              onRetry={retryConversations}
            />

            <DiscoverPreview
              posts={posts}
              isLoading={postsQuery.isLoading}
              isError={postsQuery.isError}
              onRetry={() => void postsQuery.refetch()}
            />
          </main>

          <aside className="min-w-0 space-y-6">
            <RecentActivity
              notifications={notifications}
              isLoading={notificationsQuery.isLoading}
              isError={notificationsQuery.isError}
              onRetry={() => void notificationsQuery.refetch()}
            />

            <SuggestedFriends
              users={suggestions}
              isLoading={suggestionsQuery.isLoading}
            />

            <RecentMedia
              items={media}
              isLoading={mediaQuery.isLoading}
              isError={mediaQuery.isError}
              onRetry={() => void mediaQuery.refetch()}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}

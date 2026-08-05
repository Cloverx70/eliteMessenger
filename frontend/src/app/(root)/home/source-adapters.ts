import { GetAllMedia, MediaSources } from "../media/action";

import { DiscoverFeedTab } from "../discover/types";
import { GetChatList } from "../chats/action";
import { GetGroupList } from "../groups/group-action";
import { getDiscoverFeed } from "../discover/action";
import { getNotifications } from "../notifications/action";

export async function loadHomeDirectConversations(): Promise<unknown> {
  return (await GetChatList("", "all")) ?? [];
}

export async function loadHomeGroups(): Promise<unknown> {
  return (await GetGroupList("", "all")) ?? [];
}

export async function loadHomeNotifications(): Promise<unknown> {
  const page = await getNotifications({
    filter: "ALL",
    limit: 6,
  });

  return page?.items ?? [];
}

export async function loadHomePosts(): Promise<unknown> {
  const page = await getDiscoverFeed({
    tab: DiscoverFeedTab.FOR_YOU,
  });

  return page?.items ?? [];
}

export async function loadHomeMedia(): Promise<unknown> {
  return (await GetAllMedia(MediaSources.ALLMEDIA)) ?? {};
}

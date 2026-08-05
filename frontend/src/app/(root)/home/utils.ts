import type {
  HomeConversation,
  HomeMediaItem,
  HomeNotification,
  HomePost,
} from "./types";

import { homeIntegrationRoutes } from "./integration-routes";

type UnknownRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function readNullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!isRecord(value)) return [];

  if (Array.isArray(value.data)) return value.data;
  if (Array.isArray(value.items)) return value.items;

  return [];
}

function toDateTimestamp(value: string | null): number {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeDate(value: unknown): string | null {
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== "string" || !value) return null;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function normalizeConversations(
  directValue: unknown,
  groupValue: unknown,
): HomeConversation[] {
  const direct = asArray(directValue)
    .map((value): HomeConversation | null => {
      if (!isRecord(value)) return null;

      const id = readString(value.id);
      if (!id) return null;

      const firstname = readString(value.recFirstname);
      const lastname = readString(value.recLastname);
      const username = readNullableString(value.recUsername);
      const fullName = [firstname, lastname].filter(Boolean).join(" ");
      const unreadMessages = Array.isArray(value.unreadMessages)
        ? value.unreadMessages.length
        : 0;

      return {
        id,
        kind: "direct",
        name: fullName || username || "Direct conversation",
        username,
        avatarUrl: readNullableString(value.recUserPfpUrl),
        isActive: readBoolean(value.recIsActive),
        unreadCount: Math.max(0, readNumber(value.unreadCount, unreadMessages)),
        lastMessage:
          readString(value.lastMessage).trim() || "Start a conversation",
        lastMessageDate: normalizeDate(value.lastMessageDate),
        href: homeIntegrationRoutes.pages.directChat(id),
      };
    })
    .filter((value): value is HomeConversation => value !== null);

  const groups = asArray(groupValue)
    .map((value): HomeConversation | null => {
      if (!isRecord(value)) return null;

      const id = readString(value.id);
      if (!id) return null;

      const unreadMessages = Array.isArray(value.unreadMessages)
        ? value.unreadMessages.length
        : 0;

      return {
        id,
        kind: "group",
        name: readString(value.name, "Group conversation"),
        username: null,
        avatarUrl: readNullableString(value.imageUrl),
        isActive: false,
        unreadCount: Math.max(0, readNumber(value.unreadCount, unreadMessages)),
        lastMessage: readString(value.lastMessage).trim() || "No messages yet",
        lastMessageDate: normalizeDate(value.lastMessageDate),
        href: homeIntegrationRoutes.pages.groupChat(id),
      };
    })
    .filter((value): value is HomeConversation => value !== null);

  return [...direct, ...groups]
    .sort(
      (first, second) =>
        toDateTimestamp(second.lastMessageDate) -
        toDateTimestamp(first.lastMessageDate),
    )
    .slice(0, 8);
}

function actorName(value: UnknownRecord | null): string {
  if (!value) return "Elite Messenger";

  const fullName = [readString(value.firstname), readString(value.lastname)]
    .filter(Boolean)
    .join(" ");

  return fullName || readString(value.username, "Elite Messenger");
}

function notificationCopy(value: UnknownRecord): {
  title: string;
  description: string;
} {
  const type = readString(value.type);
  const actor = isRecord(value.actor) ? value.actor : null;
  const data = isRecord(value.data) ? value.data : null;
  const name = actorName(actor);
  const groupName = readString(data?.groupName, "a group");
  const preview = readString(data?.preview);
  const count = Math.max(1, readNumber(value.aggregationCount, 1));

  switch (type) {
    case "FRIEND_REQUEST_RECEIVED":
      return {
        title: `${name} sent you a friend request.`,
        description: `${Math.max(
          0,
          readNumber(data?.mutualFriendCount),
        )} mutual friends`,
      };

    case "FRIEND_REQUEST_ACCEPTED":
      return {
        title: `${name} accepted your friend request.`,
        description: "You are now friends.",
      };

    case "POST_LIKED":
      return {
        title:
          count > 1
            ? `${name} and ${count - 1} ${
                count - 1 === 1 ? "other" : "others"
              } liked your post.`
            : `${name} liked your post.`,
        description: preview || "Your post received a new like.",
      };

    case "POST_COMMENTED":
      return {
        title: `${name} commented on your post.`,
        description: preview || "Open the post to read the comment.",
      };

    case "POST_SHARED":
      return {
        title: `${name} shared your post.`,
        description: preview || "Your post was shared.",
      };

    case "GROUP_ADDED":
      return {
        title: `${name} added you to ${groupName}.`,
        description: "Open the group to join the conversation.",
      };

    case "GROUP_REMOVED":
      return {
        title: `You were removed from ${groupName}.`,
        description: "You no longer have access to this group.",
      };

    case "GROUP_MENTION":
      return {
        title: `${name} mentioned you in ${groupName}.`,
        description: preview || "Open the message to view the mention.",
      };

    case "GROUP_ROLE_UPDATED":
      return {
        title: `Your role changed in ${groupName}.`,
        description: `${readString(
          data?.previousRole,
          "Previous role",
        )} → ${readString(data?.newRole, "New role")}`,
      };

    case "ACCOUNT_SECURITY":
      return {
        title: "Account security update.",
        description: [data?.browser, data?.device, data?.location]
          .filter((item): item is string => typeof item === "string")
          .join(" • "),
      };

    case "SYSTEM_ANNOUNCEMENT":
      return {
        title: readString(data?.title, "Elite Messenger announcement"),
        description: readString(data?.message, "There is a new system update."),
      };

    default:
      return {
        title: "New notification",
        description: "Open the notification for more details.",
      };
  }
}

export function normalizeNotifications(value: unknown): HomeNotification[] {
  return asArray(value)
    .map((item): HomeNotification | null => {
      if (!isRecord(item)) return null;

      const id = readString(item.id);
      if (!id) return null;

      const copy = notificationCopy(item);
      const actor = isRecord(item.actor)
        ? {
            id: readString(item.actor.id),
            username: readString(item.actor.username),
            firstname: readString(item.actor.firstname),
            lastname: readString(item.actor.lastname),
            userPfpUrl: readNullableString(item.actor.userPfpUrl),
          }
        : null;
      const target = isRecord(item.target) ? item.target : null;
      const targetHref = readNullableString(target?.href);

      return {
        id,
        type: readString(item.type),
        actor,
        title: copy.title,
        description: copy.description,
        isRead: readBoolean(item.isRead),
        createdAt: normalizeDate(item.createdAt) ?? new Date().toISOString(),
        href:
          targetHref ??
          `${homeIntegrationRoutes.pages.notifications}?notification=${id}`,
      };
    })
    .filter((item): item is HomeNotification => item !== null)
    .slice(0, 6);
}

export function normalizePosts(value: unknown): HomePost[] {
  return asArray(value)
    .map((item): HomePost | null => {
      if (!isRecord(item) || !isRecord(item.author)) return null;

      const id = readString(item.id);
      const authorId = readString(item.author.id);
      const username = readString(item.author.username);
      if (!id || !authorId || !username) return null;

      const attachments = Array.isArray(item.attachments)
        ? item.attachments
            .map((attachment): HomePost["attachments"][number] | null => {
              if (!isRecord(attachment)) return null;

              const attachmentId = readString(attachment.id);
              const url = readString(attachment.url);
              const type = readString(attachment.type);

              if (
                !attachmentId ||
                !url ||
                (type !== "IMAGE" && type !== "VIDEO")
              ) {
                return null;
              }

              return {
                id: attachmentId,
                type,
                url,
                blurDataURL: readNullableString(attachment.blurDataURL),
              };
            })
            .filter(
              (attachment): attachment is HomePost["attachments"][number] =>
                attachment !== null,
            )
        : [];

      return {
        id,
        author: {
          id: authorId,
          username,
          firstname: readString(item.author.firstname),
          lastname: readString(item.author.lastname),
          userPfpUrl: readNullableString(item.author.userPfpUrl),
        },
        caption: readNullableString(item.caption),
        attachments,
        likeCount: Math.max(0, readNumber(item.likeCount)),
        commentCount: Math.max(0, readNumber(item.commentCount)),
        shareCount: Math.max(0, readNumber(item.shareCount)),
        createdAt: normalizeDate(item.createdAt) ?? new Date().toISOString(),
        href: homeIntegrationRoutes.pages.post(id),
      };
    })
    .filter((item): item is HomePost => item !== null)
    .slice(0, 3);
}

function mediaItemsFromPage(value: unknown): unknown[] {
  if (!isRecord(value)) return [];
  return Array.isArray(value.items) ? value.items : [];
}

export function normalizeMedia(value: unknown): HomeMediaItem[] {
  if (!isRecord(value)) return [];

  const candidates = [
    ...mediaItemsFromPage(value.chats),
    ...mediaItemsFromPage(value.groupchats),
  ];

  return candidates
    .map((item): HomeMediaItem | null => {
      if (!isRecord(item)) return null;

      const id = readString(item.id);
      const url = readString(item.url);
      if (!id || !url) return null;

      const message = isRecord(item.message) ? item.message : null;
      const sender = isRecord(message?.sender) ? message.sender : null;
      const senderName = sender
        ? [readString(sender.firstname), readString(sender.lastname)]
            .filter(Boolean)
            .join(" ") || readString(sender.username, "Unknown user")
        : "Unknown user";

      return {
        id,
        url,
        blurUrl: readNullableString(item.blurUrl),
        type: readString(item.type, "FILE"),
        filename: readNullableString(item.filename),
        createdAt: normalizeDate(item.createdAt) ?? new Date().toISOString(),
        senderName,
        href: homeIntegrationRoutes.pages.media,
      };
    })
    .filter((item): item is HomeMediaItem => item !== null)
    .sort(
      (first, second) =>
        toDateTimestamp(second.createdAt) - toDateTimestamp(first.createdAt),
    )
    .slice(0, 6);
}

export function formatRelativeTime(value: string | null): string {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const difference = date.getTime() - Date.now();
  const absoluteDifference = Math.abs(difference);
  const formatter = new Intl.RelativeTimeFormat("en", {
    numeric: "auto",
  });

  if (absoluteDifference < 60_000) {
    return formatter.format(Math.round(difference / 1_000), "second");
  }

  if (absoluteDifference < 3_600_000) {
    return formatter.format(Math.round(difference / 60_000), "minute");
  }

  if (absoluteDifference < 86_400_000) {
    return formatter.format(Math.round(difference / 3_600_000), "hour");
  }

  if (absoluteDifference < 604_800_000) {
    return formatter.format(Math.round(difference / 86_400_000), "day");
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function containsSearch(
  query: string,
  ...values: Array<string | null | undefined>
): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return values
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase()
    .includes(normalized);
}

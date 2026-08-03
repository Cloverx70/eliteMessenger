export type NotificationCategory = "SOCIAL" | "POST" | "CHAT" | "SYSTEM";

export type NotificationType =
  | "FRIEND_REQUEST_RECEIVED"
  | "FRIEND_REQUEST_ACCEPTED"
  | "POST_LIKED"
  | "POST_COMMENTED"
  | "POST_SHARED"
  | "GROUP_ADDED"
  | "GROUP_REMOVED"
  | "GROUP_MENTION"
  | "GROUP_ROLE_UPDATED"
  | "ACCOUNT_SECURITY"
  | "SYSTEM_ANNOUNCEMENT";

export type NotificationEntityType =
  | "USER"
  | "FRIEND_REQUEST"
  | "CHATROOM"
  | "MESSAGE"
  | "GROUP"
  | "GROUP_MESSAGE"
  | "POST"
  | "COMMENT"
  | "SECURITY_EVENT"
  | "SYSTEM";

export type NotificationFilter =
  | "ALL"
  | "UNREAD"
  | "MENTIONS"
  | "SOCIAL"
  | "GROUPS"
  | "POSTS"
  | "SYSTEM";

export interface NotificationActor {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  userPfpUrl: string | null;
  isActive: boolean;
  lastSeen: string | null;
}

export interface NotificationData {
  preview?: string | null;

  mutualFriendCount?: number;

  groupName?: string | null;
  previousRole?: string | null;
  newRole?: string | null;

  securityEventType?: string | null;
  device?: string | null;
  browser?: string | null;
  location?: string | null;
  receiverId?: string | null;
  title?: string | null;
  message?: string | null;
}

export interface NotificationTarget {
  href: string | null;
  available: boolean;
}

export interface NotificationItem {
  id: string;

  category: NotificationCategory;
  type: NotificationType;

  actor: NotificationActor | null;

  entityType: NotificationEntityType | null;
  entityId: string | null;
  secondaryEntityId: string | null;

  aggregationCount: number;
  data: NotificationData | null;

  thumbnailUrl: string | null;
  target: NotificationTarget;

  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MutualFriend {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  userPfpUrl: string | null;
  isActive: boolean;
  lastSeen: string | null;
}

export interface NotificationDetail extends NotificationItem {
  mutualFriends: MutualFriend[];
}

export interface NotificationPage {
  items: NotificationItem[];
  nextCursor: string | null;
}

export interface NotificationListParams {
  filter: NotificationFilter;
  search?: string;
  limit?: number;
}

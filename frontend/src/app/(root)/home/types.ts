export interface HomeUser {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  userPfpUrl: string | null;
  isActive?: boolean;
}

export type HomeConversationKind = 'direct' | 'group';

export interface HomeConversation {
  id: string;
  kind: HomeConversationKind;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  unreadCount: number;
  lastMessage: string;
  lastMessageDate: string | null;
  href: string;
}

export interface HomeSuggestedUser extends HomeUser {
  mutualFriendCount: number;
  requestId?: string | null;
}

export interface HomeNotificationActor {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  userPfpUrl: string | null;
}

export interface HomeNotification {
  id: string;
  type: string;
  actor: HomeNotificationActor | null;
  title: string;
  description: string;
  isRead: boolean;
  createdAt: string;
  href: string;
}

export interface HomePostAuthor {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  userPfpUrl: string | null;
}

export interface HomePostAttachment {
  id: string;
  type: 'IMAGE' | 'VIDEO';
  url: string;
  blurDataURL?: string | null;
}

export interface HomePost {
  id: string;
  author: HomePostAuthor;
  caption: string | null;
  attachments: HomePostAttachment[];
  likeCount: number;
  commentCount: number;
  shareCount: number;
  createdAt: string;
  href: string;
}

export interface HomeMediaItem {
  id: string;
  url: string;
  blurUrl?: string | null;
  type: string;
  filename?: string | null;
  createdAt: string;
  senderName: string;
  href: string;
}

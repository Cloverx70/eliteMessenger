export enum DiscoverFeedTab {
  FOR_YOU = "FOR_YOU",
  FOLLOWING = "FOLLOWING",
  TRENDING = "TRENDING",
  EXPLORE = "EXPLORE",
}

export enum PostVisibility {
  PUBLIC = "PUBLIC",
  FRIENDS = "FRIENDS",
}

export enum PostAttachmentType {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
}

export enum PostShareTarget {
  CHAT = "CHAT",
  GROUPCHAT = "GROUPCHAT",
}

export enum PostReportReason {
  SPAM = "SPAM",
  HARASSMENT = "HARASSMENT",
  INAPPROPRIATE = "INAPPROPRIATE",
  FALSE_INFORMATION = "FALSE_INFORMATION",
  OTHER = "OTHER",
}

export interface PostAuthor {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  userPfpUrl: string | null;
}

export interface PostAttachment {
  id: string;
  type: PostAttachmentType;
  mimeType: string;
  filename: string | null;
  size: number | string | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  displayOrder: number;
  blurDataURL: string | null;
  url: string;
  createdAt: string;
}

export interface PostViewerState {
  liked: boolean;
  saved: boolean;
  isAuthor: boolean;
}

export interface DiscoverPost {
  id: string;
  authorId: string;
  author: PostAuthor;
  caption: string | null;
  visibility: PostVisibility;
  commentsEnabled: boolean;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  attachments: PostAttachment[];
  viewer: PostViewerState;
  createdAt: string;
  updatedAt: string;
}

export interface FeedPage {
  items: DiscoverPost[];
  nextCursor: string | null;
}

export interface FeedFilters {
  tab: DiscoverFeedTab;
  search?: string;
  mediaType?: PostAttachmentType;
}

export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: PostAuthor;
  viewer: {
    isAuthor: boolean;
  };
}

export interface CommentsPage {
  items: PostComment[];
  nextCursor: string | null;
}

export interface ShareTarget {
  id: string;
  type: PostShareTarget;
  name: string;
  username: string | null;
  imageUrl: string | null;
}

export interface ShareTargetsResponse {
  chats: ShareTarget[];
  groups: ShareTarget[];
}

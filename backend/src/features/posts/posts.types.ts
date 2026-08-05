import { PostAttachmentType } from '../../database/entities/postAttachment.entity';
import { PostVisibility } from '../../database/entities/post.entity';

export interface PostAuthorResponse {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  userPfpUrl: string | null;
}

export interface PostAttachmentResponse {
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
  createdAt: Date;
}

export interface PostViewerState {
  liked: boolean;
  saved: boolean;
  isAuthor: boolean;
}

export interface PostResponse {
  id: string;
  authorId: string;
  author: PostAuthorResponse;
  caption: string | null;
  visibility: PostVisibility;
  commentsEnabled: boolean;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  attachments: PostAttachmentResponse[];
  viewer: PostViewerState;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeedResponse {
  items: PostResponse[];
  nextCursor: string | null;
}

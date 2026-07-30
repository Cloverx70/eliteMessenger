import { AxiosProgressEvent } from "axios";

import ServerEndpoint from "@/lib/server-endpoint";
import {
  CommentsPage,
  DiscoverPost,
  FeedFilters,
  FeedPage,
  PostReportReason,
  PostShareTarget,
  ShareTargetsResponse,
} from "./types";

export async function getDiscoverFeed(
  filters: FeedFilters,
  cursor?: string,
): Promise<FeedPage> {
  const response = await ServerEndpoint.get<FeedPage>("/posts/feed", {
    params: {
      ...filters,
      cursor,
      limit: 15,
    },
  });

  return response.data;
}

export async function getPost(postId: string): Promise<DiscoverPost> {
  const response = await ServerEndpoint.get<DiscoverPost>(`/posts/${postId}`);
  return response.data;
}

export async function createPost(
  formData: FormData,
  onProgress?: (progress: number) => void,
): Promise<DiscoverPost> {
  const response = await ServerEndpoint.post<{
    message: string;
    code: number;
    data: DiscoverPost;
  }>("/posts", formData, {
    onUploadProgress: (event: AxiosProgressEvent) => {
      if (!event.total || !onProgress) return;
      onProgress(Math.round((event.loaded * 100) / event.total));
    },
  });

  return response.data.data;
}

export async function updatePost(
  postId: string,
  payload: {
    caption?: string | null;
    visibility?: string;
    commentsEnabled?: boolean;
  },
): Promise<DiscoverPost> {
  const response = await ServerEndpoint.patch<DiscoverPost>(
    `/posts/${postId}`,
    payload,
  );
  return response.data;
}

export async function deletePost(postId: string): Promise<void> {
  await ServerEndpoint.delete(`/posts/${postId}`);
}

export async function setPostLiked(
  postId: string,
  liked: boolean,
): Promise<{ liked: boolean; likeCount: number }> {
  const response = liked
    ? await ServerEndpoint.post<{ liked: boolean; likeCount: number }>(
        `/posts/${postId}/like`,
      )
    : await ServerEndpoint.delete<{ liked: boolean; likeCount: number }>(
        `/posts/${postId}/like`,
      );

  return response.data;
}

export async function setPostSaved(
  postId: string,
  saved: boolean,
): Promise<{ saved: boolean }> {
  const response = saved
    ? await ServerEndpoint.post<{ saved: boolean }>(`/posts/${postId}/save`)
    : await ServerEndpoint.delete<{ saved: boolean }>(`/posts/${postId}/save`);

  return response.data;
}

export async function getPostComments(
  postId: string,
  cursor?: string,
): Promise<CommentsPage> {
  const response = await ServerEndpoint.get<CommentsPage>(
    `/posts/${postId}/comments`,
    { params: { cursor, limit: 20 } },
  );
  return response.data;
}

export async function createPostComment(
  postId: string,
  content: string,
) {
  const response = await ServerEndpoint.post(`/posts/${postId}/comments`, {
    content,
  });
  return response.data;
}

export async function deletePostComment(
  postId: string,
  commentId: string,
): Promise<void> {
  await ServerEndpoint.delete(`/posts/${postId}/comments/${commentId}`);
}

export async function getShareTargets(
  search?: string,
): Promise<ShareTargetsResponse> {
  const response = await ServerEndpoint.get<ShareTargetsResponse>(
    "/posts/share-targets",
    { params: { search } },
  );
  return response.data;
}

export async function sharePost(
  postId: string,
  targetType: PostShareTarget,
  targetId: string,
): Promise<void> {
  await ServerEndpoint.post(`/posts/${postId}/share`, {
    targetType,
    targetId,
  });
}

export async function reportPost(
  postId: string,
  reason: PostReportReason,
  details?: string,
): Promise<void> {
  await ServerEndpoint.post(`/posts/${postId}/report`, {
    reason,
    details: details?.trim() || null,
  });
}

export async function hidePost(postId: string): Promise<void> {
  await ServerEndpoint.post(`/posts/${postId}/hide`);
}

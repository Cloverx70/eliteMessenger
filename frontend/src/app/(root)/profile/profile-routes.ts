export const profileRoutes = {
  notifications: "/notifications",
  createPost: "/discover/create",
  friends: "/friends",
  media: "/media",

  post: (postId: string) =>
    `/discover?post=${encodeURIComponent(postId)}`,

  user: (username: string) =>
    `/profile/${encodeURIComponent(username)}`,

  group: (groupId: string) =>
    `/groups/${encodeURIComponent(groupId)}`,
} as const;

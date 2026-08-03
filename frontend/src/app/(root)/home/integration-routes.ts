/**
 * Keep all project-specific routes in this file.
 * The dashboard components do not hardcode application URLs anywhere else.
 */
export const homeIntegrationRoutes = {
  api: {
    // Change only these two values when your existing endpoint names differ.
    currentUser: "/auth/me",
    suggestedFriends: "/friends/people-you-may-know",
  },

  pages: {
    chats: "/chats",
    groups: "/groups",
    friends: "/friends",
    discover: "/discover",
    media: "/media",
    notifications: "/notifications",

    directChat: (chatroomId: string) => `/chats/${chatroomId}`,
    groupChat: (groupId: string) => `/chats/groups/${groupId}`,
    post: (postId: string) => `/discover?postId=${postId}`,
    profile: (username: string) => `/profile/${encodeURIComponent(username)}`,
  },
} as const;

export const homeIntegrationRoutes = {
  api: {
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
    groupChat: (groupId: string) => `/groups/${groupId}`,
    post: (postId: string) => `/discover?post=${postId}`,
    profile: (username: string) => `/profile/${encodeURIComponent(username)}`,
  },
} as const;

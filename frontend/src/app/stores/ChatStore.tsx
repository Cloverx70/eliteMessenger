import { create } from "zustand";

type ChatStore = {
  unreadCounts: Record<string, number>;
  groupUnreadCounts: Record<string, number>;

  incrementUnread: (chatroomId: string) => void;
  clearUnread: (chatroomId: string) => void;
  setUnread: (chatroomId: string, count: number) => void;

  incrementGroupUnread: (groupId: string) => void;
  clearGroupUnread: (groupId: string) => void;
  setGroupUnread: (groupId: string, count: number) => void;
};

export const useChatStore = create<ChatStore>((set) => ({
  unreadCounts: {},
  groupUnreadCounts: {},

  incrementUnread: (chatroomId) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [chatroomId]: (state.unreadCounts[chatroomId] || 0) + 1,
      },
    })),

  clearUnread: (chatroomId) =>
    set((state) => {
      const updated = { ...state.unreadCounts };
      delete updated[chatroomId];
      return { unreadCounts: updated };
    }),

  setUnread: (chatroomId, count) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [chatroomId]: Math.max(0, count),
      },
    })),

  incrementGroupUnread: (groupId) =>
    set((state) => ({
      groupUnreadCounts: {
        ...state.groupUnreadCounts,
        [groupId]: (state.groupUnreadCounts[groupId] || 0) + 1,
      },
    })),

  clearGroupUnread: (groupId) =>
    set((state) => {
      const updated = { ...state.groupUnreadCounts };
      delete updated[groupId];
      return { groupUnreadCounts: updated };
    }),

  setGroupUnread: (groupId, count) =>
    set((state) => ({
      groupUnreadCounts: {
        ...state.groupUnreadCounts,
        [groupId]: Math.max(0, count),
      },
    })),
}));

import { create } from "zustand";

export type UserPresence = {
  isActive: boolean;
  lastSeen: string | null;
};

type PresenceStore = {
  presenceByUserId: Record<string, UserPresence>;

  setPresence: (
    userId: string,
    presence: UserPresence,
  ) => void;

  clearPresence: () => void;
};

export const usePresenceStore = create<PresenceStore>((set) => ({
  presenceByUserId: {},

  setPresence: (userId, presence) =>
    set((state) => ({
      presenceByUserId: {
        ...state.presenceByUserId,
        [userId]: presence,
      },
    })),

  clearPresence: () => {
    set({
      presenceByUserId: {},
    });
  },
}));

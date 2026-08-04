"use client";

import type { IMessage } from "@/app/(root)/chats/action";
import type { IUser } from "@/app/auth/actions";
import React, {
  createContext,
  useContext,
  useEffect,
} from "react";

import {
  SocketContextValue,
  useSocket,
} from "@/app/hooks/useSocket";
import { useChatStore } from "@/app/stores/ChatStore";
import { usePresenceStore } from "@/app/stores/PresenceStore";

const SocketContext = createContext<SocketContextValue | null>(null);

export const SocketProvider = ({
  user,
  children,
}: {
  user: IUser;
  children: React.ReactNode;
}) => {
  const socketData = useSocket(user.id);

  const incrementUnread = useChatStore(
    (state) => state.incrementUnread,
  );
  const setPresence = usePresenceStore(
    (state) => state.setPresence,
  );

  useEffect(() => {
    const socket = socketData.socket;

    if (!socket) {
      return;
    }

    const handleDirectNotification = (message: IMessage) => {
      const chatroomId =
        message.chatroomId ??
        message.chatRoom?.id;

      if (!chatroomId) {
        return;
      }

      incrementUnread(chatroomId);
    };

    const handlePresenceUpdate = (payload: {
      userId: string;
      isActive: boolean;
      lastSeen: string | null;
    }) => {
      setPresence(payload.userId, {
        isActive: payload.isActive,
        lastSeen: payload.lastSeen,
      });
    };

    socket.on(
      "new-message-notification",
      handleDirectNotification,
    );
    socket.on(
      "presence:update",
      handlePresenceUpdate,
    );

    return () => {
      socket.off(
        "new-message-notification",
        handleDirectNotification,
      );
      socket.off(
        "presence:update",
        handlePresenceUpdate,
      );
    };
  }, [
    incrementUnread,
    setPresence,
    socketData.socket,
  ]);

  return (
    <SocketContext.Provider value={socketData}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = (): SocketContextValue => {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error(
      "useSocketContext must be used inside SocketProvider",
    );
  }

  return context;
};

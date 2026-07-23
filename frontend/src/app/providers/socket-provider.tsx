// app/providers/SocketProvider.tsx
"use client";

import { IAttachment, IMessage } from "../(root)/chats/action";
import React, { createContext, useContext, useEffect } from "react";

import { IUser } from "@/app/auth/actions";
import { Socket } from "socket.io-client";
import { useChatStore } from "@/app/stores/ChatStore";
import { useSocket } from "../hooks/useSocket";

interface SocketData {
  socketRef: React.MutableRefObject<Socket | null>;
  sendMessage: (
    sid: string,
    rid: string,
    text: string,
    crid: string,
    tempId: string,
    attachments?: IAttachment[],
  ) => void;

  joinRoom: (roomId: string, userId: string) => void;
  leaveRoom: (roomId: string, userId: string) => void;

  onMessage: (callback: (msg: IMessage) => void) => void;
  offMessage: (callback: (msg: IMessage) => void) => void;

  disconnectSocket: () => void;
}

const SocketContext = createContext<SocketData | undefined>(undefined);

export const SocketProvider = ({
  user,
  children,
}: {
  user: IUser;
  children: React.ReactNode;
}) => {
  const socketData = useSocket(user.id);

  const incrementUnread = useChatStore((state) => state.incrementUnread);

  useEffect(() => {
    const socket = socketData.socketRef.current;

    if (!socket) return;

    const handleNotification = (message: IMessage) => {
      console.log("NEW MESSAGE NOTIFICATION:", message);

      const chatroomId = message.chatroomId ?? message.chatRoom?.id;

      if (!chatroomId) {
        console.log("No chatroom id found", message);
        return;
      }

      incrementUnread(chatroomId);
    };

    socket.on("new-message-notification", handleNotification);

    return () => {
      socket.off("new-message-notification", handleNotification);
    };
  }, [socketData.socketRef, incrementUnread]);

  return (
    <SocketContext.Provider value={socketData}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = () => useContext(SocketContext);

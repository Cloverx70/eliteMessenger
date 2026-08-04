"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

import type {
  IAttachment,
  IMessage,
} from "@/app/(root)/chats/action";
import type { IGroupMessage } from "@/app/(root)/groups/group-action";

export type DirectSentAck = {
  tempId: string;
  message: IMessage;
};

export type DirectDeliveredAck = {
  messageId: string;
  tempId?: string;
  status: "delivered";
};

export type DirectSeenAck = {
  messageId: string;
};

export type GroupReceiptAck = {
  messageId: string;
  groupId: string;
  totalRecipients: number;
  deliveredCount: number;
  seenCount: number;
  status: "sent" | "delivered" | "seen";
};

export type PresenceUpdate = {
  userId: string;
  isActive: boolean;
  lastSeen: string | null;
};

const socketUrl =
  process.env.NEXT_PUBLIC_SOCKET_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3000";

export const useSocket = (userId: string) => {
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const socketInstance = io(socketUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 5_000,
      timeout: 20_000,
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    const handleConnect = () => {
      setIsConnected(true);
      console.log("Socket connected:", socketInstance.id);
    };

    const handleDisconnect = (reason: string) => {
      setIsConnected(false);
      console.log("Socket disconnected:", reason);
    };

    const handleConnectError = (error: Error) => {
      setIsConnected(false);
      console.error("Socket connection error:", error.message);
    };

    socketInstance.on("connect", handleConnect);
    socketInstance.on("disconnect", handleDisconnect);
    socketInstance.on("connect_error", handleConnectError);

    return () => {
      socketInstance.off("connect", handleConnect);
      socketInstance.off("disconnect", handleDisconnect);
      socketInstance.off("connect_error", handleConnectError);
      socketInstance.removeAllListeners();
      socketInstance.disconnect();

      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [userId]);

  const sendMessage = useCallback(
    (
      sid: string,
      rid: string,
      text: string,
      crid: string,
      tempId: string,
      attachments: IAttachment[] = [],
      sharedPostId?: string,
    ) => {
      socketRef.current?.emit("send-message", {
        sid,
        rid,
        text,
        crid,
        tempId,
        attachments,
        sharedPostId,
      });
    },
    [],
  );

  const joinRoom = useCallback((roomId: string, currentUserId: string) => {
    socketRef.current?.emit("joinRoom", {
      roomId,
      userId: currentUserId,
    });
  }, []);

  const leaveRoom = useCallback((roomId: string, currentUserId: string) => {
    socketRef.current?.emit("leaveRoom", {
      roomId,
      userId: currentUserId,
    });
  }, []);

  const messageSeen = useCallback((crid: string, sid: string) => {
    socketRef.current?.emit("message-seen", {
      crid,
      sid,
    });
  }, []);

  const onMessage = useCallback((callback: (message: IMessage) => void) => {
    socketRef.current?.on("receiveMessage", callback);
  }, []);

  const offMessage = useCallback((callback: (message: IMessage) => void) => {
    socketRef.current?.off("receiveMessage", callback);
  }, []);

  const onSentACK = useCallback((callback: (ack: DirectSentAck) => void) => {
    socketRef.current?.on("message-sent-ack", callback);
  }, []);

  const offSentACK = useCallback((callback: (ack: DirectSentAck) => void) => {
    socketRef.current?.off("message-sent-ack", callback);
  }, []);

  const onDeliveredACK = useCallback(
    (callback: (ack: DirectDeliveredAck) => void) => {
      socketRef.current?.on("message-delivered-ack", callback);
    },
    [],
  );

  const offDeliveredACK = useCallback(
    (callback: (ack: DirectDeliveredAck) => void) => {
      socketRef.current?.off("message-delivered-ack", callback);
    },
    [],
  );

  const onSeenACK = useCallback((callback: (ack: DirectSeenAck) => void) => {
    socketRef.current?.on("message-seen-ack", callback);
  }, []);

  const offSeenACK = useCallback((callback: (ack: DirectSeenAck) => void) => {
    socketRef.current?.off("message-seen-ack", callback);
  }, []);

  const sendGroupMessage = useCallback(
    (
      sid: string,
      gid: string,
      text: string,
      tempId: string,
      attachments: IAttachment[] = [],
      sharedPostId?: string,
    ) => {
      socketRef.current?.emit("send-group-message", {
        sid,
        gid,
        text,
        tempId,
        attachments,
        sharedPostId,
      });
    },
    [],
  );

  const joinGroupRoom = useCallback(
    (groupId: string, currentUserId: string) => {
      socketRef.current?.emit("joinGroupRoom", {
        groupId,
        userId: currentUserId,
      });
    },
    [],
  );

  const leaveGroupRoom = useCallback(
    (groupId: string, currentUserId: string) => {
      socketRef.current?.emit("leaveGroupRoom", {
        groupId,
        userId: currentUserId,
      });
    },
    [],
  );

  const groupMessagesSeen = useCallback(
    (groupId: string, currentUserId: string) => {
      socketRef.current?.emit("group-message-seen", {
        groupId,
        userId: currentUserId,
      });
    },
    [],
  );

  const onGroupMessage = useCallback(
    (callback: (message: IGroupMessage) => void) => {
      socketRef.current?.on("receive-group-message", callback);
    },
    [],
  );

  const offGroupMessage = useCallback(
    (callback: (message: IGroupMessage) => void) => {
      socketRef.current?.off("receive-group-message", callback);
    },
    [],
  );

  const onGroupSentACK = useCallback(
    (
      callback: (ack: {
        tempId: string;
        message: IGroupMessage;
      }) => void,
    ) => {
      socketRef.current?.on("group-message-sent-ack", callback);
    },
    [],
  );

  const offGroupSentACK = useCallback(
    (
      callback: (ack: {
        tempId: string;
        message: IGroupMessage;
      }) => void,
    ) => {
      socketRef.current?.off("group-message-sent-ack", callback);
    },
    [],
  );

  const onGroupDeliveredACK = useCallback(
    (callback: (ack: GroupReceiptAck) => void) => {
      socketRef.current?.on("group-message-delivered-ack", callback);
    },
    [],
  );

  const offGroupDeliveredACK = useCallback(
    (callback: (ack: GroupReceiptAck) => void) => {
      socketRef.current?.off("group-message-delivered-ack", callback);
    },
    [],
  );

  const onGroupSeenACK = useCallback(
    (callback: (ack: GroupReceiptAck) => void) => {
      socketRef.current?.on("group-message-seen-ack", callback);
    },
    [],
  );

  const offGroupSeenACK = useCallback(
    (callback: (ack: GroupReceiptAck) => void) => {
      socketRef.current?.off("group-message-seen-ack", callback);
    },
    [],
  );

  const onGroupNotification = useCallback(
    (callback: (message: IGroupMessage) => void) => {
      socketRef.current?.on("new-group-message-notification", callback);
    },
    [],
  );

  const offGroupNotification = useCallback(
    (callback: (message: IGroupMessage) => void) => {
      socketRef.current?.off("new-group-message-notification", callback);
    },
    [],
  );

  const disconnectSocket = useCallback(() => {
    socketRef.current?.disconnect();
  }, []);

  return {
    socket,
    socketRef,
    isConnected,

    sendMessage,
    joinRoom,
    leaveRoom,
    messageSeen,
    onMessage,
    offMessage,
    onSentACK,
    offSentACK,
    onDeliveredACK,
    offDeliveredACK,
    onSeenACK,
    offSeenACK,

    sendGroupMessage,
    joinGroupRoom,
    leaveGroupRoom,
    groupMessagesSeen,
    onGroupMessage,
    offGroupMessage,
    onGroupSentACK,
    offGroupSentACK,
    onGroupDeliveredACK,
    offGroupDeliveredACK,
    onGroupSeenACK,
    offGroupSeenACK,
    onGroupNotification,
    offGroupNotification,

    disconnectSocket,
  };
};

export type SocketContextValue = ReturnType<typeof useSocket>;

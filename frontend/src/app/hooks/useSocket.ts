import { IAttachment, IMessage } from "../(root)/chats/action";
import {
  IGroupMessage,
  IGroupReceiptSummary,
} from "../(root)/groups/group-action";
import { Socket, io } from "socket.io-client";
import { useEffect, useRef } from "react";

let socketInstance: Socket | null = null;

export type DirectSentAck = {
  tempId: string;
  message: IMessage;
};

export type DirectDeliveredAck = {
  tempId?: string;
  messageId: string;
  status: "delivered";
};

export type GroupSentAck = {
  tempId: string;
  message: IGroupMessage;
};

export type GroupReceiptAck = IGroupReceiptSummary & {
  messageId: string;
  groupId: string;
  senderId?: string | null;
  recipientUserId?: string;
  seenByUserId?: string;
};

export const useSocket = (userId: string) => {
  const socketRef = useRef<Socket | null>(null);

  if (!socketInstance) {
    socketInstance = io("http://localhost:3001", {
      withCredentials: true,
    });
  }

  useEffect(() => {
    if (!userId) return;

    const socket = socketInstance!;

    const handleConnect = () => {
      socket.emit("join", userId);
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.on("connect", handleConnect);
    }

    socketRef.current = socket;

    return () => {
      socket.off("connect", handleConnect);
    };
  }, [userId]);

  const sendMessage = (
    sid: string,
    rid: string,
    text: string,
    crid: string,
    tempId: string,
    attachments?: IAttachment[],
  ) => {
    socketRef.current?.emit("send-message", {
      sid,
      rid,
      text,
      crid,
      tempId,
      attachments,
    });
  };

  const joinRoom = (roomId: string, currentUserId: string) => {
    socketRef.current?.emit("joinRoom", {
      roomId,
      userId: currentUserId,
    });
  };

  const leaveRoom = (roomId: string, currentUserId: string) => {
    socketRef.current?.emit("leaveRoom", {
      roomId,
      userId: currentUserId,
    });
  };

  const messageSeen = (crid: string, sid: string) => {
    socketRef.current?.emit("message-seen", { crid, sid });
  };

  const sendGroupMessage = (
    sid: string,
    groupId: string,
    text: string,
    tempId: string,
    attachments?: IAttachment[],
  ) => {
    socketRef.current?.emit("send-group-message", {
      sid,
      gid: groupId,
      text,
      tempId,
      attachments,
    });
  };

  const joinGroupRoom = (groupId: string, currentUserId: string) => {
    socketRef.current?.emit("joinGroupRoom", {
      groupId,
      userId: currentUserId,
    });
  };

  const leaveGroupRoom = (groupId: string, currentUserId: string) => {
    socketRef.current?.emit("leaveGroupRoom", {
      groupId,
      userId: currentUserId,
    });
  };

  const groupMessagesSeen = (groupId: string, currentUserId: string) => {
    socketRef.current?.emit("group-message-seen", {
      groupId,
      userId: currentUserId,
    });
  };

  const onMessage = (callback: (message: IMessage) => void) => {
    socketRef.current?.on("receiveMessage", callback);
  };

  const offMessage = (callback: (message: IMessage) => void) => {
    socketRef.current?.off("receiveMessage", callback);
  };

  const onSentACK = (callback: (ack: DirectSentAck) => void) => {
    socketRef.current?.on("message-sent-ack", callback);
  };

  const onDeliveredACK = (callback: (ack: DirectDeliveredAck) => void) => {
    socketRef.current?.on("message-delivered-ack", callback);
  };

  const onSeenACK = (callback: (ack: { messageId: string }) => void) => {
    socketRef.current?.on("message-seen-ack", callback);
  };

  const onNotification = (callback: (message: IMessage) => void) => {
    socketRef.current?.on("new-message-notification", callback);
  };

  const offNotification = (callback: (message: IMessage) => void) => {
    socketRef.current?.off("new-message-notification", callback);
  };

  const onGroupMessage = (callback: (message: IGroupMessage) => void) => {
    socketRef.current?.on("receive-group-message", callback);
  };

  const offGroupMessage = (callback: (message: IGroupMessage) => void) => {
    socketRef.current?.off("receive-group-message", callback);
  };

  const onGroupSentACK = (callback: (ack: GroupSentAck) => void) => {
    socketRef.current?.on("group-message-sent-ack", callback);
  };

  const offGroupSentACK = (callback: (ack: GroupSentAck) => void) => {
    socketRef.current?.off("group-message-sent-ack", callback);
  };

  const onGroupDeliveredACK = (callback: (ack: GroupReceiptAck) => void) => {
    socketRef.current?.on("group-message-delivered-ack", callback);
  };

  const offGroupDeliveredACK = (callback: (ack: GroupReceiptAck) => void) => {
    socketRef.current?.off("group-message-delivered-ack", callback);
  };

  const onGroupSeenACK = (callback: (ack: GroupReceiptAck) => void) => {
    socketRef.current?.on("group-message-seen-ack", callback);
  };

  const offGroupSeenACK = (callback: (ack: GroupReceiptAck) => void) => {
    socketRef.current?.off("group-message-seen-ack", callback);
  };

  const onGroupNotification = (callback: (message: IGroupMessage) => void) => {
    socketRef.current?.on("new-group-message-notification", callback);
  };

  const offGroupNotification = (callback: (message: IGroupMessage) => void) => {
    socketRef.current?.off("new-group-message-notification", callback);
  };

  const disconnectSocket = () => {
    socketRef.current?.disconnect();
    socketInstance = null;
  };

  return {
    socketRef,
    sendMessage,
    messageSeen,
    joinRoom,
    leaveRoom,
    onMessage,
    offMessage,
    onSentACK,
    onDeliveredACK,
    onSeenACK,
    onNotification,
    offNotification,
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

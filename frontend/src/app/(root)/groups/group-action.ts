import { AttachmentType, IAttachment } from "../chats/action";

import { AxiosResponse } from "axios";
import ServerEndpoint from "@/lib/server-endpoint";
import { handleError } from "@/app/constants";

export interface IGroupUser {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  userPfpUrl?: string | null;
  isActive?: boolean;
  lastSeen?: Date | null;
}

export type GroupFilter = "all" | "unread";
export type GroupMemberRole = "OWNER" | "ADMIN" | "MEMBER";
export type GroupMessageStatus = "pending" | "sent" | "delivered" | "seen";

export interface IGroupReceiptSummary {
  totalRecipients: number;
  deliveredCount: number;
  seenCount: number;
  status: Exclude<GroupMessageStatus, "pending">;
}

export interface IGroupMessage {
  id: string;
  tempId?: string;
  message: string;
  groupId: string;
  senderId: string | null;
  sid?: string | null;
  sender: IGroupUser | null;
  attachments: IAttachment[];
  status: GroupMessageStatus;
  receiptSummary: IGroupReceiptSummary;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface IGroupListItem {
  id: string;
  type: "group";
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  creatorId?: string | null;
  memberCount: number;
  lastMessage?: string | null;
  lastMessageDate?: Date | null;
  lastMessageSenderId?: string | null;
  lastMessageSender?: IGroupUser | null;
  unreadMessages: Array<{
    id: string;
    groupId: string;
    senderId: string | null;
    message: string;
    createdAt: Date;
  }>;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGroupHeader {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  creatorId?: string | null;
  memberCount: number;
  currentMemberRole: GroupMemberRole;
  lastMessage?: string | null;
  lastMessageDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: GroupMemberRole;
  joinedAt: Date;
  user: IGroupUser;
}

export interface IGroupInfo {
  group: IGroupHeader;
  members: IGroupMember[];
  media: { url: string; type: AttachmentType }[];
  links: { url: string; name: string }[];
}

export interface IGroupAndMessages {
  totalPages: number;
  pageIndex: number;
  limit: number;
  groupMessages: IGroupMessage[];
  group: IGroupHeader;
}

export interface ICreateGroupPayload {
  name: string;
  description?: string;
  imageUrl?: string;
  memberIds: string[];
}

export interface IUpdateGroupPayload {
  name?: string;
  description?: string;
  imageUrl?: string;
}

interface IApiResponse<T> {
  message: string;
  data: T;
}

export async function CreateGroup(payload: ICreateGroupPayload) {
  try {
    const res: AxiosResponse<IApiResponse<IGroupHeader>> =
      await ServerEndpoint.post("groups", payload, {
        withCredentials: true,
      });

    return res.data.data;
  } catch (error) {
    handleError(error);
  }
}

export async function GetAvailableGroupUsers(query: string = "") {
  try {
    const res: AxiosResponse<IApiResponse<IGroupUser[]>> =
      await ServerEndpoint.get("groups/available-users", {
        params: {
          query: query.trim(),
        },
        withCredentials: true,
      });

    return res.data.data ?? [];
  } catch (error) {
    handleError(error);
    return [];
  }
}

export async function GetGroupList(query = "", filter: GroupFilter = "all") {
  try {
    const res: AxiosResponse<IApiResponse<IGroupListItem[]>> =
      await ServerEndpoint.get("groups", {
        params: { query: query.trim(), filter },
        withCredentials: true,
      });

    return res.data.data ?? [];
  } catch (error) {
    handleError(error);
    return [];
  }
}

export async function GetGroupAndMessages(
  groupId: string,
  limit = 50,
  page = 1,
) {
  try {
    const res: AxiosResponse<IApiResponse<IGroupAndMessages>> =
      await ServerEndpoint.get(`groups/${groupId}/messages`, {
        params: { limit, page },
        withCredentials: true,
      });

    return res.data.data;
  } catch (error) {
    handleError(error);
  }
}

export async function GetGroupInfo(groupId: string) {
  try {
    const res: AxiosResponse<IApiResponse<IGroupInfo>> =
      await ServerEndpoint.get(`groups/${groupId}/info`, {
        withCredentials: true,
      });

    return res.data.data;
  } catch (error) {
    handleError(error);
  }
}

export async function UpdateGroup(
  groupId: string,
  payload: IUpdateGroupPayload,
) {
  try {
    const res: AxiosResponse<IApiResponse<IGroupHeader>> =
      await ServerEndpoint.put(`groups/${groupId}`, payload, {
        withCredentials: true,
      });

    return res.data.data;
  } catch (error) {
    handleError(error);
  }
}

export async function AddGroupMembers(groupId: string, memberIds: string[]) {
  try {
    const res = await ServerEndpoint.post(
      `groups/${groupId}/members`,
      { memberIds },
      { withCredentials: true },
    );

    return res.data;
  } catch (error) {
    handleError(error);
  }
}

export async function RemoveGroupMember(groupId: string, memberUserId: string) {
  try {
    const res = await ServerEndpoint.delete(
      `groups/${groupId}/members/${memberUserId}`,
      { withCredentials: true },
    );

    return res.data;
  } catch (error) {
    handleError(error);
  }
}

export async function UpdateGroupMemberRole(
  groupId: string,
  memberUserId: string,
  role: GroupMemberRole,
) {
  try {
    const res = await ServerEndpoint.put(
      `groups/${groupId}/members/${memberUserId}/role`,
      { role },
      { withCredentials: true },
    );

    return res.data;
  } catch (error) {
    handleError(error);
  }
}

export async function LeaveGroup(groupId: string) {
  try {
    const res = await ServerEndpoint.post(
      `groups/${groupId}/leave`,
      {},
      { withCredentials: true },
    );

    return res.data;
  } catch (error) {
    handleError(error);
  }
}

export async function DeleteGroup(groupId: string) {
  try {
    const res = await ServerEndpoint.delete(`groups/${groupId}`, {
      withCredentials: true,
    });

    return res.data;
  } catch (error) {
    handleError(error);
  }
}

export async function UpdateGroupMessage(messageId: string, message: string) {
  try {
    const res = await ServerEndpoint.put(
      `groups/messages/${messageId}`,
      { message },
      { withCredentials: true },
    );

    return res.data;
  } catch (error) {
    handleError(error);
  }
}

export async function DeleteGroupMessage(messageId: string) {
  try {
    const res = await ServerEndpoint.delete(`groups/messages/${messageId}`, {
      withCredentials: true,
    });

    return res.data;
  } catch (error) {
    handleError(error);
  }
}

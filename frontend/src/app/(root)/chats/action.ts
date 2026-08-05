import { AxiosResponse } from "axios";
import { DiscoverPost } from "../discover/types";
import { IUser } from "@/app/auth/actions";
import ServerEndpoint from "@/lib/server-endpoint";
import { handleError } from "@/app/constants";

export interface IChatRoom {
  id: string;
  recId: string;
  recUsername: string;
  recFirstname: string;
  recLastname: string;
  recUserPfpUrl: string;
  recBio?: string;
  messages?: IMessage[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  lastMessage?: string | null;
  lastMessageDate?: Date | null;
  unreadMessages: IMessage[];
  recIsActive: boolean;
  recLastSeen: string | null;
  name?: string | null;
}

export interface IMessage {
  id: string;
  message: string;
  chatRoom: IChatRoom;
  chatroomId: string;
  sender: IUser | null;
  sid: string | null;
  createdAt: Date;
  deletedAt?: Date | null;
  updatedAt: Date;
  attachments?: IAttachment[];
  sharedPostId: string | null;
  sharedPost: DiscoverPost | null;
  status: "pending" | "sent" | "delivered" | "seen";
  tempId?: string;
}

export interface ITempMessage {
  id: string;
  message: string;
  chatRoom: IChatRoom;
  chatroomId: string;
  sender: IUser | null;
  sid: string | null;
  createdAt: Date;
  deletedAt?: Date | null;
  updatedAt: Date;

  sharedPostId: string | null;
  sharedPost: DiscoverPost | null;

  attachments?: IAttachment[];
  status: "pending" | "sent" | "delivered" | "seen";
  tempId?: string;
}

export interface IAttachment {
  key?: string;
  type?: AttachmentType;
  size?: number;
  id?: string;
  url?: string;
}

export enum AttachmentType {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  AUDIO = "AUDIO",
  DOCUMENT = "DOCUMENT",
  FILE = "FILE",
}

interface IPluralResponse {
  message: string;
  data?: IChatRoom[];
}

interface IChatroomAndMessagesResponse {
  message: string;
  data?: {
    totalPages: number;
    pageIndex: number;
    limit: number;
    chatRoomMessages: IMessage[];
    chatroom: IChatRoom;
  };
}

interface IChatroomInfoResponse {
  message: string;
  data?: {
    chatroom: IChatRoom;
    media: { url: string; type: AttachmentType }[];
    links: { url: string; name: string }[];
  };
}

interface IUploadMessageAttachmentsResponse {
  message: string;
  files: IAttachment[];
}

export type ChatroomFilter = "all" | "unread";

export async function GetChatList(
  query: string = "",
  filter: ChatroomFilter = "all",
) {
  try {
    const res: AxiosResponse<IPluralResponse> = await ServerEndpoint.get(
      "chat/rooms",
      {
        params: {
          query: query.trim(),
          filter,
        },
        withCredentials: true,
      },
    );

    if (res.status !== 200) {
      throw new Error(
        res.data.message ||
          "Something went wrong while retrieving your chat rooms",
      );
    }

    return res.data.data;
  } catch (error) {
    handleError(error);
    return [];
  }
}

export async function GetChatroomAndMesseges(
  crid: string,
  limit: number = 50,
  page: number = 1,
) {
  try {
    const res: AxiosResponse<IChatroomAndMessagesResponse> =
      await ServerEndpoint.get(
        `chat/room/${crid}?limit=${limit}&page=${page}`,
        {
          withCredentials: true,
        },
      );

    if (res.status !== 200)
      throw new Error(
        res.data.message ||
          "Something went wrong while retreiving your chatroom and messages",
      );

    return res.data.data;
  } catch (error) {
    handleError(error);
  }
}

export async function GetChatroomInfo(crid: string) {
  try {
    const res: AxiosResponse<IChatroomInfoResponse> = await ServerEndpoint.get(
      `chat/room/info/${crid}`,
      {
        withCredentials: true,
      },
    );

    if (res.status !== 200)
      throw new Error(
        res.data.message ||
          "Something went wrong while retreiving your chatroom info",
      );

    return res.data.data;
  } catch (error) {
    handleError(error);
  }
}

export async function UploadMessageAttachments(formData: FormData) {
  try {
    const res: AxiosResponse<IUploadMessageAttachmentsResponse> =
      await ServerEndpoint.post(`/s3/upload/messages`, formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

    if (res.status !== 201)
      throw new Error(
        res.data.message ||
          "Something went wrong while uploading message attachments to cloud",
      );

    return res.data.files;
  } catch (error) {
    handleError(error);
  }
}

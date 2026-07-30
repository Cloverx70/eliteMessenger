import { AttachmentType } from "../chats/action";
import { AxiosResponse } from "axios";
import ServerEndpoint from "@/lib/server-endpoint";
import { handleError } from "@/app/constants";

export enum MediaSources {
  ALLMEDIA = "ALL",
  CHATS = "CHATS",
  GROUPCHATS = "GROUPCHATS",
}

export interface IMediaUser {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  userPfpUrl: string | null;
}

export interface IChatMediaMessage {
  id: string;
  sid: string;
  chatroomId: string;
  createdAt: string;
  sender: IMediaUser;
}

export interface IGroupMediaMessage {
  id: string;
  senderId: string;
  groupId: string;
  createdAt: string;
  sender: IMediaUser;
}

export interface IBaseMediaAttachment {
  id: string;

  // Signed S3 URLs returned by the backend.
  url: string;
  blurUrl?: string;

  type: AttachmentType;
  filename?: string | null;
  size?: number | null;
  createdAt: string;
}

export interface IMessageAttachment extends IBaseMediaAttachment {
  message: IChatMediaMessage;
}

export interface IGroupMessageAttachment extends IBaseMediaAttachment {
  message: IGroupMediaMessage;
}

export interface IPaginatedMedia<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface IGetMediaResponse {
  message: string;
  code: number;
  data: {
    chats?: IPaginatedMedia<IMessageAttachment>;

    groupchats?: IPaginatedMedia<IGroupMessageAttachment>;
  };
}

export interface IGetAttachmentResponse {
  message: string;
  code: number;
  data: IMessageAttachment | IGroupMessageAttachment;
}

export interface IGetMediaParams {
  source?: MediaSources;
  page?: number;
  limit?: number;
  senderId?: string;
  mediaType?: AttachmentType;
}

export interface MediaOptions {
  page?: number;
  limit?: number;
  mediaType?: string;
  senderId?: string;
}

export async function GetAllMedia(MediaSource?: MediaSources) {
  try {
    const res: AxiosResponse<IGetMediaResponse> = await ServerEndpoint.get(
      `media/all-media?source=${MediaSource ?? MediaSources.ALLMEDIA}`,
      { withCredentials: true },
    );

    if (res.status !== 200)
      throw new Error(
        res.data.message || "Something went wrong while retreiving all media",
      );

    return res.data.data;
  } catch (error) {
    handleError(error);
  }
}

export async function GetAttachmentById(
  aid: string,
  mediaSource: MediaSources,
): Promise<IGetAttachmentResponse["data"] | undefined> {
  try {
    const res = await ServerEndpoint.get<IGetAttachmentResponse>(
      `media/get/${aid}`,
      {
        withCredentials: true,
        params: {
          source: mediaSource,
        },
      },
    );

    if (res.status !== 200) {
      throw new Error(
        res.data.message || "Something went wrong while retrieving attachment",
      );
    }

    return res.data.data;
  } catch (error) {
    handleError(error);
  }
}

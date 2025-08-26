import { IUser } from "@/app/auth/actions";
import { handleError } from "@/app/constants";
import ServerEndpoint from "@/lib/server-endpoint";
import { AxiosResponse } from "axios";

interface IChatRoom {
  id: string;
  recId: string;
  recUsername: string;
  recFirstname: string;
  recLastname: string;
  recUserPfpUrl: string;
  messages: IMessage[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  lastMessage?: string | null;
  lastMessageDate?: Date | null;
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

export async function GetChatList() {
  try {
    const res: AxiosResponse<IPluralResponse> = await ServerEndpoint.get(
      `chat/rooms`,
      {
        withCredentials: true,
      }
    );

    if (res.status !== 200)
      throw new Error(
        res.data.message ||
          "Something went wrong while retreiving your chat rooms"
      );

    return res.data.data;
  } catch (error) {
    handleError(error);
  }
}

export async function GetChatroomAndMesseges(
  crid: string,
  limit: number = 50,
  page: number = 1
) {
  try {
    const res: AxiosResponse<IChatroomAndMessagesResponse> =
      await ServerEndpoint.get(
        `chat/room/${crid}?limit=${limit}&page=${page}`,
        {
          withCredentials: true,
        }
      );

    if (res.status !== 200)
      throw new Error(
        res.data.message ||
          "Something went wrong while retreiving your chatroom and messages"
      );

    return res.data.data;
  } catch (error) {
    handleError(error);
  }
}

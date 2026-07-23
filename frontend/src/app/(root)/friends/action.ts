import { IUser, UserResponse } from "@/app/auth/actions";

import { AxiosResponse } from "axios";
import ServerEndpoint from "@/lib/server-endpoint";
import { handleError } from "@/app/constants";

enum FriendStatus {
  ONGOING = "ongoing",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
}

interface IFriendRequest {
  id: string;
  user1: IUser;
  user2: IUser;
  status: FriendStatus;
  ongoingDate: Date;
  acceptedDate: Date | null;
}

export interface Response {
  message: string;
  data?: IUser;
}

export interface AllResponse {
  message: string;
  data?: IUser[];
}

export interface RequestsResponse {
  message: string;
  data?: IFriendRequest[];
}

interface IRequest {
  requestId: string;
  status: FriendStatus;
  ongoingDate: Date;
  acceptedDate: Date | null;
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  userPfpUrl: string;
}

export interface IRequests {
  message: string;
  data?: IRequest[];
}

export async function GetPeopleYouMayKnow(query?: string) {
  try {
    const res: AxiosResponse<AllResponse> = await ServerEndpoint.get(
      `friends/people-you-may-know?q=${query ?? ""}`,
      { withCredentials: true },
    );

    if (res.status !== 200)
      throw new Error(
        res.data.message ||
          "Something went wrong while retreiving people you may know",
      );

    return res.data.data;
  } catch (error) {
    handleError(error);
  }
}

export async function GetSuggestedUsers() {
  try {
    const res: AxiosResponse<AllResponse> = await ServerEndpoint.get(
      "friends/suggested-users",
      { withCredentials: true },
    );

    if (res.status !== 200)
      throw new Error(
        res.data.message ||
          "Something went wrong while retreiving suggested users",
      );

    return res.data.data;
  } catch (error) {
    handleError(error);
  }
}

export async function GetReceivedRequests() {
  try {
    const res: AxiosResponse<IRequests> = await ServerEndpoint.get(
      "friends/received-requests",
      { withCredentials: true },
    );

    if (res.status !== 200)
      throw new Error(
        res.data.message ||
          "Something went wrong while retreiving received requests",
      );

    return res.data;
  } catch (error) {
    handleError(error);
  }
}

export async function GetOngoingRequests() {
  try {
    const res: AxiosResponse<IRequests> = await ServerEndpoint.get(
      "friends/sent-requests",
      { withCredentials: true },
    );

    if (res.status !== 200)
      throw new Error(
        res.data.message ||
          "Something went wrong while retreiving sent requests",
      );

    return res.data?.data;
  } catch (error) {
    handleError(error);
  }
}

export async function GetYourFriends() {
  try {
    const res: AxiosResponse<IRequests> = await ServerEndpoint.get(
      "friends/list",
      { withCredentials: true },
    );

    if (res.status !== 200)
      throw new Error(
        res.data.message ||
          "Something went wrong while retreiving your friends",
      );

    return res.data.data;
  } catch (error) {
    handleError(error);
  }
}

export async function GetUserSearch(
  query: string,
  limit: number,
  page: number,
) {
  try {
    const res: AxiosResponse<UserResponse> = await ServerEndpoint.get(
      `friends/search?query=${query}&limit=${limit}&page=${page}`,
      { withCredentials: true },
    );

    if (res.status !== 200)
      throw new Error(
        res.data.message ||
          "Something went wrong while retreiving your friends",
      );

    return res.data.data;
  } catch (error) {
    handleError(error);
  }
}

export async function SendFriendRequest(rid: string) {
  try {
    const res: AxiosResponse<AllResponse> = await ServerEndpoint.post(
      `friends/request/${rid}`,
      { withCredentials: true },
    );

    if (res.status !== 200)
      throw new Error(
        res.data.message || "Something went wrong while sending the request",
      );
  } catch (error) {
    handleError(error);
  }
}

export async function CancelOngoingRequest(rid: string) {
  try {
    const res: AxiosResponse<AllResponse> = await ServerEndpoint.delete(
      `friends/cancel-ongoing/${rid}`,
      { withCredentials: true },
    );

    if (res.status !== 200)
      throw new Error(
        res.data.message || "Something went wrong while cancelling the request",
      );
  } catch (error) {
    handleError(error);
  }
}

export async function DeclineOngoingRequest(rid: string) {
  try {
    const res: AxiosResponse<AllResponse> = await ServerEndpoint.delete(
      `friends/cancel-ongoing/${rid}`,
      { withCredentials: true },
    );

    if (res.status !== 200)
      throw new Error(
        res.data.message || "Something went wrong while cancelling the request",
      );
  } catch (error) {
    handleError(error);
  }
}

export async function ManageRequest(
  requestId: string,
  status: "ongoing" | "accepted" | "declined",
) {
  try {
    const res: AxiosResponse<AllResponse> = await ServerEndpoint.put(
      `friends/manage-req`,
      { requestId, status },
      { withCredentials: true },
    );

    if (res.status !== 200)
      throw new Error(
        res.data.message || "Something went wrong while managing the request",
      );
  } catch (error) {
    handleError(error);
  }
}

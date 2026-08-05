import {
  NotificationDetail,
  NotificationListParams,
  NotificationPage,
} from "./types";

import { AxiosResponse } from "axios";
import ServerEndpoint from "@/lib/server-endpoint";
import { handleError } from "@/app/constants";

export interface IApiResponse<T> {
  message: string;
  code: number;
  data: T;
}

export interface IUnreadNotificationCount {
  count: number;
}

export interface IMarkAllNotificationsReadResult {
  updatedCount: number;
}

export interface IDeleteNotificationResult {
  notificationId: string;
}

function assertSuccessfulResponse<T>(
  response: AxiosResponse<IApiResponse<T>>,
  fallbackMessage: string,
): IApiResponse<T> {
  if (response.status < 200 || response.status >= 300) {
    throw new Error(response.data?.message || fallbackMessage);
  }

  if (!response.data) {
    throw new Error(fallbackMessage);
  }

  if (typeof response.data.code !== "number") {
    throw new Error("The server returned an invalid response");
  }

  return response.data;
}

export async function getNotifications(
  params: NotificationListParams & {
    cursor?: string;
  },
): Promise<NotificationPage> {
  try {
    const response: AxiosResponse<IApiResponse<NotificationPage>> =
      await ServerEndpoint.get("/notifications", {
        withCredentials: true,
        params: {
          filter: params.filter,
          search: params.search?.trim() || undefined,
          cursor: params.cursor?.trim() || undefined,
          limit: params.limit ?? 20,
        },
      });

    return assertSuccessfulResponse(
      response,
      "Something went wrong while retrieving notifications",
    ).data;
  } catch (error: unknown) {
    handleError(error);
    throw error;
  }
}

export async function getNotificationDetail(
  notificationId: string,
): Promise<NotificationDetail> {
  try {
    if (!notificationId?.trim()) {
      throw new Error("Notification ID is required");
    }

    const response: AxiosResponse<IApiResponse<NotificationDetail>> =
      await ServerEndpoint.get(`/notifications/${notificationId}`, {
        withCredentials: true,
      });

    return assertSuccessfulResponse(
      response,
      "Something went wrong while retrieving the notification",
    ).data;
  } catch (error: unknown) {
    handleError(error);
    throw error;
  }
}

export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const response: AxiosResponse<IApiResponse<IUnreadNotificationCount>> =
      await ServerEndpoint.get("/notifications/unread-count", {
        withCredentials: true,
      });

    const result = assertSuccessfulResponse(
      response,
      "Something went wrong while retrieving the unread count",
    ).data;

    if (typeof result.count !== "number") {
      throw new Error("The server returned an invalid unread count");
    }

    return result.count;
  } catch (error: unknown) {
    handleError(error);
    throw error;
  }
}

export async function markNotificationRead(
  notificationId: string,
): Promise<NotificationDetail> {
  try {
    if (!notificationId?.trim()) {
      throw new Error("Notification ID is required");
    }

    const response: AxiosResponse<IApiResponse<NotificationDetail>> =
      await ServerEndpoint.patch(
        `/notifications/${notificationId}/read`,
        undefined,
        {
          withCredentials: true,
        },
      );

    return assertSuccessfulResponse(
      response,
      "Something went wrong while marking the notification as read",
    ).data;
  } catch (error: unknown) {
    handleError(error);
    throw error;
  }
}

export async function markAllNotificationsRead(): Promise<IMarkAllNotificationsReadResult> {
  try {
    const response: AxiosResponse<
      IApiResponse<IMarkAllNotificationsReadResult>
    > = await ServerEndpoint.patch("/notifications/read-all", undefined, {
      withCredentials: true,
    });

    return assertSuccessfulResponse(
      response,
      "Something went wrong while marking all notifications as read",
    ).data;
  } catch (error: unknown) {
    handleError(error);
    throw error;
  }
}

export async function deleteNotification(
  notificationId: string,
): Promise<IDeleteNotificationResult> {
  try {
    if (!notificationId?.trim()) {
      throw new Error("Notification ID is required");
    }

    const response: AxiosResponse<IApiResponse<IDeleteNotificationResult>> =
      await ServerEndpoint.delete(`/notifications/${notificationId}`, {
        withCredentials: true,
      });

    return assertSuccessfulResponse(
      response,
      "Something went wrong while deleting the notification",
    ).data;
  } catch (error: unknown) {
    handleError(error);
    throw error;
  }
}

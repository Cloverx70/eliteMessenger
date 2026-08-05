"use client";

import { DeclineOngoingRequest, ManageRequest } from "../(root)/friends/action";
import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  NotificationDetail,
  NotificationItem,
  NotificationListParams,
  NotificationPage,
} from "../(root)/notifications/types";
import {
  deleteNotification,
  getNotificationDetail,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../(root)/notifications/action";

export const notificationKeys = {
  all: ["NOTIFICATIONS"] as const,

  lists: ["NOTIFICATIONS", "LIST"] as const,

  list: (params: NotificationListParams) =>
    ["NOTIFICATIONS", "LIST", params] as const,

  detail: (notificationId: string) =>
    ["NOTIFICATIONS", "DETAIL", notificationId] as const,

  unreadCount: ["NOTIFICATIONS", "UNREAD_COUNT"] as const,
};

export function useNotifications(params: NotificationListParams) {
  return useInfiniteQuery({
    queryKey: notificationKeys.list(params),

    initialPageParam: undefined as string | undefined,

    queryFn: ({ pageParam }) =>
      getNotifications({
        ...params,
        cursor: pageParam,
      }),

    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useNotificationDetail(notificationId: string | null) {
  return useQuery({
    queryKey: notificationKeys.detail(notificationId ?? "none"),

    queryFn: () => getNotificationDetail(notificationId!),

    enabled: Boolean(notificationId),
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount,

    queryFn: getUnreadNotificationCount,

    refetchInterval: 30_000,
  });
}

function patchNotificationInLists(
  data: InfiniteData<NotificationPage> | undefined,
  notificationId: string,
  updater: (notification: NotificationItem) => NotificationItem | null,
) {
  if (!data) {
    return data;
  }

  return {
    ...data,

    pages: data.pages.map((page) => ({
      ...page,

      items: page.items
        .map((notification) =>
          notification.id === notificationId
            ? updater(notification)
            : notification,
        )
        .filter(
          (notification): notification is NotificationItem =>
            notification !== null,
        ),
    })),
  };
}

export function useNotificationActions() {
  const queryClient = useQueryClient();

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,

    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({
        queryKey: notificationKeys.all,
      });

      const previousCount = queryClient.getQueryData<number>(
        notificationKeys.unreadCount,
      );

      let wasUnread = false;

      queryClient.setQueriesData<InfiniteData<NotificationPage>>(
        {
          queryKey: notificationKeys.lists,
        },

        (current) =>
          patchNotificationInLists(current, notificationId, (notification) => {
            wasUnread = !notification.isRead;

            return {
              ...notification,
              isRead: true,
              readAt: new Date().toISOString(),
            };
          }),
      );

      queryClient.setQueryData<NotificationDetail>(
        notificationKeys.detail(notificationId),

        (current) =>
          current
            ? {
                ...current,
                isRead: true,
                readAt: new Date().toISOString(),
              }
            : current,
      );

      if (wasUnread) {
        queryClient.setQueryData<number>(
          notificationKeys.unreadCount,

          (count = 0) => Math.max(count - 1, 0),
        );
      }

      return {
        previousCount,
      };
    },

    onError: (_error, _notificationId, context) => {
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(
          notificationKeys.unreadCount,
          context.previousCount,
        );
      }

      void queryClient.invalidateQueries({
        queryKey: notificationKeys.all,
      });
    },

    onSuccess: (notification) => {
      queryClient.setQueryData(
        notificationKeys.detail(notification.id),
        notification,
      );
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,

    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: notificationKeys.all,
      });

      queryClient.setQueriesData<InfiniteData<NotificationPage>>(
        {
          queryKey: notificationKeys.lists,
        },

        (current) => {
          if (!current) {
            return current;
          }

          const readAt = new Date().toISOString();

          return {
            ...current,

            pages: current.pages.map((page) => ({
              ...page,

              items: page.items.map((notification) => ({
                ...notification,
                isRead: true,
                readAt,
              })),
            })),
          };
        },
      );

      queryClient.setQueryData(notificationKeys.unreadCount, 0);
    },

    onError: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationKeys.all,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,

    onSuccess: (_data, notificationId) => {
      queryClient.setQueriesData<InfiniteData<NotificationPage>>(
        {
          queryKey: notificationKeys.lists,
        },

        (current) =>
          patchNotificationInLists(current, notificationId, () => null),
      );

      queryClient.removeQueries({
        queryKey: notificationKeys.detail(notificationId),
      });

      void queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount,
      });
    },
  });

  const acceptFriendRequestMutation = useMutation({
    mutationFn: (rid: string) => ManageRequest(rid, "accepted"),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationKeys.all,
      });
    },
  });

  const declineFriendRequestMutation = useMutation({
    mutationFn: (recId: string) => DeclineOngoingRequest(recId),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationKeys.all,
      });
    },
  });

  return {
    markReadMutation,
    markAllMutation,
    deleteMutation,

    acceptFriendRequestMutation,
    declineFriendRequestMutation,
  };
}

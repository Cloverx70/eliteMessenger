"use client";

import { FiBell, FiCheckCircle, FiSearch, FiSliders } from "react-icons/fi";
import { NotificationFilter, NotificationItem } from "../types";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  useNotificationActions,
  useNotificationDetail,
  useNotifications,
  useUnreadNotificationCount,
} from "../../../hooks/use-notifications";

import { NotificationDetailPanel } from "./notification-detail-panel";
import { NotificationEmpty } from "./notification-empty";
import { NotificationList } from "./notification-list";
import { NotificationSkeleton } from "./notification-skeleton";
import { NotificationTabs } from "./notification-tabs";

export function NotificationsShell() {
  const [filter, setFilter] = useState<NotificationFilter>("ALL");

  const [search, setSearch] = useState("");

  const deferredSearch = useDeferredValue(search);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const listQuery = useNotifications({
    filter,
    search: deferredSearch.trim() || undefined,
    limit: 20,
  });

  const detailQuery = useNotificationDetail(selectedId);

  const unreadCountQuery = useUnreadNotificationCount();

  const {
    markReadMutation,
    markAllMutation,
    deleteMutation,

    acceptFriendRequestMutation,
    declineFriendRequestMutation,
  } = useNotificationActions();

  const notifications = useMemo(
    () => listQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [listQuery.data],
  );

  useEffect(() => {
    const isDesktop = window.matchMedia("(min-width: 1280px)").matches;

    if (isDesktop && !selectedId && notifications.length > 0) {
      setSelectedId(notifications[0].id);
    }
  }, [notifications, selectedId]);

  const acceptingNotificationId =
    notifications.find(
      (notification) =>
        notification.entityId === acceptFriendRequestMutation.variables,
    )?.id ?? null;

  const decliningNotificationId =
    notifications.find(
      (notification) =>
        notification.entityId === declineFriendRequestMutation.variables,
    )?.id ?? null;

  const selectNotification = (notification: NotificationItem) => {
    setSelectedId(notification.id);

    if (!notification.isRead) {
      markReadMutation.mutate(notification.id);
    }
  };

  const acceptFriendRequest = (notification: NotificationItem) => {
    if (!notification.entityId) {
      return;
    }

    acceptFriendRequestMutation.mutate(notification.entityId, {
      onSuccess: () => {
        deleteMutation.mutate(notification.id, {
          onSuccess: () => {
            if (selectedId === notification.id) {
              setSelectedId(null);
            }
          },
        });
      },
    });
  };

  const declineFriendRequest = (notification: NotificationItem) => {
    if (!notification.entityId) {
      return;
    }

    declineFriendRequestMutation.mutate(notification.entityId, {
      onSuccess: () => {
        deleteMutation.mutate(notification.id, {
          onSuccess: () => {
            if (selectedId === notification.id) {
              setSelectedId(null);
            }
          },
        });
      },
    });
  };

  const detail = detailQuery.data ?? null;

  return (
    <section className="min-w-0 flex-1 bg-[#fbfbfe]">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-xl text-violet-700 lg:hidden">
                <FiBell />
              </div>

              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">
                  Notifications
                </h1>

                <p className="mt-2 text-sm text-slate-500 sm:text-base">
                  Stay updated with everything that matters.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm lg:w-[400px]">
              <FiSearch className="shrink-0 text-slate-400" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search notifications..."
                className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </label>

            <button
              type="button"
              aria-label="Notification preferences"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-violet-200 hover:text-violet-700"
            >
              <FiSliders />
            </button>
          </div>
        </header>

        <div className="mt-7 overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-4 py-4 sm:px-5 lg:flex-row lg:items-center">
            <NotificationTabs
              activeFilter={filter}
              unreadCount={unreadCountQuery.data ?? 0}
              onChange={(nextFilter) => {
                setFilter(nextFilter);
                setSelectedId(null);
              }}
            />

            <button
              type="button"
              disabled={
                markAllMutation.isPending || (unreadCountQuery.data ?? 0) === 0
              }
              onClick={() => markAllMutation.mutate()}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FiCheckCircle />
              Mark all as read
            </button>
          </div>

          <div className="grid min-h-[680px] grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px]">
            <main className="min-w-0">
              {listQuery.isLoading ? (
                <NotificationSkeleton />
              ) : notifications.length === 0 ? (
                <NotificationEmpty />
              ) : (
                <>
                  <NotificationList
                    notifications={notifications}
                    selectedId={selectedId}
                    acceptingId={
                      acceptFriendRequestMutation.isPending
                        ? acceptingNotificationId
                        : null
                    }
                    decliningId={
                      declineFriendRequestMutation.isPending
                        ? decliningNotificationId
                        : null
                    }
                    onSelect={selectNotification}
                    onAccept={acceptFriendRequest}
                    onDecline={declineFriendRequest}
                  />

                  {listQuery.hasNextPage ? (
                    <div className="flex justify-center px-5 py-6">
                      <button
                        type="button"
                        disabled={listQuery.isFetchingNextPage}
                        onClick={() => listQuery.fetchNextPage()}
                        className="h-11 rounded-xl border border-slate-200 px-6 text-sm font-bold text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {listQuery.isFetchingNextPage
                          ? "Loading..."
                          : "Load more"}
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </main>

            <div className="hidden xl:block">
              <NotificationDetailPanel
                notification={detail}
                loading={detailQuery.isLoading}
                accepting={acceptFriendRequestMutation.isPending}
                declining={declineFriendRequestMutation.isPending}
                deleting={deleteMutation.isPending}
                onAccept={() => {
                  if (detail) {
                    acceptFriendRequest(detail);
                  }
                }}
                onDecline={() => {
                  if (detail) {
                    declineFriendRequest(detail);
                  }
                }}
                onDelete={() => {
                  if (!detail) {
                    return;
                  }

                  deleteMutation.mutate(detail.id, {
                    onSuccess: () => setSelectedId(null),
                  });
                }}
                onClose={() => setSelectedId(null)}
              />
            </div>
          </div>
        </div>

        {selectedId ? (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/30 p-3 backdrop-blur-sm xl:hidden">
            <div className="ml-auto min-h-full w-full max-w-md overflow-hidden rounded-[26px] bg-white shadow-2xl">
              <NotificationDetailPanel
                notification={detail}
                loading={detailQuery.isLoading}
                accepting={acceptFriendRequestMutation.isPending}
                declining={declineFriendRequestMutation.isPending}
                deleting={deleteMutation.isPending}
                onAccept={() => {
                  if (detail) {
                    acceptFriendRequest(detail);
                  }
                }}
                onDecline={() => {
                  if (detail) {
                    declineFriendRequest(detail);
                  }
                }}
                onDelete={() => {
                  if (!detail) {
                    return;
                  }

                  deleteMutation.mutate(detail.id, {
                    onSuccess: () => setSelectedId(null),
                  });
                }}
                onClose={() => setSelectedId(null)}
              />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

"use client";

import {
  FiArrowLeft,
  FiCheck,
  FiExternalLink,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import {
  formatNotificationTime,
  getNotificationCopy,
} from "./notification-display";

import { NotificationAvatar } from "./notification-avatar";
import { NotificationDetail } from "../types";
import { useRouter } from "next/navigation";

interface NotificationDetailPanelProps {
  notification: NotificationDetail | null;

  loading: boolean;

  accepting: boolean;
  declining: boolean;
  deleting: boolean;

  onAccept: () => void;
  onDecline: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function NotificationDetailPanel({
  notification,
  loading,
  accepting,
  declining,
  deleting,
  onAccept,
  onDecline,
  onDelete,
  onClose,
}: NotificationDetailPanelProps) {
  const router = useRouter();

  if (loading) {
    return (
      <aside className="min-h-[660px] animate-pulse border-l border-slate-100 p-6">
        <div className="h-4 w-24 rounded bg-slate-100" />
        <div className="mx-auto mt-10 h-24 w-24 rounded-full bg-slate-200" />
        <div className="mx-auto mt-6 h-5 w-2/3 rounded bg-slate-200" />
        <div className="mx-auto mt-3 h-4 w-1/3 rounded bg-slate-100" />
      </aside>
    );
  }

  if (!notification) {
    return (
      <aside className="hidden min-h-[660px] items-center justify-center border-l border-slate-100 p-8 text-center xl:flex">
        <div>
          <p className="text-lg font-bold text-slate-900">
            Select a notification
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Open an activity item to see its details and available actions.
          </p>
        </div>
      </aside>
    );
  }

  const copy = getNotificationCopy(notification);

  const isFriendRequest = notification.type === "FRIEND_REQUEST_RECEIVED";

  return (
    <aside className="min-h-[660px] border-l border-slate-100 bg-white p-5 sm:p-6">
      <button
        type="button"
        onClick={onClose}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-violet-700"
      >
        <FiArrowLeft />
        Back to all
      </button>

      <div className="mt-8 text-center">
        <div className="flex justify-center">
          <NotificationAvatar actor={notification.actor} size="lg" />
        </div>

        <h2 className="mx-auto mt-5 max-w-xs text-xl font-bold leading-7 text-slate-950">
          {copy.title}
        </h2>

        <p className="mt-3 text-sm text-slate-400">
          {formatNotificationTime(notification.updatedAt)}
        </p>
      </div>

      {notification.thumbnailUrl ? (
        <img
          src={notification.thumbnailUrl}
          alt=""
          className="mt-6 h-44 w-full rounded-2xl object-cover"
        />
      ) : null}

      {isFriendRequest ? (
        <>
          <div className="mt-7 rounded-2xl border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-800">
              {notification.data?.mutualFriendCount ??
                notification.mutualFriends.length}{" "}
              mutual friends
            </p>

            {notification.mutualFriends.length > 0 ? (
              <div className="mt-4 flex -space-x-2">
                {notification.mutualFriends.slice(0, 7).map((friend) => (
                  <div
                    key={friend.id}
                    className="rounded-full border-2 border-white"
                    title={`${friend.firstname} ${friend.lastname}`}
                  >
                    <NotificationAvatar actor={friend} size="sm" />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onAccept}
              disabled={accepting}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-violet-600 text-sm font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiCheck />
              Accept
            </button>

            <button
              type="button"
              onClick={onDecline}
              disabled={declining}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiX />
              Decline
            </button>
          </div>
        </>
      ) : (
        <div className="mt-7 rounded-2xl border border-slate-200 p-5">
          <p className="text-sm leading-6 text-slate-600">
            {copy.description || "No additional details are available."}
          </p>

          {notification.target.available && notification.target.href ? (
            <button
              type="button"
              onClick={() => router.push(notification.target.href!)}
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-bold text-white transition hover:bg-violet-700"
            >
              <FiExternalLink />
              Open
            </button>
          ) : null}
        </div>
      )}

      {notification.actor ? (
        <div className="mt-5 rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <NotificationAvatar actor={notification.actor} size="sm" />

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-950">
                {notification.actor.firstname} {notification.actor.lastname}
              </p>

              <p className="truncate text-xs text-slate-400">
                @{notification.actor.username}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push(`/profile/${notification.actor?.id}`)}
            className="mt-4 h-11 w-full rounded-xl border border-slate-200 text-sm font-bold text-violet-700 transition hover:border-violet-200 hover:bg-violet-50"
          >
            View profile
          </button>
        </div>
      ) : null}

      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <FiTrash2 />
        Delete notification
      </button>
    </aside>
  );
}

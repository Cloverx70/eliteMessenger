import {
  FiCheck,
  FiHeart,
  FiMessageCircle,
  FiSend,
  FiShield,
  FiUserPlus,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { NotificationItem, NotificationType } from "../types";
import {
  formatNotificationTime,
  getNotificationCopy,
} from "./notification-display";

import { NotificationAvatar } from "./notification-avatar";
import type { ReactNode } from "react";

interface NotificationRowProps {
  notification: NotificationItem;
  selected: boolean;

  accepting?: boolean;
  declining?: boolean;

  onSelect: () => void;
  onAccept: () => void;
  onDecline: () => void;
}

const iconStyles: Record<
  NotificationType,
  {
    icon: ReactNode;
    className: string;
  }
> = {
  FRIEND_REQUEST_RECEIVED: {
    icon: <FiUserPlus />,
    className: "bg-violet-50 text-violet-700",
  },

  FRIEND_REQUEST_ACCEPTED: {
    icon: <FiUserPlus />,
    className: "bg-emerald-50 text-emerald-600",
  },

  POST_LIKED: {
    icon: <FiHeart />,
    className: "bg-rose-50 text-rose-500",
  },

  POST_COMMENTED: {
    icon: <FiMessageCircle />,
    className: "bg-orange-50 text-orange-500",
  },

  POST_SHARED: {
    icon: <FiSend />,
    className: "bg-indigo-50 text-indigo-600",
  },

  GROUP_ADDED: {
    icon: <FiUsers />,
    className: "bg-violet-50 text-violet-700",
  },

  GROUP_REMOVED: {
    icon: <FiUsers />,
    className: "bg-rose-50 text-rose-600",
  },

  GROUP_MENTION: {
    icon: <FiUsers />,
    className: "bg-violet-50 text-violet-700",
  },

  GROUP_ROLE_UPDATED: {
    icon: <FiUsers />,
    className: "bg-indigo-50 text-indigo-600",
  },

  ACCOUNT_SECURITY: {
    icon: <FiShield />,
    className: "bg-blue-50 text-blue-600",
  },

  SYSTEM_ANNOUNCEMENT: {
    icon: <FiShield />,
    className: "bg-slate-100 text-slate-700",
  },
};

export function NotificationRow({
  notification,
  selected,
  accepting,
  declining,
  onSelect,
  onAccept,
  onDecline,
}: NotificationRowProps) {
  const copy = getNotificationCopy(notification);

  const icon = iconStyles[notification.type];

  const isFriendRequest = notification.type === "FRIEND_REQUEST_RECEIVED";

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          onSelect();
        }
      }}
      className={`
        group relative flex cursor-pointer items-center gap-4
        border-b border-slate-100 px-4 py-4 transition
        sm:px-5
        ${
          selected
            ? "rounded-2xl border border-violet-200 bg-violet-50/80 shadow-sm"
            : "hover:bg-slate-50/80"
        }
      `}
    >
      <NotificationAvatar actor={notification.actor} />

      <div
        className={`
          flex h-11 w-11 shrink-0 items-center justify-center
          rounded-2xl text-lg
          ${icon.className}
        `}
      >
        {icon.icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-950 sm:text-[15px]">
          {copy.title}
        </p>

        <p className="mt-1 line-clamp-1 text-sm text-slate-500">
          {copy.description}
        </p>
      </div>

      <div className="hidden shrink-0 items-center gap-3 md:flex">
        <time className="text-xs font-medium text-slate-400">
          {formatNotificationTime(notification.updatedAt)}
        </time>

        {notification.thumbnailUrl ? (
          <img
            src={notification.thumbnailUrl}
            alt=""
            className="h-14 w-16 rounded-xl object-cover"
          />
        ) : null}

        {isFriendRequest ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={accepting}
              onClick={(event) => {
                event.stopPropagation();
                onAccept();
              }}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiCheck />
              Accept
            </button>

            <button
              type="button"
              disabled={declining}
              onClick={(event) => {
                event.stopPropagation();
                onDecline();
              }}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiX />
              Decline
            </button>
          </div>
        ) : null}
      </div>

      {!notification.isRead ? (
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-violet-600" />
      ) : null}
    </article>
  );
}

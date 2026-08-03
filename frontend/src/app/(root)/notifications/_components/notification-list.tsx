import { Fragment } from "react";
import { NotificationItem } from "../types";
import { NotificationRow } from "./notification-row";
import { getDayGroup } from "./notification-display";

interface NotificationListProps {
  notifications: NotificationItem[];
  selectedId: string | null;

  acceptingId: string | null;
  decliningId: string | null;

  onSelect: (notification: NotificationItem) => void;

  onAccept: (notification: NotificationItem) => void;

  onDecline: (notification: NotificationItem) => void;
}

export function NotificationList({
  notifications,
  selectedId,
  acceptingId,
  decliningId,
  onSelect,
  onAccept,
  onDecline,
}: NotificationListProps) {
  const grouped = notifications.reduce<Record<string, NotificationItem[]>>(
    (accumulator, notification) => {
      const group = getDayGroup(notification.updatedAt);

      accumulator[group] ??= [];
      accumulator[group].push(notification);

      return accumulator;
    },
    {},
  );

  const groupOrder = ["Today", "Yesterday", "Earlier"];

  return (
    <div>
      {groupOrder.map((group) => {
        const items = grouped[group];

        if (!items?.length) {
          return null;
        }

        return (
          <Fragment key={group}>
            <h2 className="px-4 pb-2 pt-5 text-sm font-bold text-slate-950 sm:px-5">
              {group}
            </h2>

            <div>
              {items.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  selected={selectedId === notification.id}
                  accepting={acceptingId === notification.id}
                  declining={decliningId === notification.id}
                  onSelect={() => onSelect(notification)}
                  onAccept={() => onAccept(notification)}
                  onDecline={() => onDecline(notification)}
                />
              ))}
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

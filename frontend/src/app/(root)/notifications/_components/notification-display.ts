import {
  NotificationItem,
  NotificationType,
} from '../types';

function actorName(
  notification: NotificationItem,
) {
  if (!notification.actor) {
    return 'Elite Messenger';
  }

  return [
    notification.actor.firstname,
    notification.actor.lastname,
  ]
    .filter(Boolean)
    .join(' ');
}

export function getNotificationCopy(
  notification: NotificationItem,
) {
  const name = actorName(notification);
  const count =
    notification.aggregationCount;

  switch (notification.type) {
    case 'FRIEND_REQUEST_RECEIVED':
      return {
        title: `${name} sent you a friend request.`,
        description: `${
          notification.data
            ?.mutualFriendCount ?? 0
        } mutual friends`,
      };

    case 'FRIEND_REQUEST_ACCEPTED':
      return {
        title: `${name} accepted your friend request.`,
        description:
          'You are now friends.',
      };

    case 'POST_LIKED':
      return {
        title:
          count > 1
            ? `${name} and ${
                count - 1
              } ${
                count - 1 === 1
                  ? 'other'
                  : 'others'
              } liked your post.`
            : `${name} liked your post.`,

        description:
          notification.data?.preview ??
          'Someone reacted to your post.',
      };

    case 'POST_COMMENTED':
      return {
        title: `${name} commented on your post.`,
        description:
          notification.data?.preview ??
          'Open the post to read the comment.',
      };

    case 'POST_SHARED':
      return {
        title:
          count > 1
            ? `Your post was shared ${count} times.`
            : `${name} shared your post.`,

        description:
          notification.data?.preview ??
          'Your post reached someone new.',
      };

    case 'GROUP_ADDED':
      return {
        title: `${name} added you to ${
          notification.data
            ?.groupName ??
          'a group'
        }.`,
        description:
          'Open the group to join the conversation.',
      };

    case 'GROUP_REMOVED':
      return {
        title: `You were removed from ${
          notification.data
            ?.groupName ??
          'a group'
        }.`,
        description:
          'You no longer have access to this group.',
      };

    case 'GROUP_MENTION':
      return {
        title: `${name} mentioned you in ${
          notification.data
            ?.groupName ??
          'a group'
        }.`,
        description:
          notification.data?.preview ??
          'Open the message to view the mention.',
      };

    case 'GROUP_ROLE_UPDATED':
      return {
        title: `Your role changed in ${
          notification.data
            ?.groupName ??
          'a group'
        }.`,
        description: `${
          notification.data
            ?.previousRole ??
          'Previous role'
        } → ${
          notification.data
            ?.newRole ??
          'New role'
        }`,
      };

    case 'ACCOUNT_SECURITY':
      return {
        title:
          getSecurityTitle(
            notification.data
              ?.securityEventType,
          ),

        description: [
          notification.data?.browser,
          notification.data?.device,
          notification.data?.location,
        ]
          .filter(Boolean)
          .join(' • '),
      };

    case 'SYSTEM_ANNOUNCEMENT':
      return {
        title:
          notification.data?.title ??
          'Elite Messenger announcement',

        description:
          notification.data?.message ??
          'There is a new system update.',
      };

    default:
      return {
        title: 'New notification',
        description:
          'Open this notification for more details.',
      };
  }
}

function getSecurityTitle(
  securityEventType:
    | string
    | null
    | undefined,
) {
  switch (securityEventType) {
    case 'NEW_LOGIN':
      return 'New login detected.';

    case 'PASSWORD_CHANGED':
      return 'Your password was changed.';

    case 'EMAIL_CHANGED':
      return 'Your email address was changed.';

    case 'ACCOUNT_UNLOCKED':
      return 'Your account was unlocked.';

    case 'SUSPICIOUS_LOGIN':
      return 'Suspicious login detected.';

    default:
      return 'Account security update.';
  }
}

export function formatNotificationTime(
  dateValue: string,
) {
  const date = new Date(dateValue);
  const difference =
    date.getTime() - Date.now();

  const absoluteDifference =
    Math.abs(difference);

  const formatter =
    new Intl.RelativeTimeFormat(
      'en',
      {
        numeric: 'auto',
      },
    );

  if (
    absoluteDifference <
    60_000
  ) {
    return formatter.format(
      Math.round(
        difference / 1_000,
      ),
      'second',
    );
  }

  if (
    absoluteDifference <
    3_600_000
  ) {
    return formatter.format(
      Math.round(
        difference / 60_000,
      ),
      'minute',
    );
  }

  if (
    absoluteDifference <
    86_400_000
  ) {
    return formatter.format(
      Math.round(
        difference / 3_600_000,
      ),
      'hour',
    );
  }

  if (
    absoluteDifference <
    604_800_000
  ) {
    return formatter.format(
      Math.round(
        difference / 86_400_000,
      ),
      'day',
    );
  }

  return new Intl.DateTimeFormat(
    'en',
    {
      month: 'short',
      day: 'numeric',
      year:
        date.getFullYear() ===
        new Date().getFullYear()
          ? undefined
          : 'numeric',
    },
  ).format(date);
}

export function getDayGroup(
  dateValue: string,
) {
  const date = new Date(dateValue);
  const now = new Date();

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const startOfNotification =
    new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );

  const dayDifference =
    Math.round(
      (
        startOfToday.getTime() -
        startOfNotification.getTime()
      ) /
        86_400_000,
    );

  if (dayDifference === 0) {
    return 'Today';
  }

  if (dayDifference === 1) {
    return 'Yesterday';
  }

  return 'Earlier';
}

export const postNotificationTypes:
  NotificationType[] = [
    'POST_LIKED',
    'POST_COMMENTED',
    'POST_SHARED',
  ];

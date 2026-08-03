import {
  NotificationFilter,
} from '../types';

interface NotificationTabsProps {
  activeFilter: NotificationFilter;
  unreadCount: number;
  onChange: (
    filter: NotificationFilter,
  ) => void;
}

const tabs: {
  value: NotificationFilter;
  label: string;
}[] = [
  {
    value: 'ALL',
    label: 'All',
  },
  {
    value: 'UNREAD',
    label: 'Unread',
  },
  {
    value: 'MENTIONS',
    label: 'Mentions',
  },
  {
    value: 'SOCIAL',
    label: 'Social',
  },
  {
    value: 'GROUPS',
    label: 'Groups',
  },
  {
    value: 'POSTS',
    label: 'Posts',
  },
  {
    value: 'SYSTEM',
    label: 'System',
  },
];

export function NotificationTabs({
  activeFilter,
  unreadCount,
  onChange,
}: NotificationTabsProps) {
  return (
    <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1">
      {tabs.map((tab) => {
        const isActive =
          activeFilter === tab.value;

        return (
          <button
            key={tab.value}
            type="button"
            onClick={() =>
              onChange(tab.value)
            }
            className={`
              inline-flex shrink-0 items-center gap-2 rounded-full
              border px-4 py-2 text-sm font-semibold transition
              ${
                isActive
                  ? 'border-violet-600 bg-violet-600 text-white shadow-[0_8px_24px_rgba(124,58,237,0.24)]'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:text-violet-700'
              }
            `}
          >
            {tab.label}

            {tab.value ===
              'UNREAD' &&
            unreadCount > 0 ? (
              <span
                className={`
                  rounded-full px-2 py-0.5 text-xs
                  ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-violet-600 text-white'
                  }
                `}
              >
                {unreadCount}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

import {
  FiBell,
} from 'react-icons/fi';

export function NotificationEmpty() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-50 text-3xl text-violet-600">
        <FiBell />
      </div>

      <h2 className="mt-5 text-xl font-bold text-slate-950">
        Nothing here yet
      </h2>

      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
        New requests, mentions, post activity, group updates, and security alerts will appear here.
      </p>
    </div>
  );
}

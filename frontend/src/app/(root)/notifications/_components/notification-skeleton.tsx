export function NotificationSkeleton() {
  return (
    <div className="animate-pulse">
      {Array.from({
        length: 7,
      }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 border-b border-slate-100 px-5 py-5"
        >
          <div className="h-12 w-12 rounded-full bg-slate-200" />
          <div className="h-11 w-11 rounded-2xl bg-slate-100" />

          <div className="min-w-0 flex-1">
            <div className="h-4 w-2/3 rounded bg-slate-200" />
            <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
          </div>

          <div className="h-3 w-12 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

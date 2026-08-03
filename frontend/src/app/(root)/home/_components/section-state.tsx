import { Inbox, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center px-6 py-8 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f3efff] text-[#7442ef]">
        <Inbox size={20} />
      </div>
      <p className="text-sm font-semibold text-[#292441]">{title}</p>
      <p className="mt-1 max-w-64 text-xs leading-5 text-[#8a849f]">
        {description}
      </p>
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  onRetry: () => void;
}

export function ErrorState({
  title = 'This section could not be loaded.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center px-6 py-8 text-center">
      <p className="text-sm font-semibold text-[#292441]">{title}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[#ded7f1] px-3 py-2 text-xs font-semibold text-[#6d36ed] transition hover:bg-[#f6f2ff]"
      >
        <RefreshCw size={14} />
        Retry
      </button>
    </div>
  );
}

export function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 px-5 pb-5 sm:px-6 sm:pb-6">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex animate-pulse items-center gap-3 rounded-2xl border border-[#f0edf6] p-3"
        >
          <div className="h-11 w-11 rounded-full bg-[#ede9f5]" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-2/5 rounded bg-[#e9e5f2]" />
            <div className="h-2.5 w-4/5 rounded bg-[#f0edf6]" />
          </div>
        </div>
      ))}
    </div>
  );
}

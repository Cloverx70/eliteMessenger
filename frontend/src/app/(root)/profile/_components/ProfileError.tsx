"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

interface ProfileErrorProps {
  onRetry: () => void;
}

export default function ProfileError({
  onRetry,
}: ProfileErrorProps) {
  return (
    <div className="flex h-full items-center justify-center bg-[#f8f7fc] p-6 dark:bg-customBlack">
      <div className="max-w-md rounded-[24px] border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-slate-800 dark:bg-slate-950">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-950/40">
          <AlertCircle size={27} />
        </span>

        <h1 className="mt-5 text-xl font-black text-slate-950 dark:text-white">
          Could not load the profile
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Check that the ProfileModule is registered and the backend is running.
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-violet-700 px-5 text-sm font-black text-white"
        >
          <RefreshCw size={17} />
          Try again
        </button>
      </div>
    </div>
  );
}

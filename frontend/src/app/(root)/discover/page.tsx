import { DiscoverShell } from "./_components/discover/discover-shell";
import { Suspense } from "react";

export default function DiscoverPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen animate-pulse bg-slate-100 dark:bg-slate-950" />
      }
    >
      <DiscoverShell />
    </Suspense>
  );
}

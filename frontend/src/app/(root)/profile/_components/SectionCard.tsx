import { ReactNode } from "react";

interface SectionCardProps {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function SectionCard({
  title,
  action,
  children,
  className = "",
}: SectionCardProps) {
  return (
    <section
      className={`min-w-0 rounded-[22px] border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(27,20,74,0.04)] dark:border-slate-800 dark:bg-slate-950 ${className}`}
    >
      {title || action ? (
        <header className="flex items-center justify-between gap-3 px-5 pb-3 pt-5">
          {title ? (
            <h2 className="text-sm font-black text-slate-950 dark:text-white sm:text-base">
              {title}
            </h2>
          ) : (
            <span />
          )}

          {action}
        </header>
      ) : null}

      {children}
    </section>
  );
}

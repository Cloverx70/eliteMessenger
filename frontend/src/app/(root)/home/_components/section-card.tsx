import type { ReactNode } from 'react';
import Link from 'next/link';

interface SectionCardProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  children: ReactNode;
  className?: string;
}

export default function SectionCard({
  title,
  description,
  actionLabel,
  actionHref,
  children,
  className = '',
}: SectionCardProps) {
  return (
    <section
      className={`rounded-[26px] border border-[#ece9f5] bg-white shadow-[0_18px_55px_rgba(56,32,110,0.07)] ${className}`}
    >
      <div className="flex items-start justify-between gap-4 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold tracking-[-0.02em] text-[#17132f]">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-xs leading-5 text-[#817b9d]">
              {description}
            </p>
          ) : null}
        </div>

        {actionLabel && actionHref ? (
          <Link
            href={actionHref}
            className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-[#6d36ed] transition hover:bg-[#f4efff]"
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>

      {children}
    </section>
  );
}

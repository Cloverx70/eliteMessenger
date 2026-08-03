import MediaResponsiveShell from "./_components/MediaResponsiveShell";
import { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Media",
  description:
    "Browse photos, videos, GIFs, documents, files, and links shared across your Elite Messenger conversations.",
};
export default function MediaLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <section
      className="
        h-full
        min-h-0
        w-full
        min-w-0
        overflow-hidden
        bg-slate-50
        antialiased
        dark:bg-customBlack
      "
    >
      <MediaResponsiveShell>{children}</MediaResponsiveShell>
    </section>
  );
}

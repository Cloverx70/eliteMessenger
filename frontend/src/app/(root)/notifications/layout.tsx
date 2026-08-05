import { Metadata } from "next";
import { QueryProvider } from "@/app/providers/query-provider";
import { getUserFromCookie } from "@/lib/user-auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Notifications",
  description:
    "View message alerts, friend requests, post interactions, group updates, and other Elite Messenger activity.",
};

export default async function NotificationLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUserFromCookie();
  if (!user) redirect("/login");

  return (
    <section className="h-screen w-full dark:bg-customBlack">
      <QueryProvider>{children}</QueryProvider>
    </section>
  );
}

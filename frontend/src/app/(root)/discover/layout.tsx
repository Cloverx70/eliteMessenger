import { Metadata } from "next";
import { QueryProvider } from "@/app/providers/query-provider";
import { getUserFromCookie } from "@/lib/user-auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Discover",
  description:
    "Explore posts, discover new people, interact with content, and expand your network on Elite Messenger.",
};

export default async function DiscoverLayout({
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

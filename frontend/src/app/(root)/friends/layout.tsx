import { Metadata } from "next";
import { QueryProvider } from "@/app/providers/query-provider";

export const metadata: Metadata = {
  title: "Friends",
  description:
    "Find people, manage friend requests, explore suggested users, and grow your Elite Messenger network.",
};
export default function FriendsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section className={`w-full antialiased dark:bg-customBlack bg-gray-50`}>
      <QueryProvider>{children}</QueryProvider>
    </section>
  );
}

import ChatsResponsiveShell from "./_components/ChatsResponsiveShell";
import { Metadata } from "next";
import { getUserFromCookie } from "@/lib/user-auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Chats",
  description:
    "View your private conversations, send messages, share attachments, and stay connected with friends on Elite Messenger.",
};

export default async function ChatsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUserFromCookie();

  if (!user) {
    redirect("/login");
  }

  return (
    <section
      className="
        h-full
        min-h-0
        w-full
        min-w-0
        overflow-hidden
        bg-white
        dark:bg-customBlack
      "
    >
      <ChatsResponsiveShell>{children}</ChatsResponsiveShell>
    </section>
  );
}

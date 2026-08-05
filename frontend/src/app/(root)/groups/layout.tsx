import GroupsResponsiveShell from "./_components/GroupsResponsiveShell";
import { Metadata } from "next";
import { getUserFromCookie } from "@/lib/user-auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Group Chats",
  description:
    "Create group conversations, manage members, share media, and connect with multiple people through Elite Messenger.",
};

export default async function GroupsLayout({
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
      <GroupsResponsiveShell>{children}</GroupsResponsiveShell>
    </section>
  );
}

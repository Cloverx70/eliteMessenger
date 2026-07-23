import GroupChatProfile from "./_components/GroupChatProfile";
import GroupChatsList from "./_components/GroupChatList";
import { QueryProvider } from "@/app/providers/query-provider";
import { getUserFromCookie } from "@/lib/user-auth";
import { redirect } from "next/navigation";

export default async function ChatsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUserFromCookie();
  if (!user) redirect("/login");

  return (
    <section className="h-screen w-full dark:bg-customBlack">
      <QueryProvider>
        <div className="flex h-screen w-full overflow-hidden">
          <aside className="h-full flex-[2.5]">
            <GroupChatsList />
          </aside>

          <main className="h-full flex-[5.5]">{children}</main>

          <aside className="h-full flex-[2]">
            <GroupChatProfile />
          </aside>
        </div>
      </QueryProvider>
    </section>
  );
}

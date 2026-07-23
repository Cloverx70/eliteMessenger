import ChatroomProfile from "./_components/ChatroomProfile";
import ChatroomsList from "./_components/ChatroomsList";
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
            <ChatroomsList />
          </aside>

          <main className="h-full flex-[5.5]">{children}</main>

          <aside className="h-full flex-[2]">
            <ChatroomProfile />
          </aside>
        </div>
      </QueryProvider>
    </section>
  );
}

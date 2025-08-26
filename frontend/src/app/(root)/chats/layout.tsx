import { QueryProvider } from "@/app/providers/query-provider";
import ChatroomsList from "./_components/ChatroomsList";

export default function ChatsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section className="w-full h-screen antialiased dark:bg-customBlack bg-gray-50 flex flex-col">
      <QueryProvider>
        <h1 className="font-bold text-3xl py-3 pb-4 pl-5 text-customBlack">
          Chats
        </h1>

        <div className="w-full flex flex-1 overflow-hidden">
          <div className="w-[30%] h-full overflow-y-auto border-r border-gray-200">
            <ChatroomsList />
          </div>
          <div className="w-[70%] h-full overflow-y-auto">{children}</div>
        </div>
      </QueryProvider>
    </section>
  );
}

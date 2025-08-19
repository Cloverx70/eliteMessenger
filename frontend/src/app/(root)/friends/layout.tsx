import { QueryProvider } from "@/app/providers/query-provider";

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

import { QueryProvider } from "@/app/providers/query-provider";
import { getUserFromCookie } from "@/lib/user-auth";
import { redirect } from "next/navigation";

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

import "./../styles/globals.css";

import { Montserrat, Roboto } from "next/font/google";

import type { Metadata } from "next";
import { QueryProvider } from "../providers/query-provider";
import SideBar from "../components/root-components/SideBar";
import { SocketProvider } from "../providers/SocketProvider";
import { ThemeProvider } from "../providers/theme-provider";
import { Toaster } from "react-hot-toast";
import { getUserFromCookie } from "@/lib/user-auth";
import { redirect } from "next/navigation";

const roboto = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

const montserrat = Montserrat({
  weight: ["400", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Elite Messenger",
    template: "%s | Elite Messenger",
  },
  description:
    "A modern social messaging platform for connecting, chatting, sharing, and discovering new people.",
  icons: {
    icon: "/icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUserFromCookie();

  if (!user) {
    redirect("/login");
  }

  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body
        className={`
          ${roboto.className}
          ${montserrat.className}
          h-full w-full overflow-hidden
          bg-white antialiased
          transition-colors
          dark:bg-customBlack
        `}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Toaster position="bottom-right" reverseOrder={false} />

          <SocketProvider user={user}>
            <QueryProvider>
              <div className="flex h-dvh w-full overflow-hidden">
                <div className="h-full shrink-0">
                  <SideBar user={user} />
                </div>

                <main
                  className="
                    h-full
                    min-h-0
                    min-w-0
                    flex-1
                    overflow-x-hidden
                    overflow-y-auto
                    overscroll-contain
                  "
                >
                  {children}
                </main>
              </div>
            </QueryProvider>
          </SocketProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

import "./../styles/globals.css";

import { Montserrat, Roboto } from "next/font/google";

import { Metadata } from "next";
import { QueryProvider } from "../providers/query-provider";
import { Toaster } from "react-hot-toast";

const roboto = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});
const montserrat = Montserrat({
  weight: ["400", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Log In",
  description:
    "Log in to Elite Messenger to access your conversations, friends, groups, posts, media, and notifications.",

  icons: {
    icon: "/icon.png",
  },
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${roboto.className} ${montserrat.className} antialiased `}
      >
        <QueryProvider>
          <Toaster position="bottom-right" reverseOrder={false} />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}

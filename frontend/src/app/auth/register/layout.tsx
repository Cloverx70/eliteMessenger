import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account",
  description:
    "Create your Elite Messenger account and start connecting, messaging, sharing, and discovering new people.",
};
export default function RegisterLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}

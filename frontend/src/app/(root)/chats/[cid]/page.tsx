import RoomChat from "../_components/RoomChat";
import { getUserFromCookie } from "@/lib/user-auth";
import { redirect } from "next/navigation";

export default async function ChatPage() {
  const user = await getUserFromCookie();
  if (!user) redirect("/login");
  return (
    <section className="h-full w-full">
      <RoomChat user={user} />
    </section>
  );
}

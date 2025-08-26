import RoomChat from "../_components/RoomChat";

export default function ChatPage() {
  return (
    <section className=" w-full h-screen min-h-screen flex flex-col items-start justify-start">
      <div className=" w-full h-full">
        <RoomChat />
      </div>
    </section>
  );
}

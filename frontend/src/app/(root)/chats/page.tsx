import { MessageCircleMore } from "lucide-react";

export default function ChatsPage() {
  return (
    <section
      className="
        flex
        h-full
        min-h-0
        w-full
        min-w-0
        items-center
        justify-center
        overflow-hidden
        bg-white
        p-6
        dark:bg-customBlack
      "
    >
      <div className="max-w-sm text-center">
        <span
          className="
            mx-auto
            flex
            h-16
            w-16
            items-center
            justify-center
            rounded-2xl
            bg-elitePurple/10
            text-elitePurple
          "
        >
          <MessageCircleMore size={30} />
        </span>

        <h1 className="mt-4 text-lg font-black text-slate-900 dark:text-white">
          Select a conversation
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Choose a chat from the list to start messaging.
        </p>
      </div>
    </section>
  );
}

import {
  Plus,
  UsersRound,
} from "lucide-react";

export default function GroupsPage() {
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
          <UsersRound size={30} />
        </span>

        <h1 className="mt-4 text-lg font-black text-slate-900 dark:text-white">
          Select a group
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Open a group conversation from
          the list or create a new one.
        </p>

        <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-elitePurple">
          <Plus size={15} />
          Create groups from the left panel
        </p>
      </div>
    </section>
  );
}

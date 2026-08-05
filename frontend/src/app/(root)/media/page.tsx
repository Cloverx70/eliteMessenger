import {
  FileText,
  ImageIcon,
  MousePointer2,
  Play,
} from "lucide-react";

export default function MediaPage() {
  return (
    <section
      className="
        relative
        flex
        h-full
        min-h-0
        w-full
        items-center
        justify-center
        overflow-hidden
        p-5
      "
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-elitePurple/5 blur-3xl" />

        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <div className="relative flex max-w-sm flex-col items-center text-center">
        <div className="relative mb-7 h-32 w-40">
          <div className="absolute left-0 top-5 flex h-20 w-24 -rotate-6 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-950">
            <ImageIcon className="text-3xl text-elitePurple/70" />
          </div>

          <div className="absolute right-0 top-2 flex h-20 w-24 rotate-6 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-950">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-elitePurple text-white shadow-lg shadow-elitePurple/20">
              <Play size={16} fill="currentColor" />
            </span>
          </div>

          <div className="absolute bottom-0 left-1/2 flex h-12 w-16 -translate-x-1/2 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
            <FileText className="text-xl text-slate-500" />
          </div>
        </div>

        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-elitePurple/10 text-elitePurple">
          <MousePointer2 size={19} />
        </span>

        <h1 className="mt-4 text-lg font-black text-slate-900 dark:text-white">
          Select media to preview
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Choose an item from the gallery to view its details and original
          conversation.
        </p>
      </div>
    </section>
  );
}

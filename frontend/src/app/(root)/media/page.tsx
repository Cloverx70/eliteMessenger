import { FaFileAlt, FaImage, FaMousePointer, FaPlay } from "react-icons/fa";

export default function MediaPage() {
  return (
    <section className="relative flex min-h-[calc(100vh-40px)] w-full items-center justify-center overflow-hidden p-5">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-elitePurple/5 blur-3xl" />

        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <div className="relative flex max-w-md flex-col items-center text-center">
        {/* Media illustration */}
        <div className="relative mb-7 h-36 w-44">
          <div className="absolute left-0 top-5 flex h-24 w-28 -rotate-6 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-950">
            <FaImage className="text-3xl text-elitePurple/70" />
          </div>

          <div className="absolute right-0 top-2 flex h-24 w-28 rotate-6 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-950">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-elitePurple text-white shadow-lg shadow-elitePurple/20">
              <FaPlay className="ml-0.5 text-sm" />
            </div>
          </div>

          <div className="absolute bottom-0 left-1/2 flex h-14 w-20 -translate-x-1/2 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
            <FaFileAlt className="text-xl text-slate-500" />
          </div>
        </div>

        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-elitePurple/10 text-elitePurple">
          <FaMousePointer className="text-lg" />
        </div>

        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Select media to preview
        </h1>

        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
          Choose a photo, video, GIF, document, or shared link from the media
          gallery to view its details here.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {["Photos", "Videos", "GIFs", "Files", "Links"].map((type) => (
            <span
              key={type}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400"
            >
              {type}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

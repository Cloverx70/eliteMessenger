import { BiDotsHorizontal } from "react-icons/bi";
import { CiSearch } from "react-icons/ci";
import MediaMap from "./_components/MediaMap";
import { QueryProvider } from "@/app/providers/query-provider";

export default function MediaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section
      className={`w-full h-screen min-h-0 overflow-hidden antialiased dark:bg-customBlack bg-gray-50 flex p-5`}
    >
      <QueryProvider>
        {/**Header */}
        <div className="flex flex-col gap-5 items-start justify-start flex-[7] border-r px-5">
          <div className="w-full flex items-center justify-between">
            <div className=" flex flex-col items-start justify-center">
              <h1 className="text-lg font-bold">Media</h1>

              <p className="text-xs text-slate-500">Your shared media</p>
            </div>

            <div className=" flex items-center justify-center gap-6">
              <CiSearch size={25} />
              <div className=" flex items-center justify-center gap-3">
                <p className=" text-elitePurple font-bold text-sm">Select</p>
                <div className=" w-10 h-10 rounded-full border flex items-center justify-center text-slate-600">
                  <BiDotsHorizontal size={20} />
                </div>
              </div>
            </div>
          </div>

          <div className="w-full">
            <MediaMap />
          </div>
        </div>
        <div className=" flex-[3] overflow-y-auto">{children}</div>
      </QueryProvider>
    </section>
  );
}

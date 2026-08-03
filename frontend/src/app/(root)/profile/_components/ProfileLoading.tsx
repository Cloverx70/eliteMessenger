export default function ProfileLoading() {
  return (
    <div className="h-full overflow-y-auto bg-[#f8f7fc] p-4 dark:bg-customBlack sm:p-6 lg:p-8">
      <div className="animate-pulse space-y-5">
        <div className="h-[390px] rounded-[26px] bg-slate-200 dark:bg-slate-900" />

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_350px]">
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="h-72 rounded-[22px] bg-slate-200 dark:bg-slate-900" />
              <div className="h-72 rounded-[22px] bg-slate-200 dark:bg-slate-900" />
            </div>
            <div className="h-96 rounded-[22px] bg-slate-200 dark:bg-slate-900" />
          </div>

          <div className="h-[620px] rounded-[22px] bg-slate-200 dark:bg-slate-900" />
        </div>
      </div>
    </div>
  );
}

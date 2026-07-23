export default function GroupsPage() {
  return (
    <section className="flex h-full w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="font-semibold">Select a group to start chatting</p>

        <p className="text-xs text-slate-500">
          Or create a new group from the left panel.
        </p>
      </div>
    </section>
  );
}

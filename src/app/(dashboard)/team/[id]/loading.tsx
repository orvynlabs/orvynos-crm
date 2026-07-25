export default function TeamMemberDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse p-1 select-none font-sans">
      <div className="flex items-center gap-4 bg-surface-white border border-border/80 rounded-2xl p-5">
        <div className="w-16 h-16 rounded-full bg-border dark:bg-stone-800 shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-6 w-48 bg-border dark:bg-stone-800 rounded-lg" />
          <div className="h-4 w-36 bg-border/70 dark:bg-stone-800/70 rounded-md" />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-surface-white border border-border/80 rounded-2xl p-5 h-40" />
        <div className="bg-surface-white border border-border/80 rounded-2xl p-5 h-40" />
      </div>
    </div>
  );
}

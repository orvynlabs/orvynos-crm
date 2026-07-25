export default function ProjectDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse p-1 select-none font-sans">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-6 w-56 bg-border dark:bg-stone-800 rounded-lg" />
            <div className="h-4 w-16 bg-border/70 dark:bg-stone-800 rounded-full" />
          </div>
          <div className="h-4 w-40 bg-border/70 dark:bg-stone-800/70 rounded-md" />
        </div>
        <div className="h-9 w-28 bg-border dark:bg-stone-800 rounded-xl" />
      </div>

      {/* Progress & Budget Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-surface-white border border-border/80 rounded-2xl p-4 space-y-2">
            <div className="h-3.5 w-20 bg-border/70 dark:bg-stone-800 rounded" />
            <div className="h-7 w-28 bg-border dark:bg-stone-800 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Detail Tabs & Info Panel */}
      <div className="bg-surface-white border border-border/80 rounded-2xl p-5 space-y-4">
        <div className="flex gap-2 border-b border-border/60 pb-3">
          <div className="h-7 w-24 bg-border dark:bg-stone-800 rounded-lg" />
          <div className="h-7 w-24 bg-border/60 dark:bg-stone-800/60 rounded-lg" />
          <div className="h-7 w-24 bg-border/60 dark:bg-stone-800/60 rounded-lg" />
        </div>
        <div className="h-32 bg-surface-page border border-border/60 rounded-xl p-4" />
      </div>
    </div>
  );
}

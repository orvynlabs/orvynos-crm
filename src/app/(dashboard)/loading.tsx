export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse p-1 select-none font-sans">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-48 bg-border dark:bg-stone-850 rounded-lg" />
        <div className="h-4.5 w-72 bg-border/70 dark:bg-stone-850/70 rounded-lg" />
      </div>

      {/* Metrics Deck Skeleton */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-surface-white border border-border rounded-xl p-4 h-20 flex flex-col justify-between"
          >
            <div className="h-3 w-16 bg-border/75 dark:bg-stone-800 rounded" />
            <div className="h-6 w-24 bg-border dark:bg-stone-800 rounded-md" />
          </div>
        ))}
      </div>

      {/* Filter / Action Bar Skeleton */}
      <div className="h-16 bg-surface-white border border-border rounded-xl p-4 flex items-center justify-between gap-4">
        <div className="h-8.5 w-full max-w-[320px] bg-surface-page border border-border/80 rounded-lg" />
        <div className="flex gap-2">
          <div className="h-8.5 w-16 bg-surface-page border border-border/80 rounded-lg" />
          <div className="h-8.5 w-16 bg-surface-page border border-border/80 rounded-lg" />
        </div>
      </div>

      {/* Cards Grid List Skeleton */}
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-surface-white border border-border rounded-xl p-4 space-y-4"
          >
            <div className="flex items-center gap-3">
              {/* Initials Circle Skeleton */}
              <div className="w-9 h-9 rounded-full bg-border/80 dark:bg-stone-800" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-32 bg-border dark:bg-stone-800 rounded" />
                <div className="h-3.5 w-24 bg-border/70 dark:bg-stone-800 rounded" />
              </div>
            </div>

            {/* Inner Project Panel Skeleton */}
            <div className="h-16 bg-surface-page border border-border/70 rounded-lg p-3" />

            {/* Footer row */}
            <div className="flex justify-between items-center pt-2">
              <div className="h-3 w-20 bg-border/70 dark:bg-stone-800 rounded" />
              <div className="h-3 w-24 bg-border dark:bg-stone-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ClientsLoading() {
  return (
    <div className="space-y-6 animate-pulse p-1 select-none font-sans">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-7 w-36 bg-border rounded-lg" />
          <div className="h-4 w-56 bg-border/70 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-border/80 rounded-lg" />
          <div className="h-9 w-28 bg-brand-orange/20 rounded-lg" />
        </div>
      </div>

      {/* Metrics Row Skeleton */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-surface-white border border-border rounded-xl p-4 h-[72px] flex flex-col justify-between"
          >
            <div className="h-3 w-14 bg-border/75 rounded" />
            <div className="h-5 w-20 bg-border rounded-md" />
          </div>
        ))}
      </div>

      {/* Search Bar Skeleton */}
      <div className="h-10 bg-surface-white border border-border rounded-lg" />

      {/* Client Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-surface-white border border-border rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-border/80" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-32 bg-border rounded" />
                <div className="h-3 w-24 bg-border/70 rounded" />
              </div>
            </div>
            <div className="h-14 bg-surface-page border border-border/70 rounded-lg" />
            <div className="flex justify-between items-center pt-1">
              <div className="h-3 w-20 bg-border/70 rounded" />
              <div className="h-3 w-24 bg-border rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

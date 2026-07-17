export default function ProjectsLoading() {
  return (
    <div className="space-y-6 animate-pulse p-1 select-none font-sans">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 bg-border rounded-lg" />
          <div className="h-4 w-60 bg-border/70 rounded-lg" />
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
            <div className="h-3 w-16 bg-border/75 rounded" />
            <div className="h-5 w-24 bg-border rounded-md" />
          </div>
        ))}
      </div>

      {/* Search Bar Skeleton */}
      <div className="h-10 bg-surface-white border border-border rounded-lg" />

      {/* Table Skeleton */}
      <div className="bg-surface-white border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="h-10 bg-surface-page border-b border-border/80" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 border-b border-border/40 flex items-center justify-between px-6 gap-4">
            <div className="h-4 w-48 bg-border/80 rounded" />
            <div className="h-4 w-32 bg-border/60 rounded" />
            <div className="h-5 w-16 bg-border/70 rounded-full" />
            <div className="h-4 w-20 bg-border/80 rounded" />
            <div className="h-4 w-24 bg-border/60 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

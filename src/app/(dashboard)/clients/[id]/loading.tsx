export default function ClientDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse p-1 select-none font-sans">
      {/* Back Button Skeleton */}
      <div className="h-5 w-28 bg-border/70 rounded" />

      {/* Client Header Card Skeleton */}
      <div className="bg-surface-white border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-border/80" />
          <div className="space-y-2 flex-1">
            <div className="h-6 w-44 bg-border rounded-lg" />
            <div className="h-4 w-32 bg-border/70 rounded" />
          </div>
          <div className="h-9 w-20 bg-border/70 rounded-lg" />
        </div>

        {/* Contact Info Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-14 bg-border/60 rounded" />
              <div className="h-4 w-28 bg-border/80 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Projects Section Skeleton */}
      <div className="bg-surface-white border border-border rounded-xl p-6 space-y-4">
        <div className="h-5 w-28 bg-border rounded" />
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-16 bg-surface-page border border-border/70 rounded-lg"
          />
        ))}
      </div>
    </div>
  );
}

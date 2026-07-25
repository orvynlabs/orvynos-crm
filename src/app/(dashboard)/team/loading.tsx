export default function TeamLoading() {
  return (
    <div className="space-y-6 animate-pulse p-1 select-none font-sans">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-border dark:bg-stone-800 rounded-lg" />
          <div className="h-4 w-72 bg-border/70 dark:bg-stone-800/70 rounded-lg" />
        </div>
        <div className="h-9 w-32 bg-border dark:bg-stone-800 rounded-xl" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-surface-white border border-border/80 rounded-2xl p-4 space-y-2">
            <div className="h-3 w-16 bg-border/70 dark:bg-stone-800 rounded" />
            <div className="h-6 w-24 bg-border dark:bg-stone-800 rounded-md" />
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-surface-white border border-border/80 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-border dark:bg-stone-800" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-32 bg-border dark:bg-stone-800 rounded" />
                <div className="h-3.5 w-24 bg-border/70 dark:bg-stone-800 rounded" />
              </div>
            </div>
            <div className="h-16 bg-surface-page border border-border/60 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DocumentsLoading() {
  return (
    <div className="space-y-6 animate-pulse p-1 select-none font-sans">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-52 bg-border dark:bg-stone-800 rounded-lg" />
          <div className="h-4 w-72 bg-border/70 dark:bg-stone-800/70 rounded-lg" />
        </div>
        <div className="h-9 w-32 bg-border dark:bg-stone-800 rounded-xl" />
      </div>

      <div className="bg-surface-white border border-border/80 rounded-2xl p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 bg-surface-page border border-border/60 rounded-xl flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-border dark:bg-stone-800" />
              <div className="h-4 w-44 bg-border dark:bg-stone-800 rounded" />
            </div>
            <div className="h-8 w-20 bg-border/70 dark:bg-stone-800 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

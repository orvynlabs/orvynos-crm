export default function NewProjectLoading() {
  return (
    <div className="space-y-6 animate-pulse p-1 select-none font-sans max-w-3xl mx-auto">
      <div className="space-y-2">
        <div className="h-7 w-48 bg-border dark:bg-stone-800 rounded-lg" />
        <div className="h-4 w-72 bg-border/70 dark:bg-stone-800/70 rounded-lg" />
      </div>
      <div className="bg-surface-white border border-border/80 rounded-2xl p-6 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-24 bg-border dark:bg-stone-800 rounded" />
            <div className="h-10 bg-surface-page border border-border/60 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

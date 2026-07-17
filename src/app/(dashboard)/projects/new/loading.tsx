export default function NewProjectLoading() {
  return (
    <div className="space-y-6 animate-pulse p-1 select-none font-sans max-w-3xl mx-auto">
      {/* Back Button + Title Skeleton */}
      <div className="space-y-3">
        <div className="h-5 w-20 bg-border/70 rounded" />
        <div className="h-8 w-48 bg-border rounded-lg" />
        <div className="h-4 w-72 bg-border/70 rounded-lg" />
      </div>

      {/* Form Card Skeleton */}
      <div className="bg-surface-white border border-border rounded-xl p-6 space-y-5">
        {/* Section Title */}
        <div className="h-5 w-32 bg-border rounded" />

        {/* Input fields */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3.5 w-24 bg-border/75 rounded" />
            <div className="h-10 w-full bg-surface-page border border-border/70 rounded-lg" />
          </div>
        ))}

        {/* Two-column row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-3.5 w-20 bg-border/75 rounded" />
            <div className="h-10 w-full bg-surface-page border border-border/70 rounded-lg" />
          </div>
          <div className="space-y-2">
            <div className="h-3.5 w-20 bg-border/75 rounded" />
            <div className="h-10 w-full bg-surface-page border border-border/70 rounded-lg" />
          </div>
        </div>

        {/* Textarea */}
        <div className="space-y-2">
          <div className="h-3.5 w-28 bg-border/75 rounded" />
          <div className="h-24 w-full bg-surface-page border border-border/70 rounded-lg" />
        </div>
      </div>

      {/* Team Section Skeleton */}
      <div className="bg-surface-white border border-border rounded-xl p-6 space-y-4">
        <div className="h-5 w-36 bg-border rounded" />
        <div className="h-16 bg-surface-page border border-border/70 rounded-lg" />
      </div>

      {/* Bottom Buttons */}
      <div className="flex justify-end gap-3">
        <div className="h-10 w-20 bg-border/70 rounded-lg" />
        <div className="h-10 w-32 bg-brand-orange/20 rounded-lg" />
      </div>
    </div>
  );
}

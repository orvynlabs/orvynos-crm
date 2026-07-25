"use client";

import { useEffect } from "react";
import { IconAlertTriangle, IconRefresh } from "@tabler/icons-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const errorMsg = error?.message || (typeof error === "object" ? JSON.stringify(error) : String(error));
    console.error("Application Error Caught by Boundary:", errorMsg);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center select-none font-sans">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 flex items-center justify-center mb-4 shadow-sm">
        <IconAlertTriangle className="h-8 w-8 stroke-[2]" />
      </div>
      <h2 className="text-xl font-bold text-foreground tracking-tight mb-2">
        Something went wrong
      </h2>
      <p className="text-xs text-text-secondary max-w-md mb-6 font-medium leading-relaxed">
        An unexpected error occurred while loading this section. Please try refreshing or attempting your action again.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-orange text-white text-xs font-bold hover:bg-brand-orange-hover active:scale-95 transition-all shadow-md cursor-pointer outline-none"
      >
        <IconRefresh className="h-4 w-4" />
        Try Again
      </button>
    </div>
  );
}

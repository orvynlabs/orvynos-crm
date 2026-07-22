"use client";

import React, { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useNav } from "./nav-context";
import { cn } from "@/lib/utils";

export function MainContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { pendingHref, isPending } = useNav();

  const isLoading = isPending || (pendingHref !== null && pendingHref !== pathname);

  return (
    <div className="relative flex-1 min-h-[calc(100vh-3.5rem)]">
      {/* Sleek top progress loader on route transitions (non-blocking) */}
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-brand-orange-tint/50 overflow-hidden z-50 pointer-events-none md:top-0 top-14">
          <div className="h-full bg-brand-orange w-full origin-left animate-progress-slide" />
        </div>
      )}

      <main className="p-4 pb-20 md:p-6 transition-opacity duration-150 ease-in-out">
        {children}
      </main>
    </div>
  );
}

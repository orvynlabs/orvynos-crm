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
        <div className="fixed top-0 left-0 right-0 h-1 bg-brand-orange/20 overflow-hidden z-[100] pointer-events-none md:top-0 top-14">
          <div className="h-full bg-gradient-to-r from-amber-500 via-brand-orange to-red-500 w-full animate-pulse shadow-[0_0_10px_rgba(234,59,12,0.8)]" />
        </div>
      )}

      <main className="p-4 pb-20 md:p-6 transition-opacity duration-150 ease-in-out">
        {children}
      </main>
    </div>
  );
}

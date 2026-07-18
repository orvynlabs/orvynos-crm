"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconChevronRight, IconDots } from "@tabler/icons-react";
import { NAV_ITEMS } from "./nav-items";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function BottomNav() {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  const primaryItems = NAV_ITEMS.slice(0, 4); // Dashboard, Leads, Clients, Projects
  const moreItems = NAV_ITEMS.slice(4); // Payments, Expenses, Team, Documents, Generators, Reports

  const isItemActive = useCallback(
    (href: string) => {
      if (href === "/") {
        return pathname === "/";
      }
      return pathname === href || pathname.startsWith(href + "/");
    },
    [pathname]
  );

  // Determine if any of the "More" items are currently active
  const isMoreActive = moreItems.some((item) => isItemActive(item.href));

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 h-16 border-t border-border bg-surface-white md:hidden pb-safe shadow-lg">
      <nav className="flex h-full items-center justify-around">
        {primaryItems.map((item) => {
          const active = isItemActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full py-1 text-center select-none active:scale-95 transition-all duration-100",
                active
                  ? "text-brand-orange"
                  : "text-text-secondary hover:text-text-primary"
              )}
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <item.icon className="h-5 w-5" stroke={1.75} />
              <span className="text-[10px] font-medium mt-1">{item.label}</span>
            </Link>
          );
        })}

        {/* More Button and Bottom Sheet */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger
            render={
              <button
                type="button"
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full py-1 text-center cursor-pointer select-none active:scale-95 transition-all duration-100 outline-none",
                  isMoreActive || sheetOpen
                    ? "text-brand-orange"
                    : "text-text-secondary hover:text-text-primary"
                )}
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                <IconDots className="h-5 w-5" stroke={1.75} />
                <span className="text-[10px] font-medium mt-1">More</span>
              </button>
            }
          />
          <SheetContent
            side="bottom"
            showCloseButton={false}
            className="rounded-t-[20px] pb-safe border-t border-border max-h-[85vh] overflow-y-auto"
          >
            {/* Drag Handle Indicator */}
            <div className="mx-auto my-2.5 h-1.5 w-12 rounded-full bg-border" />
            
            <SheetHeader className="px-4 py-2 border-b border-border text-left">
              <SheetTitle className="text-[11px] font-bold tracking-widest text-text-secondary uppercase">
                More Modules
              </SheetTitle>
            </SheetHeader>

            <div className="py-2 px-1">
              {moreItems.map((item) => {
                const active = isItemActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    onClick={() => setSheetOpen(false)}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-all duration-150 my-0.5 active:bg-brand-orange-tint/40 active:scale-[0.99]",
                      active
                        ? "bg-brand-orange-tint text-brand-orange"
                        : "text-text-secondary hover:bg-surface-page hover:text-text-primary"
                    )}
                    style={{ WebkitTapHighlightColor: "transparent" }}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-5 w-5 shrink-0" stroke={1.75} />
                      <span>{item.label}</span>
                    </div>
                    <IconChevronRight className="h-4 w-4 text-text-secondary" stroke={1.5} />
                  </Link>
                );
              })}
            </div>

            {/* Thumb-Reach Close Button */}
            <div className="p-4 border-t border-border bg-surface-white">
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="w-full py-2.5 text-sm font-semibold border border-border rounded-xl text-text-secondary hover:text-text-primary active:bg-surface-page transition-colors cursor-pointer outline-none"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                Close Menu
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}

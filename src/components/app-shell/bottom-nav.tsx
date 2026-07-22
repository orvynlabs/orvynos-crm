"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IconChevronRight,
  IconDots,
  IconPlus,
  IconLayoutDashboard,
  IconBriefcase,
  IconUsers,
  IconTargetArrow,
  IconCreditCard,
  IconReceipt2,
  IconUsersGroup,
  IconFileText,
  IconChartBar,
} from "@tabler/icons-react";
import { NAV_ITEMS } from "./nav-items";
import { cn } from "@/lib/utils";
import { useNav } from "./nav-context";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const QUICK_ACTIONS = [
  { label: "New Project", href: "/projects/new", icon: IconBriefcase, desc: "Set up client agreement & timeline" },
  { label: "Add Client", href: "/clients", icon: IconUsers, desc: "Add company & contact details" },
  { label: "Standup Update", href: "/team", icon: IconUsersGroup, desc: "Post daily standup & log blockers" },
  { label: "Record Payment", href: "/payments", icon: IconCreditCard, desc: "Log payment inflow receipt" },
  { label: "Add Expense", href: "/expenses", icon: IconReceipt2, desc: "Record tools, hosting or team payout" },
  { label: "New Lead", href: "/leads?new=true", icon: IconTargetArrow, desc: "Add potential project inquiry" },
  { label: "Create Generator", href: "/generators", icon: IconFileText, desc: "Generate Proposal, Invoice or PDF" },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { pendingHref, setPendingHref } = useNav();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);

  useEffect(() => {
    NAV_ITEMS.forEach((item) => {
      router.prefetch(item.href);
    });
    QUICK_ACTIONS.forEach((action) => {
      router.prefetch(action.href);
    });
  }, [router]);

  const moreItems = NAV_ITEMS.filter(
    (item) => !["/", "/projects", "/clients"].includes(item.href)
  );

  const isItemActive = useCallback(
    (href: string) => {
      const currentPath = pendingHref || pathname;
      if (href === "/") {
        return currentPath === "/";
      }
      return currentPath === href || currentPath.startsWith(href + "/");
    },
    [pathname, pendingHref]
  );

  const isMoreActive = moreItems.some((item) => isItemActive(item.href));

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 h-16 border-t border-border/80 bg-surface-white/95 backdrop-blur-md md:hidden pb-safe shadow-lg">
      <nav className="flex h-full items-center justify-around px-2 relative">
        {/* 1. Dashboard */}
        <Link
          href="/"
          prefetch={true}
          onClick={() => {
            if (pathname !== "/") setPendingHref("/");
          }}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full py-1 text-center select-none active:scale-90 transition-all duration-150",
            isItemActive("/")
              ? "text-brand-orange font-bold"
              : "text-text-secondary hover:text-text-primary"
          )}
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <IconLayoutDashboard className="h-5 w-5" stroke={isItemActive("/") ? 2.2 : 1.75} />
          <span className="text-[10px] font-semibold mt-1">Home</span>
        </Link>

        {/* 2. Projects */}
        <Link
          href="/projects"
          prefetch={true}
          onClick={() => {
            if (pathname !== "/projects") setPendingHref("/projects");
          }}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full py-1 text-center select-none active:scale-90 transition-all duration-150",
            isItemActive("/projects")
              ? "text-brand-orange font-bold"
              : "text-text-secondary hover:text-text-primary"
          )}
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <IconBriefcase className="h-5 w-5" stroke={isItemActive("/projects") ? 2.2 : 1.75} />
          <span className="text-[10px] font-semibold mt-1">Projects</span>
        </Link>

        {/* 3. CENTER "+" QUICK ACTION TRIGGER */}
        <Sheet open={quickActionOpen} onOpenChange={setQuickActionOpen}>
          <SheetTrigger
            render={
              <button
                type="button"
                aria-label="Quick Action Menu"
                className="flex items-center justify-center -mt-5 h-12 w-12 rounded-full bg-brand-orange text-white shadow-md hover:bg-brand-orange-hover active:scale-90 transition-transform duration-150 outline-none ring-4 ring-surface-page cursor-pointer"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                <IconPlus className="h-6 w-6 stroke-[2.5]" />
              </button>
            }
          />
          <SheetContent
            side="bottom"
            showCloseButton={false}
            className="rounded-t-[24px] pb-safe border-t border-border max-h-[85vh] overflow-y-auto"
          >
            {/* Drag Handle */}
            <div className="mx-auto my-2.5 h-1.5 w-12 rounded-full bg-border" />

            <SheetHeader className="px-4 py-2 border-b border-border/60 text-left">
              <SheetTitle className="text-sm font-bold text-text-primary flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-orange inline-block" />
                Quick Action Launcher
              </SheetTitle>
            </SheetHeader>

            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.href + action.label}
                  href={action.href}
                  prefetch={true}
                  onClick={() => {
                    setPendingHref(action.href);
                    setQuickActionOpen(false);
                  }}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-surface-white hover:border-brand-orange/40 active:bg-brand-orange-tint/50 active:scale-[0.98] transition-all duration-150 cursor-pointer"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  <div className="h-10 w-10 rounded-lg bg-brand-orange-tint text-brand-orange flex items-center justify-center shrink-0">
                    <action.icon className="h-5 w-5" stroke={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-text-primary block truncate">
                      {action.label}
                    </span>
                    <span className="text-[10px] text-text-secondary block truncate">
                      {action.desc}
                    </span>
                  </div>
                  <IconChevronRight className="h-4 w-4 text-text-secondary shrink-0" stroke={1.75} />
                </Link>
              ))}
            </div>

            <div className="p-3 border-t border-border/60">
              <button
                type="button"
                onClick={() => setQuickActionOpen(false)}
                className="w-full py-2.5 text-xs font-bold border border-border rounded-xl text-text-secondary hover:text-text-primary active:bg-surface-page transition-colors cursor-pointer outline-none"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                Cancel
              </button>
            </div>
          </SheetContent>
        </Sheet>

        {/* 4. Clients */}
        <Link
          href="/clients"
          prefetch={true}
          onClick={() => {
            if (pathname !== "/clients") setPendingHref("/clients");
          }}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full py-1 text-center select-none active:scale-90 transition-all duration-150",
            isItemActive("/clients")
              ? "text-brand-orange font-bold"
              : "text-text-secondary hover:text-text-primary"
          )}
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <IconUsers className="h-5 w-5" stroke={isItemActive("/clients") ? 2.2 : 1.75} />
          <span className="text-[10px] font-semibold mt-1">Clients</span>
        </Link>

        {/* 5. More Button and Sheet */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger
            render={
              <button
                type="button"
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full py-1 text-center cursor-pointer select-none active:scale-90 transition-all duration-150 outline-none",
                  isMoreActive || sheetOpen
                    ? "text-brand-orange font-bold"
                    : "text-text-secondary hover:text-text-primary"
                )}
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                <IconDots className="h-5 w-5" stroke={1.75} />
                <span className="text-[10px] font-semibold mt-1">More</span>
              </button>
            }
          />
          <SheetContent
            side="bottom"
            showCloseButton={false}
            className="rounded-t-[24px] pb-safe border-t border-border max-h-[85vh] overflow-y-auto"
          >
            {/* Drag Handle */}
            <div className="mx-auto my-2.5 h-1.5 w-12 rounded-full bg-border" />

            <SheetHeader className="px-4 py-2 border-b border-border/60 text-left">
              <SheetTitle className="text-[11px] font-bold tracking-widest text-text-secondary uppercase">
                All CRM Modules
              </SheetTitle>
            </SheetHeader>

            <div className="py-2 px-1 divide-y divide-border/40">
              {moreItems.map((item) => {
                const active = isItemActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    onClick={() => {
                      if (item.href !== pathname) {
                        setPendingHref(item.href);
                      }
                      setSheetOpen(false);
                    }}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150 active:bg-brand-orange-tint/40 active:scale-[0.99]",
                      active
                        ? "bg-brand-orange-tint text-brand-orange font-bold"
                        : "text-text-primary hover:bg-surface-page"
                    )}
                    style={{ WebkitTapHighlightColor: "transparent" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center",
                        active ? "bg-brand-orange text-white" : "bg-surface-page text-text-secondary"
                      )}>
                        <item.icon className="h-4.5 w-4.5 shrink-0" stroke={2} />
                      </div>
                      <span className="text-xs font-semibold">{item.label}</span>
                    </div>
                    <IconChevronRight className="h-4 w-4 text-text-secondary" stroke={1.5} />
                  </Link>
                );
              })}
            </div>

            <div className="p-4 border-t border-border bg-surface-white">
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="w-full py-2.5 text-xs font-bold border border-border rounded-xl text-text-secondary hover:text-text-primary active:bg-surface-page transition-colors cursor-pointer outline-none"
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


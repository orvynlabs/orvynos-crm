"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition, useCallback } from "react";
import { NAV_ITEMS } from "./nav-items";
import { cn } from "@/lib/utils";

/** Shared nav list — used by the desktop sidebar and the mobile drawer. */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      e.preventDefault();
      onNavigate?.();
      startTransition(() => {
        router.push(href);
      });
    },
    [router, onNavigate]
  );

  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV_ITEMS.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            onClick={(e) => handleClick(e, item.href)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-brand-orange-tint text-brand-orange"
                : "text-text-secondary hover:bg-surface-page hover:text-text-primary",
              isPending && "opacity-70 pointer-events-none"
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" stroke={1.75} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}


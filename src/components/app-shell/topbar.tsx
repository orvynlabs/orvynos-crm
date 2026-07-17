"use client";

import { useState } from "react";
import Link from "next/link";
import { IconMenu2, IconLogout } from "@tabler/icons-react";
import { Logo } from "@/components/logo";
import { SidebarNav } from "./sidebar-nav";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { signOutAction } from "@/lib/actions/auth";

type TopbarProps = {
  user: { name?: string | null; email?: string | null; image?: string | null };
};

function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Topbar({ user }: TopbarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-surface-white px-4">
      {/* Mobile: hamburger opens the nav drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open navigation"
              className="md:hidden text-text-secondary cursor-pointer"
            >
              <IconMenu2 className="h-5 w-5" stroke={1.75} />
            </Button>
          }
        />
        <SheetContent side="left" className="w-64 bg-surface-white p-0">
          <SheetHeader className="border-b border-border px-4 py-3">
            <SheetTitle
              render={
                <div className="flex items-center gap-2 select-none">
                  <Link href="/" onClick={() => setDrawerOpen(false)} className="flex items-center">
                    <Logo size="sm" className="h-6" />
                  </Link>
                  <div className="h-4 w-px bg-border" />
                  <span className="text-[8px] font-extrabold uppercase tracking-widest text-brand-orange bg-brand-orange-tint px-1.5 py-0.5 rounded">
                    Orvynos CRM
                  </span>
                </div>
              }
            />
          </SheetHeader>
          <div className="py-3">
            <SidebarNav onNavigate={() => setDrawerOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Topbar logo — shown on mobile where the sidebar is hidden */}
      <div className="flex items-center gap-2 select-none md:hidden">
        <Link href="/" className="flex items-center">
          <Logo size="sm" className="h-6" />
        </Link>
        <div className="h-4 w-px bg-border" />
        <span className="text-[8px] font-extrabold uppercase tracking-widest text-brand-orange bg-brand-orange-tint px-1.5 py-0.5 rounded">
          Orvynos CRM
        </span>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                aria-label="User menu"
                className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-brand-orange cursor-pointer"
              >
                <Avatar className="h-8 w-8 border border-border">
                  {user.image ? (
                    <AvatarImage src={user.image} alt={user.name ?? ""} />
                  ) : null}
                  <AvatarFallback className="bg-brand-orange-tint text-brand-orange text-xs font-bold">
                    {initials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <div className="text-sm font-semibold text-text-primary">
                {user.name}
              </div>
              <div className="text-xs font-normal text-text-secondary">
                {user.email}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => signOutAction()}
              className="text-danger focus:text-danger cursor-pointer"
            >
              <IconLogout className="h-4 w-4" stroke={1.75} />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

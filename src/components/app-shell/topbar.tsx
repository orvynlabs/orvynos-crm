"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconLogout,
  IconSearch,
  IconPlus,
  IconBriefcase,
  IconUsers,
  IconCreditCard,
  IconReceipt2,
  IconTargetArrow,
  IconFileText,
  IconCommand,
  IconChevronDown,
} from "@tabler/icons-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "./theme-toggle";
import { CommandPalette } from "./command-palette";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/lib/actions/auth";
import { getUserAvatarUrl, getUserInitials } from "@/lib/user-avatar";
import { useNav } from "./nav-context";

type TopbarProps = {
  user: { name?: string | null; email?: string | null; image?: string | null };
};

export function Topbar({ user }: TopbarProps) {
  const router = useRouter();
  const { setPendingHref } = useNav();
  const avatarUrl = getUserAvatarUrl(user);
  const initials = getUserInitials(user.name);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOutAction();
    } catch {
      window.location.href = "/login";
    }
  };

  const handleNavigate = (href: string) => {
    setPendingHref(href);
    router.push(href);
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-border/80 bg-surface-white/90 dark:bg-surface-white/85 backdrop-blur-md px-4 transition-colors">
        {/* Topbar logo — shown on mobile where the sidebar is hidden */}
        <div className="flex items-center gap-2 select-none md:hidden">
          <Link href="/" className="flex items-center active:scale-95 transition-transform">
            <Logo size="sm" className="h-6" />
          </Link>
          <div className="h-4 w-px bg-border/80" />
          <span className="text-[8px] font-extrabold uppercase tracking-widest text-brand-orange bg-brand-orange-tint/80 border border-brand-orange/20 px-1.5 py-0.5 rounded-md">
            Orvynos CRM
          </span>
        </div>

        {/* WEB SIDE COMMAND / SEARCH TRIGGER (Hidden on small mobile) */}
        <div className="hidden md:flex items-center flex-1 max-w-md">
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="w-full flex items-center justify-between h-9 px-3 text-xs text-text-secondary bg-surface-page hover:bg-surface-white border border-border/80 hover:border-brand-orange/40 rounded-xl transition-all duration-150 cursor-pointer shadow-2xs group"
          >
            <div className="flex items-center gap-2">
              <IconSearch className="h-4 w-4 text-text-secondary group-hover:text-brand-orange transition-colors" stroke={2} />
              <span className="font-semibold">Search CRM or jump to action...</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-extrabold text-text-secondary/70 bg-surface-white dark:bg-surface-page border border-border px-1.5 py-0.5 rounded-md shadow-2xs">
              <IconCommand className="h-3 w-3" />
              <span>K</span>
            </div>
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2.5">
          {/* WEB INSTANT ACTION DROPDOWN */}
          <div className="hidden sm:block">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-brand-orange hover:bg-brand-orange-hover text-white text-xs font-bold shadow-2xs hover:shadow-xs active:scale-[0.98] transition-all cursor-pointer outline-none border-0 select-none"
                  >
                    <IconPlus className="h-4 w-4 stroke-[2.5]" />
                    <span>Quick Action</span>
                    <IconChevronDown className="h-3.5 w-3.5 opacity-80" stroke={2} />
                  </button>
                }
              />
              <DropdownMenuContent align="end" className="w-56 rounded-xl border border-border p-1.5 shadow-lg font-sans">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">
                    Instant Web Actions
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="my-1 border-border/60" />
                <DropdownMenuItem
                  onClick={() => handleNavigate("/projects/new")}
                  className="flex items-center gap-2.5 px-2 py-2 text-xs font-bold text-text-primary hover:bg-brand-orange-tint/50 hover:text-brand-orange rounded-lg cursor-pointer transition-colors"
                >
                  <IconBriefcase className="h-4 w-4 text-brand-orange shrink-0" stroke={2} />
                  <span>New Project</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleNavigate("/clients")}
                  className="flex items-center gap-2.5 px-2 py-2 text-xs font-bold text-text-primary hover:bg-brand-orange-tint/50 hover:text-brand-orange rounded-lg cursor-pointer transition-colors"
                >
                  <IconUsers className="h-4 w-4 text-blue-600 shrink-0" stroke={2} />
                  <span>Add Client Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleNavigate("/payments")}
                  className="flex items-center gap-2.5 px-2 py-2 text-xs font-bold text-text-primary hover:bg-brand-orange-tint/50 hover:text-brand-orange rounded-lg cursor-pointer transition-colors"
                >
                  <IconCreditCard className="h-4 w-4 text-emerald-600 shrink-0" stroke={2} />
                  <span>Record Payment Inflow</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleNavigate("/expenses")}
                  className="flex items-center gap-2.5 px-2 py-2 text-xs font-bold text-text-primary hover:bg-brand-orange-tint/50 hover:text-brand-orange rounded-lg cursor-pointer transition-colors"
                >
                  <IconReceipt2 className="h-4 w-4 text-rose-600 shrink-0" stroke={2} />
                  <span>Add Business Expense</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleNavigate("/leads?new=true")}
                  className="flex items-center gap-2.5 px-2 py-2 text-xs font-bold text-text-primary hover:bg-brand-orange-tint/50 hover:text-brand-orange rounded-lg cursor-pointer transition-colors"
                >
                  <IconTargetArrow className="h-4 w-4 text-amber-600 shrink-0" stroke={2} />
                  <span>Add New Lead</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleNavigate("/generators")}
                  className="flex items-center gap-2.5 px-2 py-2 text-xs font-bold text-text-primary hover:bg-brand-orange-tint/50 hover:text-brand-orange rounded-lg cursor-pointer transition-colors"
                >
                  <IconFileText className="h-4 w-4 text-purple-600 shrink-0" stroke={2} />
                  <span>Generate Proposal / PDF</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    handleNavigate("/team");
                    setTimeout(() => {
                      window.dispatchEvent(new Event("open-daily-standup"));
                    }, 500);
                  }}
                  className="flex items-center gap-2.5 px-2 py-2 text-xs font-bold text-text-primary hover:bg-brand-orange-tint/50 hover:text-brand-orange rounded-lg cursor-pointer transition-colors border-t border-border/40 mt-1 pt-1.5"
                >
                  <IconPlus className="h-4 w-4 text-brand-orange shrink-0" stroke={2.5} />
                  <span>Post Daily Standup</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  aria-label="User menu"
                  className="inline-flex items-center gap-2 py-1 px-1.5 pr-3 rounded-full border border-border/80 bg-surface-white hover:bg-surface-page hover:border-brand-orange/40 active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-brand-orange cursor-pointer select-none shadow-2xs"
                >
                  <div className="h-7 w-7 rounded-full border border-border/80 overflow-hidden bg-brand-orange-tint flex items-center justify-center shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={user.name ?? ""} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-brand-orange text-[10px] font-extrabold">
                        {initials}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-text-primary capitalize truncate max-w-[110px]">
                    {user.name?.split(" ")[0] || "Owner"}
                  </span>
                </button>
              }
            />
            <DropdownMenuContent align="end" className="w-56 rounded-xl border border-border p-1.5 shadow-md font-sans">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="px-2 py-1.5">
                  <div className="text-xs font-bold text-text-primary">
                    {user.name}
                  </div>
                  <div className="text-[11px] font-medium text-text-secondary truncate">
                    {user.email}
                  </div>
                  <div className="mt-1 inline-flex items-center text-[9px] font-extrabold uppercase tracking-wider text-brand-orange bg-brand-orange-tint px-1.5 py-0.5 rounded">
                    Co-Founder / Owner
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="my-1 border-border/60" />
              <DropdownMenuItem
                onSelect={handleSignOut}
                className="text-danger focus:text-danger cursor-pointer text-xs font-semibold rounded-lg px-2 py-2"
              >
                <IconLogout className="h-4 w-4" stroke={2} />
                Sign out of Orvyn CRM
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* GLOBAL COMMAND PALETTE (Cmd+K / Ctrl+K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </>
  );
}


"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NAV_ITEMS, type NavItem } from "./nav-items";
import { cn } from "@/lib/utils";
import { useNav } from "./nav-context";
import { IconActivity, IconChevronUp, IconChevronDown, IconEyeOff } from "@tabler/icons-react";
import { getSidebarTeamStatus, updateTeamMemberStatus } from "@/app/(dashboard)/team/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Categorized navigation structure for clean modern organization
const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "MAIN MENU",
    items: NAV_ITEMS.slice(0, 4), // Dashboard, Leads, Clients, Projects
  },
  {
    title: "FINANCE",
    items: NAV_ITEMS.slice(4, 6), // Payments, Expenses
  },
  {
    title: "MANAGEMENT",
    items: NAV_ITEMS.slice(6), // Team, Documents, Generators, Reports
  },
];

const getAvatarGradient = (name: string) => {
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradients = [
    "from-orange-500 to-amber-500 text-white",
    "from-blue-600 to-cyan-500 text-white",
    "from-emerald-600 to-teal-500 text-white",
    "from-purple-600 to-indigo-500 text-white",
  ];
  return gradients[hash % gradients.length];
};

const getInitials = (name: string) => {
  if (!name) return "TM";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

let globalTeamStatusCache: any[] | null = null;

/** Shared nav list — used by the desktop sidebar and the mobile drawer. */
export function SidebarNav({ onNavigate, initialTeamStatus = [] }: { onNavigate?: () => void; initialTeamStatus?: any[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const { pendingHref, setPendingHref } = useNav();
  const [teamStatus, setTeamStatus] = useState<any[]>(() => globalTeamStatusCache || initialTeamStatus);

  // Prefetch all primary navigation routes on mount to ensure instant client transitions
  useEffect(() => {
    NAV_ITEMS.forEach((item) => {
      router.prefetch(item.href);
    });
  }, [router]);

  // Fetch co-founders live status & standups (lightning fast < 2ms query)
  useEffect(() => {
    async function loadStatus() {
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        const res = await getSidebarTeamStatus();
        if (res.success && res.data) {
          globalTeamStatusCache = res.data;
          setTeamStatus(res.data);
        }
      } catch (err) {
        console.error("Failed to load sidebar status:", err);
      }
    }

    loadStatus();

    // Listen to daily updates state changes to refresh instantly
    const handleRefresh = () => loadStatus();
    window.addEventListener("refresh-team-status", handleRefresh);

    const interval = setInterval(loadStatus, 45000);
    return () => {
      clearInterval(interval);
      window.removeEventListener("refresh-team-status", handleRefresh);
    };
  }, []);

  const [isTeamStatusHidden, setIsTeamStatusHidden] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("orvynos_team_status_hidden");
      if (saved === "false") {
        setIsTeamStatusHidden(false);
      }
    } catch {}
  }, []);

  const toggleTeamStatusHidden = () => {
    setIsTeamStatusHidden((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("orvynos_team_status_hidden", String(next));
      } catch {}
      return next;
    });
  };

  const handleStatusChange = async (memberId: string, newStatus: "AVAILABLE" | "BUSY" | "ON_LEAVE") => {
    try {
      const res = await updateTeamMemberStatus(memberId, newStatus);
      if (res.success) {
        window.dispatchEvent(new Event("refresh-team-status"));
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  return (
    <div className={cn("flex flex-col font-sans select-none px-2.5", isTeamStatusHidden ? "space-y-4" : "space-y-2.5")}>
      {/* Categorized Navigation Groups */}
      <div className={cn("space-y-2", isTeamStatusHidden ? "space-y-4" : "space-y-2")}>
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className={cn("space-y-0.5", isTeamStatusHidden ? "space-y-1" : "space-y-0.5")}>
            <div className={cn("px-2 font-black tracking-widest text-text-secondary/70 uppercase transition-all", isTeamStatusHidden ? "text-[10.5px] py-1" : "text-[9.5px] py-0.5")}>
              {section.title}
            </div>
            <div className={cn("flex flex-col", isTeamStatusHidden ? "gap-1" : "gap-0.5")}>
              {section.items.map((item) => {
                const currentPath = pendingHref || pathname;
                const active =
                  currentPath === item.href ||
                  (item.href !== "/" && currentPath.startsWith(item.href + "/"));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    onMouseEnter={() => router.prefetch(item.href)}
                    onTouchStart={() => router.prefetch(item.href)}
                    onClick={() => {
                      if (item.href !== pathname) {
                        setPendingHref(item.href);
                      }
                      onNavigate?.();
                    }}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-2.5 transition-all duration-150 active:scale-[0.98] group",
                      isTeamStatusHidden ? "py-1.5 text-[13.5px]" : "py-0.5 text-[12.5px]",
                      active
                        ? "bg-brand-orange-tint text-brand-orange shadow-2xs font-extrabold"
                        : "text-text-secondary hover:bg-surface-page hover:text-text-primary"
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-lg flex items-center justify-center shrink-0 transition-all duration-150",
                        isTeamStatusHidden ? "h-6 w-6" : "h-5.5 w-5.5",
                        active
                          ? "bg-brand-orange text-white shadow-2xs"
                          : "bg-surface-page text-text-secondary group-hover:bg-surface-white group-hover:text-text-primary"
                      )}
                    >
                      <item.icon className={cn("transition-all", isTeamStatusHidden ? "h-4 w-4" : "h-3.5 w-3.5")} stroke={active ? 2.2 : 1.75} />
                    </div>
                    <span className={cn("flex-1 truncate tracking-tight font-extrabold transition-all", isTeamStatusHidden ? "text-[13px]" : "text-[12px]")}>{item.label}</span>
                    {active && (
                      <span className="w-1 h-1 rounded-full bg-brand-orange shrink-0 shadow-2xs" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Live Co-Founders Status & Standup Tracker Sidebar Widget */}
      {teamStatus.length > 0 && (
        <div className="rounded-2xl bg-surface-page/80 border border-border/80 shadow-2xs mt-1 transition-all overflow-hidden">
          {/* Widget Header Bar with Toggle (Single-line layout, non-wrapping) */}
          <div className="flex items-center justify-between gap-1 p-2 sm:p-2.5 text-[9px] font-black text-text-secondary uppercase tracking-wider whitespace-nowrap flex-nowrap min-w-0 select-none">
            <button
              onClick={toggleTeamStatusHidden}
              className="flex items-center gap-1 hover:text-text-primary cursor-pointer transition-colors text-left whitespace-nowrap shrink-0"
            >
              <IconActivity className="h-3 w-3 text-brand-orange animate-pulse shrink-0" />
              <span className="truncate max-w-[95px] sm:max-w-[110px] tracking-wider font-black">Live Team Status</span>
            </button>

            <div className="flex items-center gap-1 shrink-0 whitespace-nowrap flex-nowrap">
              {!isTeamStatusHidden && (
                <button
                  onClick={() => window.dispatchEvent(new Event("open-daily-standup"))}
                  className="text-brand-orange hover:bg-brand-orange/10 px-1 py-0.5 rounded-md font-black cursor-pointer transition-all text-[8.5px] whitespace-nowrap shrink-0 active:scale-95"
                >
                  + Post Standup
                </button>
              )}
              <button
                onClick={toggleTeamStatusHidden}
                title={isTeamStatusHidden ? "Show Live Team Status" : "Hide Live Team Status"}
                className="p-0.5 rounded-md text-text-secondary hover:text-brand-orange hover:bg-surface-white transition-all cursor-pointer shrink-0"
              >
                {isTeamStatusHidden ? (
                  <IconChevronDown className="h-3.5 w-3.5 text-brand-orange" />
                ) : (
                  <IconChevronUp className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Widget Content Body */}
          {!isTeamStatusHidden && (
            <div className="px-2.5 pb-2.5 space-y-1.5">
              {teamStatus.slice(0, 4).map((member) => {
                const currentStatus = member.status || "AVAILABLE";
                const isAvailable = currentStatus === "AVAILABLE";
                const isBusy = currentStatus === "BUSY";
                const isLeave = currentStatus === "ON_LEAVE";

                const statusDotColor = isAvailable
                  ? "bg-emerald-500 ring-1 ring-white dark:ring-stone-900"
                  : isBusy
                  ? "bg-amber-500 ring-1 ring-white dark:ring-stone-900"
                  : "bg-rose-500 ring-1 ring-white dark:ring-stone-900";

                const statusLabel = isAvailable
                  ? "Available"
                  : isBusy
                  ? "Busy"
                  : isLeave
                  ? "On Leave"
                  : currentStatus;

                const statusBadgeStyle = isAvailable
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                  : isBusy
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20";

                const latestStandup = member.dailyUpdates?.[0];
                const todayFocus = latestStandup?.workingOnNext || "No standup logged";
                const avatarGrad = getAvatarGradient(member.name);
                const initials = getInitials(member.name);

                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-2 p-1.5 rounded-xl bg-surface-white border border-border/50 hover:border-brand-orange/20 transition-all text-[11px] min-w-0 shadow-3xs"
                    title={`${member.name} (${member.title || "Co-Founder"})\nStatus: ${statusLabel}\nToday: ${todayFocus}`}
                  >
                    {/* Profile Picture with live status dot */}
                    <div className="relative shrink-0 select-none">
                      {member.image ? (
                        <img
                          src={member.image}
                          alt={member.name}
                          className="w-6.5 h-6.5 rounded-full object-cover border border-border/80 shadow-3xs"
                        />
                      ) : (
                        <div className={`w-6.5 h-6.5 rounded-full bg-gradient-to-tr ${avatarGrad} flex items-center justify-center font-black text-[9.5px] text-white shadow-3xs`}>
                          {initials}
                        </div>
                      )}
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white dark:border-stone-900 ${statusDotColor}`} />
                    </div>

                    {/* Co-founder name, status & what they are doing today */}
                    <div className="min-w-0 flex-1 leading-tight">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-extrabold text-text-primary text-[10.5px] truncate">
                          {member.name}
                        </span>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <button
                                type="button"
                                className={`text-[8.5px] font-black px-1.5 py-0.5 rounded-md shrink-0 uppercase tracking-wider transition-all cursor-pointer flex items-center gap-0.5 hover:scale-105 active:scale-95 shadow-3xs ${statusBadgeStyle}`}
                              >
                                <span>{statusLabel}</span>
                                <IconChevronDown className="h-2.5 w-2.5 opacity-80" stroke={3.5} />
                              </button>
                            }
                          />
                          <DropdownMenuContent align="end" side="right" className="w-32 rounded-xl border border-border p-1 shadow-lg bg-surface-white font-sans text-xs">
                            <DropdownMenuGroup>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(member.id, "AVAILABLE")}
                                className="flex items-center gap-2 px-2 py-1.5 font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg cursor-pointer text-[11px]"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>Available</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(member.id, "BUSY")}
                                className="flex items-center gap-2 px-2 py-1.5 font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg cursor-pointer text-[11px]"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                <span>Busy</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(member.id, "ON_LEAVE")}
                                className="flex items-center gap-2 px-2 py-1.5 font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer text-[11px]"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                <span>On Leave</span>
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="text-[9.5px] text-text-secondary truncate mt-0.5 font-medium italic">
                        {todayFocus}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

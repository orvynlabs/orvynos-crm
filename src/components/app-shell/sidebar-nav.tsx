"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NAV_ITEMS, type NavItem } from "./nav-items";
import { cn } from "@/lib/utils";
import { useNav } from "./nav-context";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconActivity,
  IconChevronUp,
  IconChevronDown,
  IconX,
  IconArrowRight,
  IconCheck,
  IconAlertCircle,
  IconPlus,
  IconMessageCode,
  IconClock,
} from "@tabler/icons-react";
import { getSidebarTeamStatus, updateTeamMemberStatus } from "@/app/(dashboard)/team/actions";
import { useWebSocket, isMemberOnline } from "@/components/providers/websocket-provider";
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

/** Shared nav list — used by desktop sidebar and mobile drawer. */
export function SidebarNav({ onNavigate, initialTeamStatus = [] }: { onNavigate?: () => void; initialTeamStatus?: any[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const { pendingHref, setPendingHref } = useNav();
  const { onlineUsers } = useWebSocket();
  const [teamStatus, setTeamStatus] = useState<any[]>(() => globalTeamStatusCache || initialTeamStatus);
  const [selectedStandupMember, setSelectedStandupMember] = useState<any | null>(null);

  // Prefetch all primary navigation routes on mount to ensure instant client transitions
  useEffect(() => {
    NAV_ITEMS.forEach((item) => {
      router.prefetch(item.href);
    });
  }, [router]);

  // ⚡ Desktop Power Hotkeys (Linear / GitHub style: G -> D, G -> P, G -> C, G -> R, G -> T, G -> F)
  useEffect(() => {
    let lastKey = "";
    let keyTimeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable) {
        return;
      }

      if (e.key.toLowerCase() === "g") {
        lastKey = "g";
        clearTimeout(keyTimeout);
        keyTimeout = setTimeout(() => {
          lastKey = "";
        }, 1000);
        return;
      }

      if (lastKey === "g") {
        const k = e.key.toLowerCase();
        let targetHref: string | null = null;
        if (k === "d" || k === "h") targetHref = "/";
        else if (k === "p") targetHref = "/projects";
        else if (k === "c") targetHref = "/clients";
        else if (k === "r") targetHref = "/reports";
        else if (k === "t") targetHref = "/team";
        else if (k === "f") targetHref = "/documents";
        else if (k === "g") targetHref = "/generators";

        if (targetHref && targetHref !== pathname) {
          e.preventDefault();
          setPendingHref(targetHref);
          router.push(targetHref);
          lastKey = "";
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(keyTimeout);
    };
  }, [pathname, router, setPendingHref]);

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
    <>
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
            {/* Widget Header Bar with Toggle */}
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
                  const isUserOnline = isMemberOnline(member, onlineUsers);

                  const statusDotColor = isUserOnline
                    ? "bg-emerald-500 ring-2 ring-emerald-300 dark:ring-emerald-900 animate-pulse"
                    : "bg-stone-400 dark:bg-stone-600 ring-1 ring-white dark:ring-stone-900";

                  const statusLabel = isUserOnline ? "Online" : "Offline";

                  const statusBadgeStyle = isUserOnline
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold"
                    : "bg-surface-page text-text-secondary border border-border/60";

                  const latestStandup = member.dailyUpdates?.[0];
                  const todayFocus = latestStandup?.workingOnNext || "No standup logged";
                  const avatarGrad = getAvatarGradient(member.name);
                  const initials = getInitials(member.name);

                  return (
                    <div
                      key={member.id}
                      onClick={() => setSelectedStandupMember(member)}
                      className="flex items-center gap-2 p-1.5 rounded-xl bg-surface-white border border-border/50 hover:border-brand-orange/40 hover:bg-brand-orange-tint/30 transition-all cursor-pointer text-[11px] min-w-0 shadow-3xs group/item"
                      title="Click to view full standup details"
                    >
                      {/* Profile Picture with live status dot */}
                      <div className="relative shrink-0 select-none">
                        {member.image ? (
                          <img
                            src={member.image}
                            alt={member.name}
                            className="w-6.5 h-6.5 rounded-full object-cover border border-border/80 shadow-3xs group-hover/item:border-brand-orange/40 transition-colors"
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
                          <span className="font-extrabold text-text-primary text-[10.5px] truncate group-hover/item:text-brand-orange transition-colors">
                            {member.name}
                          </span>

                          <span
                            className={`text-[8.5px] font-black px-1.5 py-0.5 rounded-md shrink-0 uppercase tracking-wider select-none shadow-3xs ${statusBadgeStyle}`}
                          >
                            {statusLabel}
                          </span>
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

      {/* ─── OWNER STANDUP DETAIL POPUP MODAL ─── */}
      <AnimatePresence>
        {selectedStandupMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedStandupMember(null)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans select-none"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.12, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-surface-white border border-border/80 rounded-2xl p-5 shadow-2xl space-y-4 relative overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-border/80">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {selectedStandupMember.image ? (
                      <img
                        src={selectedStandupMember.image}
                        alt={selectedStandupMember.name}
                        className="w-12 h-12 rounded-full object-cover border border-border shadow-xs"
                      />
                    ) : (
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-tr ${getAvatarGradient(selectedStandupMember.name)} flex items-center justify-center font-black text-sm text-white shadow-xs`}>
                        {getInitials(selectedStandupMember.name)}
                      </div>
                    )}
                    <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-stone-900 ${
                      selectedStandupMember.status === "AVAILABLE" ? "bg-emerald-500" : selectedStandupMember.status === "BUSY" ? "bg-amber-500" : "bg-rose-500"
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-text-primary text-base">
                        {selectedStandupMember.name}
                      </h3>
                      <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        selectedStandupMember.status === "AVAILABLE"
                          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                          : selectedStandupMember.status === "BUSY"
                          ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                          : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                      }`}>
                        {selectedStandupMember.status || "AVAILABLE"}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-text-secondary">
                      {selectedStandupMember.title || "Co-Founder / Owner"}
                    </p>
                    {selectedStandupMember.email && (
                      <p className="text-[11px] font-medium text-text-secondary/80 mt-0.5">
                        {selectedStandupMember.email}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedStandupMember(null)}
                  className="p-1.5 rounded-xl hover:bg-surface-page text-text-secondary hover:text-text-primary transition-colors cursor-pointer border-0 outline-none"
                >
                  <IconX className="h-4 w-4" />
                </button>
              </div>

              {/* Detailed Standup Content */}
              {selectedStandupMember.dailyUpdates?.[0] ? (
                <div className="space-y-3">
                  {/* Working On Today */}
                  <div className="p-3 bg-brand-orange-tint/50 border border-brand-orange/25 rounded-xl space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-brand-orange flex items-center gap-1.5">
                      <IconArrowRight className="h-3.5 w-3.5 animate-pulse" stroke={2.5} />
                      Working On Today
                    </span>
                    <p className="text-xs text-text-primary font-medium leading-relaxed whitespace-pre-wrap">
                      {selectedStandupMember.dailyUpdates[0].workingOnNext}
                    </p>
                  </div>

                  {/* Completed Yesterday */}
                  <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/30 rounded-xl space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <IconCheck className="h-3.5 w-3.5" stroke={2.5} />
                      Completed Yesterday
                    </span>
                    <p className="text-xs text-text-primary font-medium leading-relaxed whitespace-pre-wrap">
                      {selectedStandupMember.dailyUpdates[0].completedToday || "No completed tasks listed"}
                    </p>
                  </div>

                  {/* Blockers Alert if any */}
                  {selectedStandupMember.dailyUpdates[0].blockers && (
                    <div className="p-3 bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 rounded-xl flex items-start gap-2 text-xs">
                      <IconAlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" stroke={2} />
                      <div className="min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 block">
                          Blocker Alert
                        </span>
                        <p className="text-rose-950 dark:text-rose-200 font-medium leading-relaxed">
                          {selectedStandupMember.dailyUpdates[0].blockers}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Post Date Timestamp */}
                  <div className="text-[10px] font-bold text-text-secondary/70 text-right flex items-center justify-end gap-1">
                    <IconClock className="h-3 w-3 text-brand-orange" />
                    <span>
                      Logged on {new Date(selectedStandupMember.dailyUpdates[0].createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-5 bg-surface-page border border-border/80 rounded-xl text-center space-y-2">
                  <IconMessageCode className="h-7 w-7 text-brand-orange mx-auto opacity-80 animate-bounce" />
                  <h4 className="text-xs font-extrabold text-text-primary">No Standup Logged Today</h4>
                  <p className="text-[11px] text-text-secondary font-medium">
                    {selectedStandupMember.name} has not posted a morning update yet today.
                  </p>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                <Link
                  href={`/team/${selectedStandupMember.id}`}
                  onClick={() => setSelectedStandupMember(null)}
                  className="text-xs font-bold text-brand-orange hover:text-brand-orange-hover flex items-center gap-1 cursor-pointer"
                >
                  <span>Full Founder Details</span>
                  <IconChevronDown className="-rotate-90 h-3.5 w-3.5" />
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStandupMember(null);
                      window.dispatchEvent(new Event("open-daily-standup"));
                    }}
                    className="px-3 py-1.5 rounded-xl bg-brand-orange hover:bg-brand-orange-hover text-white text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer border-0"
                  >
                    + Post Update
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStandupMember(null)}
                    className="px-3 py-1.5 rounded-xl border border-border text-xs font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

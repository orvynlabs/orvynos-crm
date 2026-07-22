"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import {
  IconUsers,
  IconCurrencyRupee,
  IconChevronRight,
  IconChevronDown,
  IconPlus,
  IconSearch,
  IconCheck,
  IconAlertCircle,
  IconBuilding,
  IconActivity,
  IconSend,
  IconSparkles,
  IconArrowRight,
  IconCalendar,
  IconMessageCode,
  IconTrash,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { updateTeamMemberStatus, createDailyUpdate, deleteDailyUpdate } from "./actions";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type EnrichedTeamMember = {
  id: string;
  userId: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  title: string | null;
  skills: string[];
  phone: string | null;
  bio: string | null;
  status: "AVAILABLE" | "BUSY" | "ON_LEAVE" | string;
  assignedProjectsCount: number;
  assignments: {
    id: string;
    projectId: string;
    projectName: string;
    projectStatus: string;
    roleOnProject: string | null;
  }[];
  dailyUpdates?: {
    id: string;
    completedToday: string;
    workingOnNext: string;
    blockers: string | null;
    date: string;
    createdAt: string;
  }[];
  totalPaid: number;
  pendingAmount: number;
  createdAt: string;
};

export type DailyUpdateItem = {
  id: string;
  teamMemberId: string;
  memberName: string;
  memberTitle: string | null;
  memberImage: string | null;
  completedToday: string;
  workingOnNext: string;
  blockers: string | null;
  createdAt: string;
};

type TeamListClientProps = {
  members: EnrichedTeamMember[];
  initialDailyUpdates: DailyUpdateItem[];
};

const STATUS_CONFIG: Record<
  string,
  { label: string; dotColor: string; badgeClass: string }
> = {
  AVAILABLE: {
    label: "Available",
    dotColor: "bg-emerald-500 animate-pulse",
    badgeClass:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900/40",
  },
  BUSY: {
    label: "Busy",
    dotColor: "bg-amber-500",
    badgeClass:
      "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/80 dark:border-amber-900/40",
  },
  ON_LEAVE: {
    label: "On Leave",
    dotColor: "bg-rose-500",
    badgeClass:
      "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/40",
  },
};

const getAvatarGradient = (name: string) => {
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradients = [
    "from-orange-500 to-amber-500 text-white shadow-orange-500/20",
    "from-blue-600 to-cyan-500 text-white shadow-blue-500/20",
    "from-emerald-600 to-teal-500 text-white shadow-emerald-500/20",
    "from-purple-600 to-indigo-500 text-white shadow-purple-500/20",
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

export function TeamListClient({
  members: initialMembers,
  initialDailyUpdates,
}: TeamListClientProps) {
  const [members, setMembers] = useState<EnrichedTeamMember[]>(initialMembers);
  const [dailyUpdates, setDailyUpdates] = useState<DailyUpdateItem[]>(initialDailyUpdates);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");

  // Daily Standup Form State
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    initialMembers[0]?.id || ""
  );
  const [completedToday, setCompletedToday] = useState("");
  const [workingOnNext, setWorkingOnNext] = useState("");
  const [blockers, setBlockers] = useState("");

  // Listen to the custom window event to open the Standup Sheet instantly
  useEffect(() => {
    const handleOpenStandup = () => {
      setIsSheetOpen(true);
    };
    window.addEventListener("open-daily-standup", handleOpenStandup);
    return () => window.removeEventListener("open-daily-standup", handleOpenStandup);
  }, []);

  useEffect(() => {
    setMembers(initialMembers);
    if (!selectedMemberId && initialMembers.length > 0) {
      setSelectedMemberId(initialMembers[0].id);
    }
  }, [initialMembers, selectedMemberId]);

  // Handle Status Update for a Co-Founder
  const handleStatusChange = (
    memberId: string,
    newStatus: "AVAILABLE" | "BUSY" | "ON_LEAVE"
  ) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, status: newStatus } : m))
    );
    window.dispatchEvent(new Event("refresh-team-status"));

    startTransition(async () => {
      const res = await updateTeamMemberStatus(memberId, newStatus);
      if (!res.success) {
        setMembers(initialMembers);
        window.dispatchEvent(new Event("refresh-team-status"));
      }
    });
  };

  // Handle Daily Standup Form Submission
  const handleStandupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completedToday.trim() || !workingOnNext.trim()) return;

    setErrorMsg("");
    startTransition(async () => {
      const res = await createDailyUpdate({
        teamMemberId: selectedMemberId,
        completedToday,
        workingOnNext,
        blockers: blockers.trim() || undefined,
      });

      if (res.success && res.data) {
        const member =
          members.find((m) => m.id === selectedMemberId || m.userId === selectedMemberId) ||
          members[0];

        const newUpdate: DailyUpdateItem = {
          id: res.data.id,
          teamMemberId: selectedMemberId,
          memberName: member?.name || "Co-Founder",
          memberTitle: member?.title || null,
          memberImage: member?.image || null,
          completedToday,
          workingOnNext,
          blockers: blockers.trim() || null,
          createdAt: new Date().toISOString(),
        };

        setDailyUpdates((prev) => [newUpdate, ...prev]);
        window.dispatchEvent(new Event("refresh-team-status"));
        setCompletedToday("");
        setWorkingOnNext("");
        setBlockers("");
        setIsSheetOpen(false);
      } else {
        setErrorMsg(res.error || "Failed to post daily update.");
      }
    });
  };

  const handleDeleteUpdate = (id: string) => {
    if (!confirm("Are you sure you want to delete this standup update?")) return;

    setDailyUpdates((prev) => prev.filter((u) => u.id !== id));
    window.dispatchEvent(new Event("refresh-team-status"));

    startTransition(async () => {
      const res = await deleteDailyUpdate(id);
      if (!res.success) {
        alert(res.error || "Failed to delete daily update.");
      }
    });
  };

  const filteredMembers = members.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      (m.title && m.title.toLowerCase().includes(q)) ||
      m.skills.some((s) => s.toLowerCase().includes(q))
    );
  });

  const totalMembers = members.length;
  const availableCount = members.filter((m) => (m.status || "AVAILABLE") === "AVAILABLE").length;
  const totalPaidOut = members.reduce((sum, m) => sum + m.totalPaid, 0);

  // Group daily standup updates by teamMemberId to display only the single latest update for each co-founder
  const latestUpdatesByFounder = dailyUpdates.reduce((acc, curr) => {
    if (!acc[curr.teamMemberId]) {
      acc[curr.teamMemberId] = curr;
    }
    return acc;
  }, {} as Record<string, DailyUpdateItem>);

  const displayedUpdates = Object.values(latestUpdatesByFounder);

  return (
    <div className="space-y-6 font-sans select-none">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-surface-white border border-border/80 rounded-2xl p-4 md:p-5 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-orange bg-brand-orange-tint px-2 py-0.5 rounded-md">
              Orvyn Co-Founders Hub
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-text-primary mt-1">
            Team &amp; Standup Daily Tracker
          </h1>
          <p className="text-xs text-text-secondary font-medium">
            Manage owner availability statuses, project assignments, and daily morning updates.
          </p>
        </div>

        {/* Action Button: Post Standup */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger
            render={
              <Button className="font-bold text-xs bg-brand-orange hover:bg-brand-orange-hover text-white py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-xs border-0 h-9 cursor-pointer active:scale-[0.98] transition-all">
                <IconPlus className="h-4 w-4" stroke={2.5} />
                Post Daily Standup
              </Button>
            }
          />
          <SheetContent className="w-full max-w-[440px] p-5 bg-surface-white border-l border-border h-full flex flex-col justify-between overflow-y-auto">
            <form onSubmit={handleStandupSubmit} className="space-y-5">
              <SheetHeader>
                <SheetTitle className="text-base font-bold text-text-primary text-left flex items-center gap-2">
                  <IconSparkles className="h-4 w-4 text-brand-orange" />
                  Post Daily Standup Update
                </SheetTitle>
                <SheetDescription className="text-xs text-text-secondary mt-0.5 text-left font-medium">
                  Share what you are working on today, completed yesterday, and any blockers.
                </SheetDescription>
              </SheetHeader>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs font-bold flex items-center gap-2">
                  <IconAlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Founder Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary">
                  Posting as Co-Founder
                </label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full h-10 px-3 bg-surface-page border border-border/80 rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-orange"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.title || "Co-Founder"})
                    </option>
                  ))}
                </select>
              </div>

              {/* 1. What I am working on today */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-brand-orange animate-pulse" />
                  What I am working on today *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Building client details page and optimizing database queries..."
                  value={workingOnNext}
                  onChange={(e) => setWorkingOnNext(e.target.value)}
                  className="w-full p-3 bg-surface-page border border-border/80 rounded-xl text-xs font-medium text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-1 focus:ring-brand-orange"
                />
              </div>

              {/* 2. What I completed yesterday */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  What I completed yesterday *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Completed payment receipt generation & deployed stripe helper..."
                  value={completedToday}
                  onChange={(e) => setCompletedToday(e.target.value)}
                  className="w-full p-3 bg-surface-page border border-border/80 rounded-xl text-xs font-medium text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-1 focus:ring-brand-orange"
                />
              </div>

              {/* 3. Blockers */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  Any blockers (optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Waiting for Cloudflare R2 API keys from design team..."
                  value={blockers}
                  onChange={(e) => setBlockers(e.target.value)}
                  className="w-full p-3 bg-surface-page border border-border/80 rounded-xl text-xs font-medium text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-1 focus:ring-brand-orange"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <Button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 bg-brand-orange hover:bg-brand-orange-hover text-white font-bold text-xs h-10 rounded-xl shadow-xs border-0 cursor-pointer"
                >
                  <IconSend className="h-4 w-4" />
                  {isPending ? "Posting Update..." : "Post Update"}
                </Button>
                <button
                  type="button"
                  onClick={() => setIsSheetOpen(false)}
                  className="px-4 h-10 border border-border rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        {/* Total Co-Founders */}
        <div className="p-4 bg-surface-white border border-border/80 rounded-2xl flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] font-bold uppercase text-text-secondary tracking-wider block">
              Co-Founders &amp; Team
            </span>
            <span className="text-xl font-black text-text-primary leading-tight mt-1 block">
              {totalMembers} Members
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/30 text-brand-orange flex items-center justify-center border border-orange-100 dark:border-orange-900/30 shrink-0">
            <IconUsers className="h-4.5 w-4.5" stroke={2} />
          </div>
        </div>

        {/* Available Right Now */}
        <div className="p-4 bg-surface-white border border-border/80 rounded-2xl flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] font-bold uppercase text-text-secondary tracking-wider block">
              Available Right Now
            </span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 leading-tight mt-1 block">
              {availableCount} Available
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/30 shrink-0">
            <IconCheck className="h-4.5 w-4.5" stroke={2.5} />
          </div>
        </div>

        {/* Total Payouts */}
        <div className="p-4 bg-surface-white border border-border/80 rounded-2xl flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] font-bold uppercase text-text-secondary tracking-wider block">
              Total Payouts Settled
            </span>
            <span className="text-xl font-black text-text-primary leading-tight mt-1 block">
              ₹{totalPaidOut.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/30 shrink-0">
            <IconCurrencyRupee className="h-4.5 w-4.5" stroke={2} />
          </div>
        </div>
      </div>

      {/* Main Grid: Left 2/3 for Co-Founders, Right 1/3 Pinned Standups Pane */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Left Section: Co-Founders Grid */}
        <div className="md:col-span-8 space-y-4">
          <div className="flex items-center justify-between border-b border-border/80 pb-3">
            <h2 className="text-sm font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <IconUsers className="h-4.5 w-4.5 text-brand-orange" />
              <span>Co-Founders Directory</span>
            </h2>

            {/* Search Input */}
            <div className="relative w-full max-w-[240px]">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-secondary" />
              <input
                type="text"
                placeholder="Search by name, role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 h-8 bg-surface-white border border-border/80 rounded-xl text-xs font-semibold shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange"
              />
            </div>
          </div>

          {filteredMembers.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              {filteredMembers.map((member) => {
                const avatarGrad = getAvatarGradient(member.name);
                const initials = getInitials(member.name);
                const status = STATUS_CONFIG[member.status || "AVAILABLE"] || STATUS_CONFIG.AVAILABLE;

                return (
                  <div
                    key={member.id}
                    className="bg-surface-white border border-border/80 rounded-2xl p-4 shadow-2xs hover:shadow-xs hover:border-brand-orange/30 transition-all duration-200 flex flex-col justify-between space-y-3.5 group/card"
                  >
                    <div className="space-y-3">
                      {/* Header: Avatar + Info + Status Toggle */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {member.image ? (
                            <img
                              src={member.image}
                              alt={member.name}
                              className="w-10 h-10 rounded-full object-cover border border-border/80 shrink-0 shadow-2xs"
                            />
                          ) : (
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${avatarGrad} flex items-center justify-center font-extrabold text-[11px] text-white select-none shadow-2xs shrink-0`}>
                              {initials}
                            </div>
                          )}

                          <div className="min-w-0">
                            <h3 className="font-extrabold text-text-primary text-sm tracking-tight truncate group-hover/card:text-brand-orange transition-colors">
                              {member.name}
                            </h3>
                            <p className="text-[10px] font-bold text-text-secondary truncate">
                              {member.title || "Co-Founder"}
                            </p>
                          </div>
                        </div>

                        {/* Interactive Status Selector Dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <button
                                type="button"
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1.25 rounded-full text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-3xs hover:brightness-105 ${status.badgeClass}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`} />
                                <span>{status.label}</span>
                                <IconChevronDown className="h-2.5 w-2.5 opacity-80" stroke={3.5} />
                              </button>
                            }
                          />
                          <DropdownMenuContent align="end" className="w-36 rounded-xl border border-border p-1 shadow-md font-sans">
                            <DropdownMenuGroup>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(member.id, "AVAILABLE")}
                                className="flex items-center gap-2 px-2 py-1 text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>Available</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(member.id, "BUSY")}
                                className="flex items-center gap-2 px-2 py-1 text-xs font-bold text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                <span>Busy</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(member.id, "ON_LEAVE")}
                                className="flex items-center gap-2 px-2 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                <span>On Leave</span>
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Skills Chips */}
                      {member.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {member.skills.slice(0, 4).map((skill) => (
                            <span
                              key={skill}
                              className="text-[9.5px] font-bold px-2 py-0.5 rounded bg-surface-page text-text-secondary border border-border/60"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Finance Stats Grid */}
                      <div className="grid grid-cols-3 gap-1 bg-surface-page/60 border border-border/60 rounded-xl p-2 text-center text-[11px]">
                        <div>
                          <span className="text-[8.5px] font-extrabold uppercase text-text-secondary block">Projects</span>
                          <span className="font-extrabold text-text-primary text-xs mt-0.5 block">
                            {member.assignedProjectsCount}
                          </span>
                        </div>
                        <div className="border-x border-border/60">
                          <span className="text-[8.5px] font-extrabold uppercase text-text-secondary block">Total Paid</span>
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs mt-0.5 block">
                            ₹{member.totalPaid.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div>
                          <span className="text-[8.5px] font-extrabold uppercase text-text-secondary block">Pending</span>
                          <span className="font-extrabold text-amber-600 dark:text-amber-400 text-xs mt-0.5 block">
                            ₹{member.pendingAmount.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] font-semibold">
                      <span className="text-text-secondary truncate max-w-[120px]">
                        {member.email}
                      </span>
                      <Link
                        href={`/team/${member.id}`}
                        className="text-brand-orange hover:text-brand-orange-hover font-extrabold flex items-center gap-0.5 cursor-pointer active:scale-95 transition-transform"
                      >
                        Payouts &amp; Details <IconChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-surface-white border border-border/80 rounded-2xl p-8 text-center">
              <p className="text-xs font-bold text-text-primary">No team members found</p>
            </div>
          )}
        </div>

        {/* Right Section: Sticky Daily Standup Sidebar Panel */}
        <div className="md:col-span-4 space-y-4 md:sticky md:top-20">
          <div className="border-b border-border/80 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <IconMessageCode className="h-4.5 w-4.5 text-brand-orange" />
              <span>Co-Founders Standups</span>
            </h2>
            <span className="text-[9.5px] font-black uppercase text-brand-orange bg-brand-orange-tint px-2 py-0.5 rounded shadow-2xs">
              Latest
            </span>
          </div>

          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            {displayedUpdates.length > 0 ? (
              displayedUpdates.map((update) => (
                <div
                  key={update.id}
                  className="bg-surface-white border border-border/80 rounded-2xl p-4 shadow-2xs space-y-3 hover:border-brand-orange/30 transition-all"
                >
                  {/* Standup Card Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-7 w-7 rounded-full bg-brand-orange-tint text-brand-orange flex items-center justify-center font-black text-[10px] border border-brand-orange/20 shrink-0">
                        {getInitials(update.memberName)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[12px] font-black text-text-primary truncate">
                          {update.memberName}
                        </h4>
                        <span className="text-[9.5px] font-bold text-text-secondary truncate block">
                          {update.memberTitle || "Co-Founder"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[9px] text-text-secondary font-bold shrink-0">
                      <span>{new Date(update.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteUpdate(update.id)}
                        title="Delete Standup"
                        className="h-5 w-5 rounded-md hover:bg-rose-50 hover:text-rose-600 text-stone-400 flex items-center justify-center transition-colors active:scale-95 cursor-pointer border-0"
                      >
                        <IconTrash className="h-3 w-3" stroke={2.5} />
                      </button>
                    </div>
                  </div>

                  {/* Standup Details (Working Today / Completed Yesterday Swapped) */}
                  <div className="space-y-2.5 text-[11px]">
                    {/* Working Today */}
                    <div className="p-2 bg-brand-orange-tint/40 border border-brand-orange/20 rounded-xl space-y-0.5">
                      <span className="text-[9.5px] font-black uppercase tracking-wider text-brand-orange flex items-center gap-1">
                        <IconArrowRight className="h-3 w-3 animate-pulse" stroke={2.5} /> Working Today
                      </span>
                      <p className="text-text-primary font-medium leading-normal whitespace-pre-wrap">
                        {update.workingOnNext}
                      </p>
                    </div>

                    {/* Completed Yesterday */}
                    <div className="p-2 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl space-y-0.5">
                      <span className="text-[9.5px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <IconCheck className="h-3 w-3" stroke={2.5} /> Completed Yesterday
                      </span>
                      <p className="text-text-primary font-medium leading-normal whitespace-pre-wrap">
                        {update.completedToday}
                      </p>
                    </div>
                  </div>

                  {/* Blockers Alert if any */}
                  {update.blockers && (
                    <div className="p-2 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 rounded-xl flex items-start gap-1.5 text-[11px]">
                      <IconAlertCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" stroke={2} />
                      <div className="min-w-0">
                        <span className="text-[9px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 block">
                          Blocker Alert
                        </span>
                        <p className="text-rose-950 dark:text-rose-200 font-medium leading-normal">
                          {update.blockers}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-surface-white border border-border/80 rounded-2xl p-6 text-center space-y-1.5">
                <IconMessageCode className="h-6 w-6 text-brand-orange mx-auto opacity-75 animate-bounce" stroke={2} />
                <h4 className="text-xs font-bold text-text-primary">No standups posted yet</h4>
                <p className="text-[10.5px] text-text-secondary font-medium leading-normal">
                  Log your daily standup morning status using the button above.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

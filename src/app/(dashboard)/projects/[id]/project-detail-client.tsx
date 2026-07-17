"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconArrowLeft,
  IconCurrencyRupee,
  IconUsers,
  IconTrendingUp,
  IconCalendar,
  IconBriefcase,
  IconCreditCard,
  IconActivity,
  IconLayoutDashboard,
  IconCode,
  IconWorld,
  IconEdit,
  IconClock,
  IconPlus,
  IconLoader,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ProjectForm, type ProjectFormValues } from "@/components/projects/project-form";
import { updateProject } from "../actions";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type PaymentRecord = {
  id: string;
  amount: number;
  method: string;
  status: string;
  paidAt: string;
  reference: string | null;
  notes: string | null;
};

type MemberRecord = {
  id: string;
  roleOnProject: string | null;
  assignedAt: string;
  teamMember: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      image: string | null;
    };
  };
};

type ActivityRecord = {
  id: string;
  action: string;
  detail: string | null;
  createdAt: string;
};

type NoteRecord = {
  id: string;
  content: string;
  createdAt: string;
  createdBy: { name: string } | null;
};

type Project = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  budget: number;
  progress: number;
  techStack: string[];
  startDate: string | null;
  deadline: string | null;
  completedAt: string | null;
  createdAt: string;
  client: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  };
  payments: PaymentRecord[];
  members: MemberRecord[];
  activities: ActivityRecord[];
  notes: NoteRecord[];
};

/* ------------------------------------------------------------------ */
/*  Tab definitions                                                    */
/* ------------------------------------------------------------------ */

const TABS = [
  { key: "overview", label: "Overview", icon: IconLayoutDashboard },
  { key: "payments", label: "Payments", icon: IconCreditCard },
  { key: "team", label: "Team", icon: IconUsers },
  { key: "activity", label: "Activity", icon: IconActivity },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getStatusBadgeClasses(status: string) {
  switch (status) {
    case "NEW":
      return "bg-slate-100 text-slate-600";
    case "ONGOING":
      return "bg-blue-50 text-blue-600";
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-600";
    case "ON_HOLD":
      return "bg-indigo-50 text-indigo-600";
    case "REVIEW":
      return "bg-amber-50 text-amber-600";
    case "CANCELLED":
      return "bg-rose-50 text-rose-600";
    default:
      return "bg-stone-100 text-stone-600";
  }
}

function getPaymentStatusClasses(status: string) {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-600";
    case "PENDING":
      return "bg-amber-50 text-amber-600";
    case "FAILED":
      return "bg-rose-50 text-rose-600";
    default:
      return "bg-stone-100 text-stone-600";
  }
}

function formatCurrency(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateShort(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function formatDeadlineDate(d: string) {
  const dateObj = new Date(d);
  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const year = dateObj.getFullYear();
  return `${day}/${month}/${year}`;
}

function timeAgo(d: string) {
  const seconds = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
type ClientOption = {
  id: string;
  name: string;
};

type TeamMemberOption = {
  id: string;
  user: {
    id: string;
    name: string;
  };
};

type ProjectDetailClientProps = {
  project: Project;
  clients: ClientOption[];
  teamMembers: TeamMemberOption[];
};

export function ProjectDetailClient({ project, clients, teamMembers }: ProjectDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");

  // Deferred rendering state to keep sheet open animation lag-free
  const [isEditRendered, setIsEditRendered] = useState(false);

  useEffect(() => {
    if (isSheetOpen) {
      const timer = setTimeout(() => setIsEditRendered(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsEditRendered(false);
    }
  }, [isSheetOpen]);

  const handleEditSubmit = (values: ProjectFormValues) => {
    setErrorMsg("");
    startTransition(async () => {
      const res = await updateProject(project.id, values);
      if (res.success) {
        setIsSheetOpen(false);
        router.refresh();
      } else {
        setErrorMsg(res.error || "Failed to update project.");
      }
    });
  };

  // Financial calculations
  const totalBudget = Number(project.budget);
  const totalPaid = project.payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const remaining = totalBudget - totalPaid;
  const progressPercent = totalBudget > 0 ? Math.min(100, Math.round((totalPaid / totalBudget) * 100)) : 0;

  // Running pending total for payments tab
  let runningPendingSum = 0;
  const paymentsWithRunning = [...project.payments].reverse().map((pmt) => {
    if (pmt.status === "PENDING") {
      runningPendingSum += Number(pmt.amount);
    }
    return { ...pmt, runningPending: runningPendingSum };
  }).reverse();

  // Parse domain info from description
  const domainMatch = project.description?.match(/\[Domain:\s*([^\s|\]]+)/);
  const domainExpiryMatch = project.description?.match(/Expires:\s*([^\s\]]+)/);
  const domainName = domainMatch?.[1] || null;
  const domainExpiry = domainExpiryMatch?.[1] || null;
  const cleanDescription = project.description
    ?.replace(/\[Domain:[^\]]*\]\n?/, "")
    ?.replace(/\[Retainer\]\s?/, "")
    ?.trim() || null;

  const isRetainer = project.description?.toLowerCase().includes("retainer") || false;

  // Deadline calculations
  const deadlineDate = project.deadline ? new Date(project.deadline) : null;
  const startDate = project.startDate ? new Date(project.startDate) : new Date(project.createdAt);
  const now = new Date();

  let daysLeft = 0;
  let timeElapsedPercent = 0;
  let deadlineBadgeLabel = "";
  let deadlineBadgeClass = "";
  let deadlineFeedback = "";

  if (deadlineDate) {
    const totalTime = deadlineDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    timeElapsedPercent = totalTime > 0 ? Math.min(100, Math.max(0, Math.round((elapsed / totalTime) * 100))) : 0;
    
    const diffTime = deadlineDate.getTime() - now.getTime();
    daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
      deadlineBadgeLabel = "Overdue";
      deadlineBadgeClass = "bg-rose-50 text-rose-600 border border-rose-200/50";
      deadlineFeedback = "Timeline overdue: review deliverables immediately.";
    } else if (daysLeft <= 7) {
      deadlineBadgeLabel = "Tight";
      deadlineBadgeClass = "bg-amber-50 text-amber-700 border border-amber-200/50";
      deadlineFeedback = "Tight timeline: prioritize high-impact tasks.";
    } else {
      deadlineBadgeLabel = "On Track";
      deadlineBadgeClass = "bg-emerald-50 text-emerald-600 border border-emerald-200/50";
      deadlineFeedback = "Timeline on track: regular progress matches schedule.";
    }
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Back button */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-brand-orange transition-colors select-none"
      >
        <IconArrowLeft className="h-4 w-4" /> Back to Projects
      </Link>

      {/* Hero Project Card */}
      <div className="bg-surface-white border border-border rounded-xl p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-extrabold tracking-tight text-text-primary capitalize">
                {project.name}
              </h1>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${getStatusBadgeClasses(project.status)}`}>
                {project.status.replace("_", " ").toLowerCase()}
              </span>
              {isRetainer && (
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-purple-50 text-purple-600">
                  Retainer
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-text-secondary flex items-center gap-1.5">
              <IconBriefcase className="h-4 w-4 text-text-secondary/70" />
              Client: <Link href={`/clients/${project.client.id}`} className="text-brand-orange hover:underline capitalize">{project.client.name}</Link>
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
            {/* Edit Drawer sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 border-border bg-surface-white hover:bg-surface-page font-bold text-xs cursor-pointer select-none shadow-sm flex items-center gap-1.5"
                  >
                    <IconEdit className="h-3.5 w-3.5" /> Edit Project
                  </Button>
                }
              />
              <SheetContent className="w-full sm:max-w-[950px] p-6 bg-surface-white border-l border-border h-full flex flex-col justify-between overflow-y-auto">
                <div className="space-y-6">
                  <SheetHeader>
                    <SheetTitle className="text-lg font-bold text-text-primary">
                      Edit Project Details
                    </SheetTitle>
                    <SheetDescription className="text-xs text-text-secondary mt-1">
                      Modify project parameters, status, or technology tags.
                    </SheetDescription>
                  </SheetHeader>

                  {isEditRendered ? (
                    <ProjectForm
                      onSubmit={handleEditSubmit}
                      clients={clients}
                      teamMembers={teamMembers}
                      defaultValues={{
                        name: project.name,
                        clientId: project.client.id,
                        description: cleanDescription || "",
                        budget: Number(project.budget),
                        status: project.status as "NEW" | "ONGOING" | "REVIEW" | "COMPLETED" | "ON_HOLD" | "CANCELLED",
                        progress: project.progress,
                        startDate: project.startDate
                          ? new Date(project.startDate).toISOString().split("T")[0]
                          : "",
                        deadline: project.deadline
                          ? new Date(project.deadline).toISOString().split("T")[0]
                          : "",
                        techStack: project.techStack,
                        domain: domainName || "",
                        domainExpiry: domainExpiry || "",
                        projectType: isRetainer ? "retainer" : "one-off",
                        teamMemberAssignments: project.members ? project.members.map((m) => ({ teamMemberId: m.teamMember.id, roleOnProject: m.roleOnProject || "" })) : [],
                      }}
                      onCancel={() => setIsSheetOpen(false)}
                      isPending={isPending}
                      errorMsg={errorMsg}
                      submitLabel="Save Changes"
                    />
                  ) : (
                    <div className="h-64 flex items-center justify-center">
                      <IconLoader className="h-6 w-6 text-text-secondary animate-spin" />
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
            <span className="text-xs text-text-secondary font-medium hidden sm:block">
              Created: {formatDate(project.createdAt)}
            </span>
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-border/60">
          {/* Budget */}
          <div className="bg-surface-page/60 border border-border/50 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[9px] font-extrabold text-text-secondary uppercase tracking-wider">Total Budget</p>
              <p className="text-xl font-black text-text-primary mt-0.5">{formatCurrency(totalBudget)}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-brand-orange-tint/15 flex items-center justify-center shrink-0">
              <IconCurrencyRupee className="h-5 w-5 text-brand-orange" />
            </div>
          </div>

          {/* Paid */}
          <div className="bg-surface-page/60 border border-border/50 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[9px] font-extrabold text-text-secondary uppercase tracking-wider">Total Paid</p>
              <p className="text-xl font-black text-emerald-600 mt-0.5">{formatCurrency(totalPaid)}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
              <IconCurrencyRupee className="h-5 w-5 text-emerald-600" />
            </div>
          </div>

          {/* Remaining */}
          <div className="bg-surface-page/60 border border-border/50 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[9px] font-extrabold text-text-secondary uppercase tracking-wider">Remaining</p>
              <p className="text-xl font-black text-amber-600 mt-0.5">{formatCurrency(remaining)}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
              <IconTrendingUp className="h-5 w-5 text-amber-600" />
            </div>
          </div>

          {/* Team Members */}
          <div className="bg-surface-page/60 border border-border/50 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[9px] font-extrabold text-text-secondary uppercase tracking-wider">Team Members</p>
              <p className="text-xl font-black text-text-primary mt-0.5">{project.members.length}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <IconUsers className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border flex items-center gap-1 overflow-x-auto scrollbar-hide select-none">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider border-b-2 rounded-t-lg transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? "border-brand-orange text-brand-orange bg-brand-orange-tint/10"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ═══════════════ OVERVIEW TAB ═══════════════ */}
      {activeTab === "overview" && (
        <div className="animate-in fade-in duration-200 grid gap-5 md:grid-cols-2">
          {/* Left column */}
          <div className="space-y-5">
            {/* Description */}
            <div className="bg-surface-white border border-border rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 mb-3">
                <IconBriefcase className="h-4.5 w-4.5 text-brand-orange" /> Project Description
              </h3>
              {cleanDescription ? (
                <p className="text-xs text-text-secondary font-medium leading-relaxed whitespace-pre-wrap">{cleanDescription}</p>
              ) : (
                <p className="text-xs text-text-secondary/60 italic font-medium">No description provided.</p>
              )}
            </div>

            {/* Tech Stack */}
            <div className="bg-surface-white border border-border rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 mb-3">
                <IconCode className="h-4.5 w-4.5 text-brand-orange" /> Technologies Used
              </h3>
              {project.techStack.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {project.techStack.map((tag) => (
                    <span key={tag} className="inline-flex items-center rounded-md bg-brand-orange-tint/15 border border-brand-orange-tint/20 px-2.5 py-1 text-xs font-bold text-brand-orange">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-secondary/60 italic font-medium">No technologies specified.</p>
              )}
            </div>

            {/* Domain & Hosting */}
            {domainName && (
              <div className="bg-surface-white border border-border rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 mb-3">
                  <IconWorld className="h-4.5 w-4.5 text-brand-orange" /> Domain & Hosting
                </h3>
                <div className="space-y-1.5 text-xs font-semibold text-text-secondary">
                  <p>Domain: <span className="text-text-primary font-bold">{domainName}</span></p>
                  {domainExpiry && <p>Expires: <span className="text-text-primary font-bold">{domainExpiry}</span></p>}
                </div>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* Budget Progress */}
            <div className="bg-surface-white border border-border rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 mb-3">
                <IconTrendingUp className="h-4.5 w-4.5 text-brand-orange" /> Budget Progress
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-extrabold text-text-secondary">
                  <span>Collected</span>
                  <span className="text-text-primary">{formatCurrency(totalPaid)} / {formatCurrency(totalBudget)}</span>
                </div>
                <div className="w-full bg-border rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-brand-orange h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs font-extrabold">
                  <span className="text-amber-600">Pending: {formatCurrency(remaining)}</span>
                  <span className="text-text-secondary">{progressPercent}% Done</span>
                </div>
              </div>
            </div>

            {/* Timeline / Deadline Progress Card */}
            {project.deadline ? (
              <div className="bg-surface-white border border-border rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Deadline</span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${deadlineBadgeClass}`}>
                    {deadlineBadgeLabel}
                  </span>
                </div>
                
                <p className="text-2xl font-black text-text-primary tracking-tight">
                  {formatDeadlineDate(project.deadline)}
                </p>

                {/* Progress bar representing time elapsed */}
                <div className="space-y-2">
                  <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${timeElapsedPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs font-semibold text-text-secondary">
                    <span>
                      {daysLeft < 0 
                        ? `${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? "" : "s"} overdue` 
                        : daysLeft === 0 
                        ? "Due today" 
                        : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
                    </span>
                    <span>{timeElapsedPercent}% of time elapsed</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/40 text-xs font-semibold text-text-secondary">
                  {deadlineFeedback}
                </div>
              </div>
            ) : (
              <div className="bg-surface-white border border-border rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 mb-3">
                  <IconCalendar className="h-4.5 w-4.5 text-brand-orange" /> Timeline
                </h3>
                <div className="space-y-2.5 text-xs font-semibold text-text-secondary">
                  <div className="flex justify-between">
                    <span>Created</span>
                    <span className="text-text-primary font-bold">{formatDate(project.createdAt)}</span>
                  </div>
                  {project.startDate && (
                    <div className="flex justify-between">
                      <span>Start Date</span>
                      <span className="text-text-primary font-bold">{formatDate(project.startDate)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Deadline</span>
                    <span className="text-text-secondary font-medium">No deadline set</span>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Payments (Top 3) */}
            <div className="bg-surface-white border border-border rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 mb-3">
                <IconCreditCard className="h-4.5 w-4.5 text-brand-orange" /> Recent Payments
              </h3>
              {project.payments.length > 0 ? (
                <div className="space-y-2.5">
                  {project.payments.slice(0, 3).map((pmt) => (
                    <div key={pmt.id} className="flex items-center justify-between p-2.5 bg-surface-page/50 border border-border/40 rounded-lg">
                      <div>
                        <span className="text-xs font-black text-text-primary">{formatCurrency(Number(pmt.amount))}</span>
                        <p className="text-[10px] text-text-secondary font-medium capitalize">{pmt.method.toLowerCase()} • {formatDateShort(pmt.paidAt)}</p>
                      </div>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${getPaymentStatusClasses(pmt.status)}`}>
                        {pmt.status.toLowerCase()}
                      </span>
                    </div>
                  ))}
                  {project.payments.length > 3 && (
                    <button
                      onClick={() => setActiveTab("payments")}
                      className="text-[10px] text-brand-orange font-bold hover:underline cursor-pointer"
                    >
                      View all {project.payments.length} payments →
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-text-secondary/60 italic font-medium py-4 text-center">No payments recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ PAYMENTS TAB ═══════════════ */}
      {activeTab === "payments" && (
        <div className="animate-in fade-in duration-200">
          <div className="bg-surface-white border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 mb-4">
              <IconCreditCard className="h-5 w-5 text-brand-orange" /> Payment Ledger
            </h3>

            {paymentsWithRunning.length > 0 ? (
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/60 text-text-secondary font-bold">
                      <th className="pb-3 font-semibold">Date</th>
                      <th className="pb-3 font-semibold">Method</th>
                      <th className="pb-3 font-semibold">Reference</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 text-right font-semibold">Running Pending</th>
                      <th className="pb-3 text-right font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentsWithRunning.map((pmt) => (
                      <tr key={pmt.id} className="border-b border-border/30 hover:bg-surface-page/50 transition-colors">
                        <td className="py-3 text-text-primary font-semibold">{formatDate(pmt.paidAt)}</td>
                        <td className="py-3 text-text-secondary font-medium capitalize">{pmt.method.toLowerCase()}</td>
                        <td className="py-3 text-text-secondary font-medium">{pmt.reference || "—"}</td>
                        <td className="py-3">
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${getPaymentStatusClasses(pmt.status)}`}>
                            {pmt.status.toLowerCase()}
                          </span>
                        </td>
                        <td className="py-3 text-right text-amber-600 font-bold">{formatCurrency(pmt.runningPending)}</td>
                        <td className="py-3 text-right text-text-primary font-black">{formatCurrency(Number(pmt.amount))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-text-secondary text-xs flex items-center justify-center gap-1.5 border border-dashed border-border rounded-lg">
                No payments recorded for this project.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════ TEAM TAB ═══════════════ */}
      {activeTab === "team" && (
        <div className="animate-in fade-in duration-200">
          <div className="bg-surface-white border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 mb-4">
              <IconUsers className="h-5 w-5 text-brand-orange" /> Assigned Team
            </h3>

            {project.members.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {project.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-4 bg-surface-page/50 border border-border/40 rounded-xl hover:shadow-sm transition-all"
                  >
                    <div className="w-10 h-10 rounded-full bg-brand-orange-tint/15 text-brand-orange text-sm font-black flex items-center justify-center shrink-0">
                      {member.teamMember.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-text-primary truncate">{member.teamMember.user.name}</p>
                      {member.roleOnProject && (
                        <p className="text-[10px] font-bold text-brand-orange uppercase tracking-wider">{member.roleOnProject}</p>
                      )}
                      <p className="text-[10px] text-text-secondary font-medium truncate">{member.teamMember.user.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-text-secondary text-xs flex items-center justify-center gap-1.5 border border-dashed border-border rounded-lg">
                No team members assigned to this project.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════ ACTIVITY TAB ═══════════════ */}
      {activeTab === "activity" && (
        <div className="animate-in fade-in duration-200">
          <div className="bg-surface-white border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 mb-4">
              <IconActivity className="h-5 w-5 text-brand-orange" /> Activity Timeline
            </h3>

            {project.activities.length > 0 ? (
              <div className="space-y-0">
                {project.activities.map((act, idx) => (
                  <div key={act.id} className="flex gap-3">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-brand-orange border-2 border-brand-orange-tint/30 shrink-0 mt-1.5" />
                      {idx < project.activities.length - 1 && (
                        <div className="w-0.5 flex-1 bg-border/60 min-h-[24px]" />
                      )}
                    </div>
                    {/* Content */}
                    <div className="pb-4 min-w-0">
                      <p className="text-xs font-black text-text-primary capitalize">
                        {act.action.replace(/_/g, " ")}
                      </p>
                      {act.detail && (
                        <p className="text-[11px] text-text-secondary font-medium mt-0.5">{act.detail}</p>
                      )}
                      <p className="text-[10px] text-text-secondary/70 font-medium mt-1 flex items-center gap-1">
                        <IconClock className="h-3 w-3" />
                        {timeAgo(act.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-text-secondary text-xs flex items-center justify-center gap-1.5 border border-dashed border-border rounded-lg">
                No activity logged for this project yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

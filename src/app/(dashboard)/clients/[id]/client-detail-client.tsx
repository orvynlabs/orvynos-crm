"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  IconArrowLeft,
  IconPhone,
  IconMail,
  IconWorld,
  IconReceipt,
  IconMapPin,
  IconBriefcase,
  IconCreditCard,
  IconCalendar,
  IconAlertCircle,
  IconTrendingUp,
  IconFileText,
  IconActivity,
  IconLayoutDashboard,
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
import { ClientForm, type ClientFormValues } from "@/components/clients/client-form";
import { updateClient } from "../actions";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ProjectActivity = {
  id: string;
  projectId: string;
  action: string;
  detail: string | null;
  createdAt: string;
};

type Project = {
  id: string;
  name: string;
  status: string;
  budget: number;
  progress: number;
  techStack: string[];
  startDate: string | null;
  deadline: string | null;
  createdAt: string;
  activities?: ProjectActivity[];
};

type Payment = {
  id: string;
  amount: number;
  method: string;
  status: string;
  paidAt: string;
  project: {
    name: string;
  } | null;
};

type ClientNote = {
  id: string;
  content: string;
  createdAt: string;
};

type Client = {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  gstin: string | null;
  createdAt: string;
  projects: Project[];
  payments: Payment[];
  notes: ClientNote[];
};

type ClientDetailClientProps = {
  client: Client;
};

/* ------------------------------------------------------------------ */
/*  Tab definitions                                                    */
/* ------------------------------------------------------------------ */

const TABS = [
  { key: "overview", label: "Overview", icon: IconLayoutDashboard },
  { key: "projects", label: "Projects", icon: IconBriefcase },
  { key: "payments", label: "Payments", icon: IconCreditCard },
  { key: "documents", label: "Documents", icon: IconFileText },
  { key: "activity", label: "Activity", icon: IconActivity },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ClientDetailClient({ client }: ClientDetailClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");

  // Calculate totals
  const totalProjects = client.projects.length;
  const activeProjects = client.projects.filter(
    (p) => p.status !== "COMPLETED" && p.status !== "CANCELLED"
  ).length;

  const totalCollected = client.payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const totalPending = client.payments
    .filter((p) => p.status === "PENDING")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  // Calculate running pending total (oldest to newest)
  let runningPendingSum = 0;
  const paymentsWithRunningPending = [...client.payments]
    .reverse()
    .map((pmt) => {
      if (pmt.status === "PENDING") {
        runningPendingSum += Number(pmt.amount);
      }
      return {
        ...pmt,
        runningPending: runningPendingSum,
      };
    })
    .reverse(); // Reverse back to original display order (newest first)

  // Merge and sort all project activities chronologically (newest first)
  const activities = client.projects
    .flatMap((proj) =>
      (proj.activities || []).map((act) => ({
        ...act,
        projectName: proj.name,
      }))
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "ONGOING":
        return "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400";
      case "COMPLETED":
        return "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400";
      case "NEW":
        return "bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400";
      case "REVIEW":
        return "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400";
      case "ON_HOLD":
        return "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400";
      default:
        return "bg-stone-50 dark:bg-stone-900/40 text-stone-600 dark:text-stone-400";
    }
  };

  const handleEditSubmit = (values: ClientFormValues) => {
    setErrorMsg("");
    startTransition(async () => {
      const res = await updateClient(client.id, values);
      if (res.success) {
        setIsSheetOpen(false);
      } else {
        setErrorMsg(res.error || "Failed to update profile.");
      }
    });
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Back button */}
      <Link
        href="/clients"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-brand-orange transition-colors select-none"
      >
        <IconArrowLeft className="h-4 w-4" /> Back to Clients
      </Link>

      {/* Hero Client Card */}
      <div className="bg-surface-white border border-border rounded-xl p-6 shadow-sm relative">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold tracking-tight text-text-primary capitalize">
                {client.name}
              </h1>
              <span className="text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Active Partner
              </span>
            </div>
            {client.contactName && (
              <p className="text-sm font-semibold text-text-secondary">
                Primary Contact: {client.contactName}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            {/* Edit Drawer sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 border-border bg-surface-white hover:bg-surface-page font-bold text-xs cursor-pointer select-none shadow-sm"
                  >
                    Edit Client
                  </Button>
                }
              />
              <SheetContent className="w-full max-w-[450px] p-6 bg-surface-white border-l border-border h-full flex flex-col justify-between overflow-y-auto">
                <div className="space-y-6">
                  <SheetHeader>
                    <SheetTitle className="text-lg font-bold text-text-primary">
                      Edit Client Profile
                    </SheetTitle>
                    <SheetDescription className="text-xs text-text-secondary mt-1">
                      Update this client&apos;s profile details. Fields with * are required.
                    </SheetDescription>
                  </SheetHeader>

                  <ClientForm
                    onSubmit={handleEditSubmit}
                    onCancel={() => setIsSheetOpen(false)}
                    isPending={isPending}
                    errorMsg={errorMsg}
                    submitLabel="Save Changes"
                    defaultValues={{
                      name: client.name,
                      contactName: client.contactName || "",
                      email: client.email || "",
                      phone: client.phone || "",
                      website: client.website || "",
                      address: client.address || "",
                      city: client.city || "",
                      state: client.state || "",
                    }}
                  />
                </div>
              </SheetContent>
            </Sheet>

            <span className="text-xs text-text-secondary font-medium">
              Registered: {new Date(client.createdAt).toLocaleDateString("en-IN")}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid gap-4 mt-6 sm:grid-cols-2 md:grid-cols-3 pt-6 border-t border-border/60 text-xs">
          {client.email && (
            <div className="flex items-center gap-2.5 text-text-primary">
              <IconMail className="h-4.5 w-4.5 text-text-secondary" />
              <a href={`mailto:${client.email}`} className="hover:text-brand-orange font-semibold">
                {client.email}
              </a>
            </div>
          )}
          {client.phone && (
            <div className="flex items-center gap-2.5 text-text-primary">
              <IconPhone className="h-4.5 w-4.5 text-text-secondary" />
              <a href={`tel:${client.phone}`} className="hover:text-brand-orange font-semibold">
                {client.phone}
              </a>
            </div>
          )}
          {client.website && (
            <div className="flex items-center gap-2.5 text-text-primary">
              <IconWorld className="h-4.5 w-4.5 text-text-secondary" />
              <a
                href={client.website}
                target="_blank"
                rel="noreferrer"
                className="hover:text-brand-orange font-semibold"
              >
                {client.website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          )}
          {client.gstin && (
            <div className="flex items-center gap-2.5 text-text-primary">
              <IconReceipt className="h-4.5 w-4.5 text-text-secondary" />
              <span className="font-semibold uppercase">GSTIN: {client.gstin}</span>
            </div>
          )}
          {(client.address || client.city) && (
            <div className="flex items-center gap-2.5 text-text-primary sm:col-span-2">
              <IconMapPin className="h-4.5 w-4.5 text-text-secondary" />
              <span className="font-semibold text-text-secondary">
                {client.address && `${client.address}, `}
                {client.city}
                {client.state && `, ${client.state}`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* METRIC GRID PANEL */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="bg-surface-white border border-border rounded-xl p-4 shadow-sm">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
            Total Projects
          </span>
          <span className="text-xl font-extrabold text-text-primary mt-1 block">
            {totalProjects}
          </span>
        </div>
        <div className="bg-surface-white border border-border rounded-xl p-4 shadow-sm">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
            Active Projects
          </span>
          <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">
            {activeProjects}
          </span>
        </div>
        <div className="bg-surface-white border border-border rounded-xl p-4 shadow-sm">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
            Collected Revenue
          </span>
          <span className="text-xl font-extrabold text-text-primary mt-1 block">
            ₹{totalCollected.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="bg-surface-white border border-border rounded-xl p-4 shadow-sm">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
            Pending Balance
          </span>
          <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-1 block">
            ₹{totalPending.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  TAB NAVIGATION                                               */}
      {/* ============================================================ */}
      <div className="border-b border-border">
        <nav className="flex gap-0 -mb-px overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  flex items-center gap-2 px-4 py-3.5 text-xs font-bold whitespace-nowrap
                  border-b-2 transition-all duration-100 active:scale-95 cursor-pointer select-none
                  ${
                    isActive
                      ? "border-brand-orange text-brand-orange"
                      : "border-transparent text-text-secondary hover:text-text-primary hover:border-border"
                  }
                `}
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                <tab.icon className="h-4 w-4" stroke={1.75} />
                {tab.label}
                {/* Badge counts for projects and payments */}
                {tab.key === "projects" && client.projects.length > 0 && (
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${isActive ? "bg-brand-orange/10 text-brand-orange" : "bg-surface-page text-text-secondary"}`}>
                    {client.projects.length}
                  </span>
                )}
                {tab.key === "payments" && client.payments.length > 0 && (
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${isActive ? "bg-brand-orange/10 text-brand-orange" : "bg-surface-page text-text-secondary"}`}>
                    {client.payments.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ============================================================ */}
      {/*  TAB CONTENT                                                  */}
      {/* ============================================================ */}

      {/* — OVERVIEW TAB — */}
      {activeTab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-3 animate-in fade-in duration-200">
          {/* Left: quick summary of projects + payments */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Projects (top 3) */}
            <div className="bg-surface-white border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <IconBriefcase className="h-5 w-5 text-brand-orange" /> Recent Projects
                </h3>
                {client.projects.length > 3 && (
                  <button
                    onClick={() => setActiveTab("projects")}
                    className="text-[10px] font-bold text-brand-orange hover:underline cursor-pointer select-none"
                  >
                    View all →
                  </button>
                )}
              </div>

              {client.projects.length > 0 ? (
                <div className="space-y-3">
                  {client.projects.slice(0, 3).map((project) => (
                    <div
                      key={project.id}
                      className="border border-border/70 rounded-lg p-3.5 bg-surface-page/50 hover:bg-surface-page/70 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-text-primary capitalize">
                          {project.name}
                        </span>
                        <span
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${getStatusStyles(project.status)}`}
                        >
                          {project.status.toLowerCase()}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-text-secondary font-medium">
                        <span>₹{Number(project.budget).toLocaleString("en-IN")}</span>
                        <span>{project.progress}% complete</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-text-secondary text-xs flex items-center justify-center gap-1.5 border border-dashed border-border rounded-lg">
                  <IconAlertCircle className="h-4.5 w-4.5" /> No projects yet.
                </div>
              )}
            </div>

            {/* Recent Payments (top 3) */}
            <div className="bg-surface-white border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <IconCreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> Recent Payments
                </h3>
                {client.payments.length > 3 && (
                  <button
                    onClick={() => setActiveTab("payments")}
                    className="text-[10px] font-bold text-brand-orange hover:underline cursor-pointer select-none"
                  >
                    View all →
                  </button>
                )}
              </div>

              {client.payments.length > 0 ? (
                <div className="space-y-3">
                  {client.payments.slice(0, 3).map((pmt) => (
                    <div
                      key={pmt.id}
                      className="flex items-center justify-between border border-border/70 rounded-lg p-3.5 bg-surface-page/50"
                    >
                      <div>
                        <span className="text-xs font-bold text-text-primary capitalize block">
                          {pmt.project?.name || "Client Level Payment"}
                        </span>
                        <span className="text-[10px] text-text-secondary font-medium">
                          {new Date(pmt.paidAt).toLocaleDateString("en-IN")} · {pmt.method.replace("_", " ")}
                        </span>
                      </div>
                      <span
                        className={`text-sm font-bold ${
                          pmt.status === "COMPLETED"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        ₹{Number(pmt.amount).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-text-secondary text-xs flex items-center justify-center gap-1.5 border border-dashed border-border rounded-lg">
                  <IconAlertCircle className="h-4.5 w-4.5" /> No payments yet.
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar: Contract Statistics + Notes */}
          <div className="space-y-6">
            {/* Contract statistics */}
            <div className="bg-surface-white border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-text-primary mb-4">Contract Statistics</h3>
              <div className="space-y-4">
                <div className="p-3.5 bg-surface-page rounded-lg border border-border/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-text-secondary">Conversion Value</span>
                    <div className="flex items-center gap-0.5 text-emerald-600 font-bold text-[10px]">
                      <IconTrendingUp className="h-3.5 w-3.5" /> Active Client
                    </div>
                  </div>
                  <span className="text-2xl font-extrabold text-text-primary mt-2 block">
                    ₹{(totalCollected + totalPending).toLocaleString("en-IN")}
                  </span>
                  <p className="text-[10px] text-text-secondary mt-1">
                    Sum of collected funds and outstanding invoices
                  </p>
                </div>

                {/* Progress visual */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Collected Ratio</span>
                    <span>
                      {totalCollected + totalPending > 0
                        ? Math.round((totalCollected / (totalCollected + totalPending)) * 100)
                        : 100}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-border rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          totalCollected + totalPending > 0
                            ? (totalCollected / (totalCollected + totalPending)) * 100
                            : 100
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div className="pt-2 divide-y divide-border/60 text-xs">
                  <div className="py-2.5 flex justify-between">
                    <span className="text-text-secondary font-medium">Projects Done</span>
                    <span className="font-bold text-text-primary">
                      {client.projects.filter((p) => p.status === "COMPLETED").length}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-text-secondary font-medium">Ongoing Milestones</span>
                    <span className="font-bold text-text-primary">
                      {client.projects.filter((p) => p.status === "ONGOING").length}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-text-secondary font-medium">Total Paid-out Invoices</span>
                    <span className="font-bold text-text-primary">
                      {client.payments.filter((p) => p.status === "COMPLETED").length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Client Notes list */}
            <div className="bg-surface-white border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-text-primary mb-3">Client Notes</h3>
              {client.notes && client.notes.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto divide-y divide-border/60">
                  {client.notes.map((note) => (
                    <div key={note.id} className="pt-3 first:pt-0">
                      <p className="text-xs text-text-primary whitespace-pre-wrap font-medium">
                        {note.content}
                      </p>
                      <span className="text-[9px] text-text-secondary mt-1 block">
                        {new Date(note.createdAt).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-secondary italic">No notes added yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* — PROJECTS TAB — */}
      {activeTab === "projects" && (
        <div className="animate-in fade-in duration-200">
          <div className="bg-surface-white border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 mb-4">
              <IconBriefcase className="h-5 w-5 text-brand-orange" /> Projects Ledger
            </h3>

            {client.projects.length > 0 ? (
              <div className="space-y-4">
                {client.projects.map((project) => (
                  <div
                    key={project.id}
                    className="border border-border/70 rounded-lg p-4 bg-surface-page/50 hover:bg-surface-page/70 transition-colors flex flex-col justify-between"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-0.5">
                        <span className="text-sm font-bold text-text-primary capitalize block">
                          {project.name}
                        </span>
                        {project.techStack.length > 0 && (
                          <span className="text-[10px] text-text-secondary block">
                            Tech stack: {project.techStack.join(", ")}
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider self-start ${getStatusStyles(project.status)}`}
                      >
                        {project.status.toLowerCase()}
                      </span>
                    </div>

                    {/* Progress slider bar */}
                    <div className="mt-4 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-semibold text-text-secondary">
                        <span>Milestone Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-brand-orange h-full rounded-full transition-all duration-500"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Footer values */}
                    <div className="mt-4 pt-3 border-t border-border/40 flex flex-wrap gap-2 items-center justify-between text-[11px] text-text-secondary font-semibold">
                      <span>Budget: ₹{Number(project.budget).toLocaleString("en-IN")}</span>
                      <div className="flex gap-3">
                        {project.startDate && (
                          <span>Start Date: {new Date(project.startDate).toLocaleDateString("en-IN")}</span>
                        )}
                        {project.deadline && (
                          <span>Deadline: {new Date(project.deadline).toLocaleDateString("en-IN")}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-text-secondary text-xs flex items-center justify-center gap-1.5 border border-dashed border-border rounded-lg">
                <IconAlertCircle className="h-4.5 w-4.5" /> No projects assigned to this partner.
              </div>
            )}
          </div>
        </div>
      )}

      {/* — PAYMENTS TAB — */}
      {activeTab === "payments" && (
        <div className="animate-in fade-in duration-200">
          <div className="bg-surface-white border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 mb-4">
              <IconCreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> Payment Ledger
            </h3>

            {paymentsWithRunningPending.length > 0 ? (
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/60 text-text-secondary font-bold">
                      <th className="pb-3 font-semibold">Project Name</th>
                      <th className="pb-3 font-semibold">Method</th>
                      <th className="pb-3 font-semibold">Settled Date</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 text-right font-semibold">Running Pending Total</th>
                      <th className="pb-3 text-right font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {paymentsWithRunningPending.map((pmt) => (
                      <tr key={pmt.id} className="text-text-primary">
                        <td className="py-3 font-semibold capitalize">
                          {pmt.project?.name || "Client Level Payment"}
                        </td>
                        <td className="py-3 uppercase text-[9px] tracking-wider font-bold">
                          {pmt.method.replace("_", " ")}
                        </td>
                        <td className="py-3 text-text-secondary flex items-center gap-1.5">
                          <IconCalendar className="h-3.5 w-3.5 text-text-secondary/65" />
                          {new Date(pmt.paidAt).toLocaleDateString("en-IN")}
                        </td>
                        <td className="py-3">
                          <span
                            className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              pmt.status === "COMPLETED"
                                ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400"
                                : "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {pmt.status.toLowerCase()}
                          </span>
                        </td>
                        <td className="py-3 text-right font-semibold text-text-secondary">
                          ₹{pmt.runningPending.toLocaleString("en-IN")}
                        </td>
                        <td
                          className={`py-3 text-right font-bold ${
                            pmt.status === "COMPLETED"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          ₹{Number(pmt.amount).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-text-secondary text-xs flex items-center justify-center gap-1.5 border border-dashed border-border rounded-lg">
                <IconAlertCircle className="h-4.5 w-4.5" /> No transactions registered.
              </div>
            )}
          </div>
        </div>
      )}

      {/* — DOCUMENTS TAB — */}
      {activeTab === "documents" && (
        <div className="animate-in fade-in duration-200">
          <div className="bg-surface-white border border-border rounded-xl p-10 shadow-sm text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-orange/10 flex items-center justify-center mb-4">
              <IconFileText className="h-7 w-7 text-brand-orange" />
            </div>
            <h3 className="text-base font-bold text-text-primary mb-1.5">Documents</h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
              Proposals, agreements, invoices, and quotations for this client will appear here. This module is coming soon.
            </p>
            <div className="mt-5">
              <span className="text-[10px] font-extrabold bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full uppercase tracking-wider">
                Coming Soon
              </span>
            </div>
          </div>
        </div>
      )}

      {/* — ACTIVITY TAB — */}
      {activeTab === "activity" && (
        <div className="animate-in fade-in duration-200">
          <div className="bg-surface-white border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 mb-6">
              <IconActivity className="h-5 w-5 text-brand-orange" /> Project Activity Timeline
            </h3>

            {activities.length > 0 ? (
              <div className="relative border-l border-border dark:border-stone-850 ml-3 pl-6 space-y-6">
                {activities.map((act) => {
                  const getActionIcon = (action: string) => {
                    switch (action) {
                      case "status_changed":
                        return <IconBriefcase className="h-3 w-3 text-brand-orange" />;
                      case "payment_received":
                        return <IconCreditCard className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />;
                      case "progress_updated":
                        return <IconActivity className="h-3 w-3 text-indigo-500 dark:text-indigo-400" />;
                      default:
                        return <IconActivity className="h-3 w-3 text-text-secondary" />;
                    }
                  };

                  return (
                    <div key={act.id} className="relative space-y-1">
                      {/* Timeline dot */}
                      <div className="absolute -left-[31px] top-1 w-5.5 h-5.5 rounded-full border border-border bg-surface-page flex items-center justify-center select-none shadow-sm">
                        {getActionIcon(act.action)}
                      </div>

                      {/* Header row */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <span className="text-xs font-bold text-text-primary capitalize">
                          {act.projectName} &middot;{" "}
                          <span className="text-text-secondary font-semibold">
                            {act.action.replace(/_/g, " ")}
                          </span>
                        </span>
                        <span className="text-[10px] text-text-secondary font-medium">
                          {new Date(act.createdAt).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>

                      {/* Detail text */}
                      {act.detail && (
                        <p className="text-xs text-text-secondary font-medium leading-relaxed max-w-2xl whitespace-pre-wrap">
                          {act.detail}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-text-secondary text-xs flex flex-col items-center justify-center gap-2 border border-dashed border-border rounded-lg bg-surface-page/35">
                <IconAlertCircle className="h-6 w-6 text-text-secondary/80" />
                <span>No activities recorded for this partner&apos;s projects yet.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

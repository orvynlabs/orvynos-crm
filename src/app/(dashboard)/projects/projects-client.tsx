"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconSearch,
  IconPlus,
  IconAlertCircle,
  IconCalendar,
  IconFolder,
  IconBriefcase,
  IconEdit,
  IconCreditCard,
  IconUsers,
  IconDownload,
  IconArrowsRightLeft,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { ProjectForm, type ProjectFormValues } from "@/components/projects/project-form";
import { createProject, updateProject, updateProjectStatus } from "./actions";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type Client = {
  id: string;
  name: string;
};

type Payment = {
  id: string;
  amount: number;
  status: string;
};

type ProjectMember = {
  id: string;
  roleOnProject: string | null;
  teamMember: {
    id: string;
    user: {
      name: string;
    };
  };
};

type Project = {
  id: string;
  name: string;
  description: string | null;
  status: "NEW" | "ONGOING" | "REVIEW" | "COMPLETED" | "ON_HOLD" | "CANCELLED";
  budget: number;
  progress: number;
  techStack: string[];
  startDate: string | null;
  deadline: string | null;
  createdAt: string;
  client: Client;
  payments: Payment[];
  members: ProjectMember[];
};

type TeamMemberOption = {
  id: string;
  user: {
    id: string;
    name: string;
  };
};

type ProjectsClientProps = {
  initialProjects: Project[];
  clients: Client[];
  teamMembers: TeamMemberOption[];
  metrics: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    onHoldProjects: number;
  };
};

const COLUMNS = [
  { key: "NEW", label: "New", color: "border-t-slate-400 bg-slate-500/10 text-slate-600 dark:text-slate-400" },
  { key: "ONGOING", label: "Ongoing", color: "border-t-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  { key: "COMPLETED", label: "Completed", color: "border-t-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
] as const;

type ColumnKey = (typeof COLUMNS)[number]["key"];

export function ProjectsClient({ initialProjects, clients, teamMembers }: ProjectsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");

  // Core local projects state for instant optimistic updates
  const [projects, setProjects] = useState<Project[]>(initialProjects);

  // Synchronize local projects state when initialProjects prop changes (e.g. from parent revalidations)
  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  // Sheet states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [createPresetStatus, setCreatePresetStatus] = useState<Project["status"]>("NEW");

  // Deferred rendering states to keep sheet open animation lag-free
  const [isCreateRendered, setIsCreateRendered] = useState(false);
  const [isEditRendered, setIsEditRendered] = useState(false);

  useEffect(() => {
    if (isCreateOpen) {
      const timer = setTimeout(() => setIsCreateRendered(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsCreateRendered(false);
    }
  }, [isCreateOpen]);

  useEffect(() => {
    if (editingProject) {
      const timer = setTimeout(() => setIsEditRendered(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsEditRendered(false);
    }
  }, [editingProject]);

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [clientFilter, setClientFilter] = useState<string>("ALL");

  // Kanban view states
  const [activeDragOverColumn, setActiveDragOverColumn] = useState<string | null>(null);
  const [mobileActiveColumn, setMobileActiveColumn] = useState<ColumnKey>("ONGOING");
  const [showMoveMenuForId, setShowMoveMenuForId] = useState<string | null>(null);

  // Calculate top level financial metrics
  const financialMetrics = useMemo(() => {
    const totalCount = projects.length;
    const ongoingCount = projects.filter((p) => p.status === "ONGOING").length;
    
    const budgetSum = projects.reduce((sum, p) => sum + Number(p.budget), 0);
    
    // Sum of all completed payments linked to any project
    const paidSum = projects.reduce((sum, p) => {
      const completedPmts = p.payments
        .filter((pmt) => pmt.status === "COMPLETED")
        .reduce((s, pmt) => s + Number(pmt.amount), 0);
      return sum + completedPmts;
    }, 0);

    const retainersCount = projects.filter((p) => 
      p.name.toLowerCase().includes("retainer") || 
      (p.description && p.description.toLowerCase().includes("retainer"))
    ).length;

    const retainersSum = projects
      .filter((p) => 
        p.name.toLowerCase().includes("retainer") || 
        (p.description && p.description.toLowerCase().includes("retainer"))
      )
      .reduce((sum, p) => sum + Number(p.budget), 0);

    return {
      totalCount,
      ongoingCount,
      budgetSum,
      paidSum,
      retainersCount,
      retainersSum,
    };
  }, [projects]);

  // Filter projects based on client selection & search query
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesClient =
        clientFilter === "ALL" || project.client.id === clientFilter;

      return matchesSearch && matchesClient;
    });
  }, [projects, searchQuery, clientFilter]);

  // Group filtered projects by status
  const groupedProjects = useMemo(() => {
    const groups: Record<Project["status"], Project[]> = {
      NEW: [],
      ONGOING: [],
      REVIEW: [],
      COMPLETED: [],
      ON_HOLD: [],
      CANCELLED: [],
    };
    filteredProjects.forEach((p) => {
      if (groups[p.status]) {
        groups[p.status].push(p);
      }
    });
    return groups;
  }, [filteredProjects]);

  // Calculate budget statistics per project card
  const getProjectFinances = (project: Project) => {
    const paid = project.payments
      .filter((pmt) => pmt.status === "COMPLETED")
      .reduce((sum, pmt) => sum + Number(pmt.amount), 0);
    const pending = Math.max(0, Number(project.budget) - paid);
    return { paid, pending };
  };

  // Drag and Drop Handlers with Optimistic UI updates
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    setActiveDragOverColumn(columnKey);
  };

  const handleDragLeave = () => {
    setActiveDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: ColumnKey) => {
    e.preventDefault();
    setActiveDragOverColumn(null);
    const projectId = e.dataTransfer.getData("text/plain");
    if (!projectId) return;

    // Check if status is actually changing
    const targetProj = projects.find((p) => p.id === projectId);
    if (targetProj && targetProj.status === targetStatus) return;

    const originalProjects = [...projects];

    // Optimistically update status locally (lag-free rendering)
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, status: targetStatus } : p))
    );

    startTransition(async () => {
      const res = await updateProjectStatus(projectId, targetStatus);
      if (!res.success) {
        // Rollback to original state on error
        setProjects(originalProjects);
        setErrorMsg(res.error || "Failed to update project status.");
      }
    });
  };

  const handleMoveToStatus = (projectId: string, targetStatus: ColumnKey) => {
    setShowMoveMenuForId(null);
    const targetProj = projects.find((p) => p.id === projectId);
    if (targetProj && targetProj.status === targetStatus) return;

    const originalProjects = [...projects];

    // Optimistically update status locally
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, status: targetStatus } : p))
    );

    startTransition(async () => {
      const res = await updateProjectStatus(projectId, targetStatus);
      if (!res.success) {
        // Rollback to original state on error
        setProjects(originalProjects);
        setErrorMsg(res.error || "Failed to update project status.");
      }
    });
  };

  // Data exports handlers
  const handleExportCSV = () => {
    if (filteredProjects.length === 0) return;
    const headers = "Project Name,Client Name,Status,Budget,Progress,Deadline,Description\n";
    const rows = filteredProjects.map((p) => {
      const desc = p.description ? p.description.replace(/"/g, '""') : "";
      return `"${p.name}","${p.client.name}","${p.status}",${p.budget},${p.progress}%,"${p.deadline || ""}","${desc}"`;
    }).join("\n");
    
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `projects-export-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    if (filteredProjects.length === 0) return;
    const blob = new Blob([JSON.stringify(filteredProjects, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `projects-export-${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Create Project submit handler
  const handleCreateSubmit = (values: ProjectFormValues) => {
    setErrorMsg("");
    startTransition(async () => {
      const res = await createProject(values);
      if (res.success) {
        setIsCreateOpen(false);
      } else {
        setErrorMsg(res.error || "Failed to create project.");
      }
    });
  };

  // Edit Project submit handler
  const handleEditSubmit = (values: ProjectFormValues) => {
    if (!editingProject) return;
    setErrorMsg("");
    startTransition(async () => {
      const res = await updateProject(editingProject.id, values);
      if (res.success) {
        setEditingProject(null);
      } else {
        setErrorMsg(res.error || "Failed to update project.");
      }
    });
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-text-primary">
            Projects Registry
          </h1>
          <p className="text-xs text-text-secondary font-medium">
            Manage your client projects and budgets.
          </p>
        </div>

        {/* Buttons / Actions */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            disabled={filteredProjects.length === 0}
            className="flex items-center gap-1.5 h-9 px-3.5 border border-border rounded-lg bg-surface-white hover:bg-surface-page text-xs font-bold text-text-secondary transition-colors cursor-pointer select-none disabled:opacity-50"
          >
            <IconDownload className="h-4 w-4" /> CSV
          </button>

          {/* JSON Export */}
          <button
            onClick={handleExportJSON}
            disabled={filteredProjects.length === 0}
            className="flex items-center gap-1.5 h-9 px-3.5 border border-border rounded-lg bg-surface-white hover:bg-surface-page text-xs font-bold text-text-secondary transition-colors cursor-pointer select-none disabled:opacity-50"
          >
            <IconDownload className="h-4 w-4" /> JSON
          </button>

          {/* New Project trigger sheet */}
          <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <SheetTrigger
              render={
                <Button
                  onClick={() => setCreatePresetStatus("NEW")}
                  className="bg-brand-orange hover:bg-brand-orange-hover text-white text-xs font-bold px-4 h-9 shadow-sm flex items-center gap-1.5 cursor-pointer select-none"
                >
                  <IconPlus className="h-4.5 w-4.5" /> New Project
                </Button>
              }
            />
            <SheetContent className="w-full sm:max-w-[950px] p-6 bg-surface-white border-l border-border h-full flex flex-col justify-between overflow-y-auto">
              <div className="space-y-6">
                <SheetHeader>
                  <SheetTitle className="text-lg font-bold text-text-primary">
                    Create New Project
                  </SheetTitle>
                  <SheetDescription className="text-xs text-text-secondary mt-1">
                    Provide project parameters to initialize a contract. Fields marked with * are required.
                  </SheetDescription>
                </SheetHeader>

                {isCreateRendered ? (
                  <ProjectForm
                    key={`create-${createPresetStatus}`}
                    onSubmit={handleCreateSubmit}
                    clients={clients}
                    teamMembers={teamMembers}
                    defaultValues={{ status: createPresetStatus }}
                    onCancel={() => setIsCreateOpen(false)}
                    isPending={isPending}
                    errorMsg={errorMsg}
                    submitLabel="Create Project"
                  />
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <IconPlus className="h-6 w-6 text-text-secondary animate-spin" />
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* METRICS DECK (Bigger text size + values bolded) */}
      <div className="flex flex-wrap gap-3.5 items-center select-none text-xs font-bold">
        <div className="bg-surface-white border border-border rounded-lg px-3.5 py-2.5 flex items-center gap-2 shadow-sm">
          <IconFolder className="h-4.5 w-4.5 text-text-secondary" />
          <span className="text-text-secondary">Total:</span>
          <span className="text-text-primary font-black text-sm">{financialMetrics.totalCount}</span>
        </div>
        <div className="bg-surface-white border border-border rounded-lg px-3.5 py-2.5 flex items-center gap-2 shadow-sm">
          <IconBriefcase className="h-4.5 w-4.5 text-brand-orange" />
          <span className="text-text-secondary">Ongoing:</span>
          <span className="text-brand-orange font-black text-sm">{financialMetrics.ongoingCount}</span>
        </div>
        <div className="bg-surface-white border border-border rounded-lg px-3.5 py-2.5 flex items-center gap-2 shadow-sm">
          <span className="text-text-secondary">Budget:</span>
          <span className="text-text-primary font-black text-sm">₹{financialMetrics.budgetSum.toLocaleString("en-IN")}</span>
        </div>
        <div className="bg-surface-white border border-border rounded-lg px-3.5 py-2.5 flex items-center gap-2 shadow-sm">
          <IconCreditCard className="h-4.5 w-4.5 text-emerald-600" />
          <span className="text-text-secondary">Paid:</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm">₹{financialMetrics.paidSum.toLocaleString("en-IN")}</span>
        </div>
        <div className="bg-surface-white border border-border rounded-lg px-3.5 py-2.5 flex items-center gap-2 shadow-sm">
          <span className="text-text-secondary">Retainers:</span>
          <span className="text-text-primary font-black text-sm">
            {financialMetrics.retainersCount}
            {financialMetrics.retainersSum > 0 ? ` (₹${financialMetrics.retainersSum.toLocaleString("en-IN")})` : ""}
          </span>
        </div>
      </div>

      {/* SEARCH AND CLIENT FILTER BAR */}
      <div className="bg-surface-white border border-border rounded-xl p-3 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs">
          <IconSearch className="absolute left-3 top-2.5 h-4.5 w-4.5 text-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects, clients, or descriptions..."
            className="pl-9 pr-4 h-9.5 w-full rounded-lg border border-border bg-surface-page text-xs font-semibold shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-orange"
          />
        </div>

        {/* Client Filter Dropdown */}
        <div className="flex gap-2 w-full sm:w-auto items-center justify-end select-none">
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="h-9.5 rounded-lg border border-border bg-surface-page px-3 text-xs font-semibold shadow-sm focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* MOBILE COLUMN SELECTOR TAB BAR (visible only on mobile) */}
      <div className="md:hidden border-b border-border flex items-center gap-1 overflow-x-auto py-1 scrollbar-hide select-none">
        {COLUMNS.map((col) => {
          const isActive = mobileActiveColumn === col.key;
          const count = groupedProjects[col.key].length;
          return (
            <button
              key={col.key}
              onClick={() => setMobileActiveColumn(col.key)}
              className={`px-3.5 py-2 text-[10px] font-extrabold uppercase tracking-wider border-b-2 rounded-t-lg transition-all duration-150 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? "border-brand-orange text-brand-orange bg-brand-orange-tint/10"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              {col.label}
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${isActive ? "bg-brand-orange/20 text-brand-orange" : "bg-surface-page text-text-secondary"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/*  KANBAN BOARD                                                */}
      {/* ============================================================ */}
      <div className="grid gap-5 md:grid-cols-3 lg:grid-cols-3 w-full pb-4 scrollbar-thin">
        {COLUMNS.map((col) => {
          const projectsInCol = groupedProjects[col.key];
          const isDragOver = activeDragOverColumn === col.key;

          // Render only active column on mobile viewport
          const mobileDisplayClass = mobileActiveColumn === col.key ? "flex" : "hidden md:flex";

          return (
            <div
              key={col.key}
              onDragOver={(e) => handleDragOver(e, col.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.key)}
              className={`
                ${mobileDisplayClass}
                flex-col gap-3.5 min-w-[260px] md:min-w-0 min-h-[480px] rounded-xl border border-border/80 bg-surface-white p-4 transition-all duration-200
                ${isDragOver ? "border-brand-orange bg-brand-orange-tint/5 shadow-inner scale-[1.01]" : ""}
              `}
            >
              {/* Column Title and Counter Header (Bigger text size) */}
              <div className="flex items-center justify-between pb-2.5 border-b border-border/60 select-none">
                <span className="text-sm font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.key === "NEW" ? "bg-slate-400" : col.key === "ONGOING" ? "bg-blue-500" : "bg-emerald-500"}`} />
                  {col.label}
                </span>
                
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setCreatePresetStatus(col.key);
                      setIsCreateOpen(true);
                    }}
                    className="p-1 hover:bg-border text-text-secondary hover:text-brand-orange rounded transition-colors cursor-pointer"
                    title={`Create project in ${col.label}`}
                  >
                    <IconPlus className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-black text-text-secondary bg-surface-page px-2 py-0.5 rounded-full">
                    {projectsInCol.length}
                  </span>
                </div>
              </div>

              {/* Cards Container */}
              <div className="flex-1 space-y-3.5 overflow-y-auto max-h-[550px] pr-1 py-1 scrollbar-hide">
                {projectsInCol.length > 0 ? (
                  projectsInCol.map((project) => {
                    const { paid, pending } = getProjectFinances(project);
                    const progressPercent = Number(project.budget) > 0 ? Math.min(100, Math.round((paid / Number(project.budget)) * 100)) : 0;

                    return (
                      <div
                        key={project.id}
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, project.id)}
                        onClick={(e) => {
                          const target = e.target as HTMLElement;
                          if (target.closest("button") || target.closest("a")) {
                            return;
                          }
                          router.push(`/projects/${project.id}`);
                        }}
                        className="bg-surface-page/55 hover:bg-surface-page border border-border/70 rounded-xl p-4.5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer relative group"
                      >
                        {/* Title & Chevron Menu (Bigger text size) */}
                        <div className="flex justify-between items-start">
                          <Link
                            href={`/projects/${project.id}`}
                            draggable={false}
                            onClick={(e) => e.stopPropagation()}
                            onDragStart={(e) => e.stopPropagation()}
                            className="font-black text-text-primary text-base hover:text-brand-orange transition-colors text-left capitalize tracking-tight leading-snug cursor-pointer flex-1"
                          >
                            {project.name}
                          </Link>

                          {/* Action icons */}
                          <div className="flex items-center gap-1.5 ml-2">
                            <button
                              onClick={() => setEditingProject(project)}
                              className="p-1 hover:bg-border text-text-secondary hover:text-brand-orange rounded transition-colors cursor-pointer"
                            >
                              <IconEdit className="h-4 w-4" />
                            </button>
                            
                            {/* Mobile move trigger */}
                            <button
                              onClick={() => setShowMoveMenuForId(showMoveMenuForId === project.id ? null : project.id)}
                              className="md:hidden p-1 hover:bg-border text-text-secondary hover:text-brand-orange rounded transition-colors cursor-pointer"
                            >
                              <IconArrowsRightLeft className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Client details (Bigger text size) */}
                        <p className="text-xs font-extrabold text-text-secondary capitalize mt-2 flex items-center gap-1.5 select-none">
                          <IconUsers className="h-3.5 w-3.5 shrink-0 text-text-secondary/75" />
                          {project.client.name}
                        </p>

                        {/* Column Switch Dropdown Menu (for mobile/touch support) */}
                        {showMoveMenuForId === project.id && (
                          <div className="absolute right-4 top-11 z-40 bg-surface-white border border-border rounded-lg shadow-lg py-1.5 text-xs font-bold select-none min-w-[130px] animate-in fade-in duration-100">
                            <div className="px-2.5 py-1 text-text-secondary border-b border-border/50 text-[10px] uppercase tracking-wider">
                              Move status to:
                            </div>
                            {COLUMNS.map((item) => {
                              if (item.key === project.status) return null;
                              return (
                                <button
                                  key={item.key}
                                  onClick={() => handleMoveToStatus(project.id, item.key)}
                                  className="w-full text-left px-2.5 py-1.5 text-text-primary hover:bg-brand-orange-tint/10 hover:text-brand-orange transition-colors cursor-pointer block"
                                >
                                  {item.label}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Budget progress ratio (Bigger text size) */}
                        <div className="mt-4 pt-4 border-t border-border/40 space-y-2 select-none">
                          <div className="flex justify-between items-center text-xs font-extrabold text-text-secondary">
                            <span>Budget Progress</span>
                            <span className="text-text-primary font-black">₹{paid.toLocaleString("en-IN")} / ₹{Number(project.budget).toLocaleString("en-IN")}</span>
                          </div>

                          {/* Progress bar line */}
                          <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-brand-orange h-full rounded-full transition-all duration-300"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs font-extrabold">
                            <span className="text-amber-600 dark:text-amber-400 font-bold">
                              Pending: ₹{pending.toLocaleString("en-IN")}
                            </span>
                            <span className="text-text-secondary font-black">
                              {progressPercent}% Done
                            </span>
                          </div>
                        </div>

                        {/* Card metadata footer (Bigger text size) */}
                        <div className="mt-4.5 pt-3 border-t border-border/40 flex items-center justify-between text-xs font-extrabold text-text-secondary select-none">
                          {/* Dates */}
                          <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                            <IconCalendar className="h-4 w-4 shrink-0 text-text-secondary/70" />
                            {project.startDate || project.deadline ? (
                              <span className="truncate">
                                {project.startDate ? new Date(project.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Start"}
                                {" - "}
                                {project.deadline ? new Date(project.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "End"}
                              </span>
                            ) : (
                              <span className="italic opacity-60 font-medium">No dates</span>
                            )}
                          </div>

                          {/* Project Members count */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <IconUsers className="h-4 w-4 shrink-0 text-text-secondary/70" />
                            <span>{project.members ? project.members.length : 0} member{project.members && project.members.length === 1 ? "" : "s"}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 border border-dashed border-border rounded-xl flex flex-col items-center justify-center text-center text-text-secondary/80 text-[10px] font-bold select-none p-4">
                    <IconAlertCircle className="h-5 w-5 mb-1 opacity-70" />
                    <span>No {col.label.toLowerCase()} projects</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* EDIT DRAWER SHEET */}
      {editingProject && (
        <Sheet open={!!editingProject} onOpenChange={(open) => !open && setEditingProject(null)}>
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
                    name: editingProject.name,
                    clientId: editingProject.client.id,
                    description: editingProject.description || "",
                    budget: Number(editingProject.budget),
                    status: editingProject.status,
                    progress: editingProject.progress,
                    startDate: editingProject.startDate
                      ? new Date(editingProject.startDate).toISOString().split("T")[0]
                      : "",
                    deadline: editingProject.deadline
                      ? new Date(editingProject.deadline).toISOString().split("T")[0]
                      : "",
                    techStack: editingProject.techStack,
                    domain: editingProject.description?.match(/\[Domain:\s*([^\s|\]]+)/)?.[1] || "",
                    domainExpiry: editingProject.description?.match(/Expires:\s*([^\s\]]+)/)?.[1] || "",
                    projectType: editingProject.description?.toLowerCase().includes("retainer") || editingProject.name.toLowerCase().includes("retainer") ? "retainer" : "one-off",
                    teamMemberAssignments: editingProject.members ? editingProject.members.map((m) => ({ teamMemberId: m.teamMember.id, roleOnProject: m.roleOnProject || "" })) : [],
                  }}
                  onCancel={() => setEditingProject(null)}
                  isPending={isPending}
                  errorMsg={errorMsg}
                  submitLabel="Save Changes"
                />
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <IconPlus className="h-6 w-6 text-text-secondary animate-spin" />
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

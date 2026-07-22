"use client";

import { useState, useTransition, useEffect, useRef } from "react";
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
  IconLoader,
  IconPlus,
  IconFileText,
  IconSearch,
  IconCloudUpload,
  IconDownload,
  IconTrash,
  IconExternalLink,
  IconReceipt,
  IconFileCheck,
  IconPhoto,
  IconSparkles,
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
import { PaymentForm } from "@/components/payments/payment-form";
import { PaymentHistoryTable } from "@/components/payments/payment-history-table";
import { createPayment } from "@/app/(dashboard)/payments/actions";
import { DeliveryBadge } from "@/components/projects/delivery-badge";
import { createDocument, deleteDocument } from "@/app/(dashboard)/documents/actions";

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
  receiptNumber: string | null;
  receiptKey: string | null;
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

type DocumentRecord = {
  id: string;
  name: string;
  type: string;
  r2Key: string;
  mimeType: string | null;
  size: number | null;
  createdAt: string;
  uploadedBy: { name: string } | null;
};

type InvoiceRecord = {
  id: string;
  number: string;
  total: number | string;
  status: string;
  issueDate: string;
  dueDate: string | null;
  pdfKey: string | null;
  createdAt: string;
};

type ProposalRecord = {
  id: string;
  number: string;
  title: string;
  amount: number | string | null;
  status: string;
  validUntil: string | null;
  pdfKey: string | null;
  createdAt: string;
};

type AgreementRecord = {
  id: string;
  number: string;
  title: string;
  status: string;
  effectiveDate: string | null;
  expiresAt: string | null;
  pdfKey: string | null;
  createdAt: string;
};

type QuotationRecord = {
  id: string;
  number: string;
  total: number | string;
  status: string;
  issueDate: string;
  validUntil: string | null;
  pdfKey: string | null;
  createdAt: string;
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
  documents?: DocumentRecord[];
  invoices?: InvoiceRecord[];
  proposals?: ProposalRecord[];
  agreements?: AgreementRecord[];
  quotations?: QuotationRecord[];
};

/* ------------------------------------------------------------------ */
/*  Tab definitions                                                    */
/* ------------------------------------------------------------------ */

const TABS = [
  { key: "overview", label: "Overview", icon: IconLayoutDashboard },
  { key: "payments", label: "Payments", icon: IconCreditCard },
  { key: "team", label: "Team", icon: IconUsers },
  { key: "documents", label: "Documents", icon: IconFileText },
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

  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);
  const [paymentErrorMsg, setPaymentErrorMsg] = useState("");
  const [isPaymentPending, startPaymentTransition] = useTransition();

  // Documents tab state & actions
  const docFileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDocFile, setSelectedDocFile] = useState<File | null>(null);
  const [isUploadingDocFile, setIsUploadingDocFile] = useState(false);
  const [docMimeType, setDocMimeType] = useState("application/octet-stream");

  const [docCategory, setDocCategory] = useState<string>("ALL");
  const [docSearchQuery, setDocSearchQuery] = useState<string>("");
  const [isDocSheetOpen, setIsDocSheetOpen] = useState(false);
  const [isDocPending, startDocTransition] = useTransition();
  const [docErrorMsg, setDocErrorMsg] = useState("");

  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("DESIGNS");
  const [docUrl, setDocUrl] = useState("");
  const [docSize, setDocSize] = useState(0);

  const [docUploadProgress, setDocUploadProgress] = useState(0);

  const handleDocFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedDocFile(file);
    setIsUploadingDocFile(true);
    setDocUploadProgress(20);
    setDocErrorMsg("");

    if (!docName.trim()) {
      setDocName(file.name);
    }
    setDocSize(file.size);

    if (file.type.startsWith("image/")) {
      setDocType("DESIGNS");
    } else if (file.type === "application/pdf") {
      setDocType("PDFS");
    } else if (file.name.toLowerCase().includes("logo")) {
      setDocType("LOGOS");
    } else {
      setDocType("DOCUMENTS");
    }

    const progressTimer = setInterval(() => {
      setDocUploadProgress((p) => (p < 85 ? p + 15 : p));
    }, 150);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setDocUploadProgress(100);
        setDocUrl(data.url);
        setDocMimeType(data.mimeType || file.type || "application/octet-stream");
      } else {
        setDocErrorMsg(data.error || "Failed to upload file from device.");
        setDocUploadProgress(0);
      }
    } catch (err: any) {
      console.error("Doc upload error:", err);
      setDocErrorMsg("Failed to upload file. Please try again.");
      setDocUploadProgress(0);
    } finally {
      clearInterval(progressTimer);
      setIsUploadingDocFile(false);
    }
  };

  const clearSelectedDocFile = () => {
    setSelectedDocFile(null);
    setDocUrl("");
    if (docFileInputRef.current) {
      docFileInputRef.current.value = "";
    }
  };

  const handleDocUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) return;
    if (!docUrl.trim()) {
      setDocErrorMsg("Please select a file from your system to upload.");
      return;
    }

    setDocErrorMsg("");
    startDocTransition(async () => {
      const res = await createDocument({
        name: docName.trim(),
        type: docType,
        r2Key: docUrl.trim(),
        mimeType: docMimeType || (docType === "PDFS" ? "application/pdf" : docType === "DESIGNS" ? "image/png" : "application/octet-stream"),
        size: Number(docSize) || 1024 * 150,
        projectId: project.id,
        clientId: project.client.id,
      });

      if (res.success) {
        setIsDocSheetOpen(false);
        setDocName("");
        setDocUrl("");
        setSelectedDocFile(null);
        router.refresh();
      } else {
        setDocErrorMsg(res.error || "Failed to upload document.");
      }
    });
  };

  const handleDocDelete = (docId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    startDocTransition(async () => {
      const res = await deleteDocument(docId);
      if (res.success) {
        router.refresh();
      }
    });
  };

  const invoices = project.invoices || [];
  const proposals = project.proposals || [];
  const agreements = project.agreements || [];
  const quotations = project.quotations || [];
  const uploadedFiles = project.documents || [];

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.number.toLowerCase().includes(docSearchQuery.toLowerCase()) ||
      inv.status.toLowerCase().includes(docSearchQuery.toLowerCase())
  );

  const filteredProposals = proposals.filter(
    (prop) =>
      prop.number.toLowerCase().includes(docSearchQuery.toLowerCase()) ||
      (prop.title && prop.title.toLowerCase().includes(docSearchQuery.toLowerCase())) ||
      prop.status.toLowerCase().includes(docSearchQuery.toLowerCase())
  );

  const filteredAgreements = agreements.filter(
    (agr) =>
      agr.number.toLowerCase().includes(docSearchQuery.toLowerCase()) ||
      (agr.title && agr.title.toLowerCase().includes(docSearchQuery.toLowerCase())) ||
      agr.status.toLowerCase().includes(docSearchQuery.toLowerCase())
  );

  const filteredQuotations = quotations.filter(
    (qtn) =>
      qtn.number.toLowerCase().includes(docSearchQuery.toLowerCase()) ||
      qtn.status.toLowerCase().includes(docSearchQuery.toLowerCase())
  );

  const filteredUploadedFiles = uploadedFiles.filter(
    (file) =>
      file.name.toLowerCase().includes(docSearchQuery.toLowerCase()) ||
      file.type.toLowerCase().includes(docSearchQuery.toLowerCase())
  );

  const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const getFileUrl = (key?: string | null) => {
  if (!key) return "#";
  const trimmed = key.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    if (trimmed.includes("orvynlabs.r2.dev") || trimmed.includes("cloud.r2.dev")) {
      const fileName = trimmed.split("/").pop() || "document.pdf";
      return `/api/files/uploads/${fileName}`;
    }
    return trimmed;
  }
  if (trimmed.startsWith("/api/files/")) {
    return trimmed;
  }
  const cleanPath = trimmed.replace(/^\/+/, "");
  return `/api/files/${cleanPath}`;
};

  const handlePaymentSubmit = async (values: any) => {
    setPaymentErrorMsg("");
    startPaymentTransition(async () => {
      const res = await createPayment({
        ...values,
        projectId: project.id,
        clientId: project.client.id,
      });
      if (res.success) {
        setIsPaymentSheetOpen(false);
        router.refresh();
      } else {
        setPaymentErrorMsg(res.error || "Failed to log payment.");
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
              <DeliveryBadge deadline={project.deadline} completedAt={project.completedAt} status={project.status} />
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
              className={`px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider border-b-2 rounded-t-lg transition-all duration-100 active:scale-95 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? "border-brand-orange text-brand-orange bg-brand-orange-tint/10"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
              style={{ WebkitTapHighlightColor: "transparent" }}
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
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <IconCreditCard className="h-5 w-5 text-brand-orange" /> Payment Ledger
              </h3>
              <Sheet open={isPaymentSheetOpen} onOpenChange={setIsPaymentSheetOpen}>
                <SheetTrigger
                  render={
                    <Button
                      size="sm"
                      className="h-8 bg-brand-orange hover:bg-brand-orange-hover text-white font-bold text-xs cursor-pointer select-none border-0 shadow-none flex items-center gap-1.5"
                    >
                      <IconPlus className="h-3.5 w-3.5" /> Log Payment
                    </Button>
                  }
                />
                <SheetContent className="w-full max-w-[450px] p-6 bg-surface-white border-l border-border h-full flex flex-col justify-between overflow-y-auto">
                  <div>
                    <SheetHeader className="mb-6">
                      <SheetTitle className="text-lg font-bold text-text-primary text-left">
                        Log Project Payment
                      </SheetTitle>
                      <SheetDescription className="text-xs text-text-secondary mt-1 text-left">
                        Record a client payment for this project.
                      </SheetDescription>
                    </SheetHeader>
                    <PaymentForm
                      projects={[]}
                      fixedProjectId={project.id}
                      fixedClientId={project.client.id}
                      onSubmit={handlePaymentSubmit}
                      isPending={isPaymentPending}
                      errorMsg={paymentErrorMsg}
                      onCancel={() => setIsPaymentSheetOpen(false)}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <PaymentHistoryTable
              payments={project.payments.map((p) => ({
                ...p,
                amount: Number(p.amount),
                paidAt: p.paidAt,
                method: p.method as any,
                status: p.status as any,
              }))}
              showClientColumn={false}
              showProjectColumn={false}
            />
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

      {/* ═══════════════ DOCUMENTS TAB ═══════════════ */}
      {activeTab === "documents" && (
        <div className="animate-in fade-in duration-200 space-y-5">
          {/* Header Bar & Actions */}
          <div className="bg-surface-white border border-border rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-extrabold text-text-primary flex items-center gap-2">
                <IconFileText className="h-5 w-5 text-brand-orange" />
                Project Document Repository
              </h3>
              <p className="text-xs text-text-secondary font-medium mt-0.5">
                Organized list of all invoices, proposals, agreements, quotations, and attached files for <span className="font-bold text-text-primary">{project.name}</span>.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="relative">
                <IconSearch className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Search project files..."
                  value={docSearchQuery}
                  onChange={(e) => setDocSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs rounded-xl bg-surface-page border border-border/80 focus:outline-none focus:border-brand-orange w-44 sm:w-56 font-medium text-text-primary"
                />
              </div>

              <Sheet open={isDocSheetOpen} onOpenChange={setIsDocSheetOpen}>
                <SheetTrigger
                  render={
                    <Button size="sm" className="h-8 bg-brand-orange hover:bg-brand-orange/90 text-white font-bold text-xs gap-1.5 rounded-xl cursor-pointer">
                      <IconCloudUpload className="h-4 w-4" />
                      Upload File
                    </Button>
                  }
                />
                <SheetContent className="w-full max-w-[420px] p-6 bg-surface-white border-l border-border h-full flex flex-col justify-between overflow-y-auto">
                  <div>
                    <SheetHeader className="mb-6">
                      <SheetTitle className="text-lg font-bold text-text-primary text-left">
                        Upload Project Document
                      </SheetTitle>
                      <SheetDescription className="text-xs text-text-secondary mt-1 text-left">
                        Upload a file or asset linked to {project.name}.
                      </SheetDescription>
                    </SheetHeader>

                    <form onSubmit={handleDocUploadSubmit} className="space-y-4">
                      {docErrorMsg && (
                        <div className="p-3 text-xs bg-rose-50 text-rose-600 rounded-lg font-semibold border border-rose-200">
                          {docErrorMsg}
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-text-primary">Document Title / Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Project Wireframes & Architecture v1.pdf"
                          value={docName}
                          onChange={(e) => setDocName(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface-page font-medium focus:outline-none focus:border-brand-orange"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-text-primary">Category / File Type</label>
                        <select
                          value={docType}
                          onChange={(e) => setDocType(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface-page font-medium focus:outline-none focus:border-brand-orange"
                        >
                          <option value="DESIGNS">Designs & Wireframes</option>
                          <option value="PDFS">PDF Documents</option>
                          <option value="LOGOS">Logos & Branding</option>
                          <option value="DOCUMENTS">Specifications / Brief</option>
                          <option value="CLIENT_FILES">Client Uploaded Files</option>
                          <option value="OTHER">Other Assets</option>
                        </select>
                      </div>

                      {/* Native System File Picker Dropzone */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-text-primary flex items-center justify-between">
                          <span>Select System File *</span>
                          <span className="text-[9.5px] text-text-secondary font-medium">Mobile Gallery / Laptop Explorer</span>
                        </label>

                        <input
                          type="file"
                          ref={docFileInputRef}
                          onChange={handleDocFileSelect}
                          className="hidden"
                        />

                        {!selectedDocFile ? (
                          <div
                            onClick={() => docFileInputRef.current?.click()}
                            className="border-2 border-dashed border-border hover:border-brand-orange/60 bg-surface-page/50 rounded-xl p-4 text-center cursor-pointer transition-all group select-none"
                          >
                            <IconCloudUpload className="h-7 w-7 text-brand-orange mx-auto mb-1 group-hover:scale-110 transition-transform" />
                            <p className="text-xs font-extrabold text-text-primary">
                              Tap or Click to Pick System File
                            </p>
                            <p className="text-[10px] text-text-secondary font-medium mt-0.5">
                              Upload photo, document, PDF, zip, design asset from device
                            </p>
                          </div>
                        ) : (
                          <div className="border border-brand-orange/40 bg-brand-orange-tint/10 rounded-xl p-3 space-y-2">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-7 h-7 rounded-lg bg-brand-orange text-white flex items-center justify-center shrink-0 shadow-xs">
                                  <IconFileText className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-extrabold text-text-primary truncate">
                                    {selectedDocFile.name}
                                  </p>
                                  <p className="text-[9.5px] text-text-secondary font-medium">
                                    {formatBytes(selectedDocFile.size)} • {isUploadingDocFile ? `Uploading (${docUploadProgress}%)...` : "Uploaded & Ready"}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {isUploadingDocFile ? (
                                  <IconLoader className="h-4 w-4 text-brand-orange animate-spin" />
                                ) : (
                                  <button
                                    type="button"
                                    onClick={clearSelectedDocFile}
                                    className="text-[10px] font-bold text-rose-500 hover:underline cursor-pointer"
                                  >
                                    Change
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Progress Bar */}
                            {isUploadingDocFile && (
                              <div className="w-full bg-border/60 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-brand-orange h-full rounded-full transition-all duration-200"
                                  style={{ width: `${docUploadProgress}%` }}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="pt-4 flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsDocSheetOpen(false)}
                          className="flex-1 text-xs font-bold"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={isDocPending}
                          className="flex-1 text-xs font-bold bg-brand-orange text-white hover:bg-brand-orange/90"
                        >
                          {isDocPending ? "Uploading..." : "Save Document"}
                        </Button>
                      </div>
                    </form>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Sub-Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
            {[
              { id: "ALL", label: "All Files", count: invoices.length + proposals.length + agreements.length + quotations.length + uploadedFiles.length },
              { id: "INVOICES", label: "Invoices", count: invoices.length },
              { id: "PROPOSALS", label: "Proposals", count: proposals.length },
              { id: "AGREEMENTS", label: "Agreements", count: agreements.length },
              { id: "QUOTATIONS", label: "Quotations", count: quotations.length },
              { id: "FILES", label: "Uploaded Assets", count: uploadedFiles.length },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setDocCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                  docCategory === cat.id
                    ? "bg-brand-orange text-white shadow-2xs"
                    : "bg-surface-white border border-border/80 text-text-secondary hover:text-text-primary"
                }`}
              >
                {cat.label} ({cat.count})
              </button>
            ))}
          </div>

          {/* DOCUMENT SECTIONS */}
          <div className="space-y-6">
            {/* 1. INVOICES */}
            {(docCategory === "ALL" || docCategory === "INVOICES") && (
              <div className="bg-surface-white border border-border rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-text-primary flex items-center gap-2">
                    <IconReceipt className="h-4.5 w-4.5 text-emerald-600" />
                    Invoices ({filteredInvoices.length})
                  </h4>
                  <span className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">
                    Financial Billing
                  </span>
                </div>

                {filteredInvoices.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredInvoices.map((inv) => (
                      <div key={inv.id} className="p-3.5 rounded-xl bg-surface-page/50 border border-border/60 hover:border-emerald-500/30 transition-all flex flex-col justify-between gap-3">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-extrabold text-text-primary text-xs tracking-tight">
                              {inv.number}
                            </span>
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${getPaymentStatusClasses(inv.status)}`}>
                              {inv.status}
                            </span>
                          </div>
                          <p className="text-lg font-black text-emerald-600 mt-1">
                            {formatCurrency(Number(inv.total))}
                          </p>
                          <p className="text-[10px] text-text-secondary font-medium mt-0.5">
                            Issued: {formatDateShort(inv.issueDate)} {inv.dueDate ? `• Due: ${formatDateShort(inv.dueDate)}` : ""}
                          </p>
                        </div>

                        {inv.pdfKey ? (
                          <a
                            href={getFileUrl(inv.pdfKey)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg py-1.5 transition-colors"
                          >
                            <IconDownload className="h-3.5 w-3.5" /> View / Download PDF
                          </a>
                        ) : (
                          <span className="text-[10px] text-text-secondary/70 italic text-center">PDF file available in system</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-text-secondary/70 text-xs italic bg-surface-page/30 border border-dashed border-border/60 rounded-xl">
                    No invoices generated for this project yet.
                  </div>
                )}
              </div>
            )}

            {/* 2. PROPOSALS */}
            {(docCategory === "ALL" || docCategory === "PROPOSALS") && (
              <div className="bg-surface-white border border-border rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-text-primary flex items-center gap-2">
                    <IconFileText className="h-4.5 w-4.5 text-blue-600" />
                    Proposals ({filteredProposals.length})
                  </h4>
                  <span className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">
                    Project Pitches
                  </span>
                </div>

                {filteredProposals.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredProposals.map((prop) => (
                      <div key={prop.id} className="p-3.5 rounded-xl bg-surface-page/50 border border-border/60 hover:border-blue-500/30 transition-all flex flex-col justify-between gap-3">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-extrabold text-text-primary text-xs truncate">
                              {prop.title || prop.number}
                            </span>
                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase bg-blue-50 text-blue-600">
                              {prop.status}
                            </span>
                          </div>
                          <p className="text-[10px] font-bold text-text-secondary mt-1">
                            {prop.number} {prop.amount ? `• ${formatCurrency(Number(prop.amount))}` : ""}
                          </p>
                          {prop.validUntil && (
                            <p className="text-[10px] text-text-secondary font-medium mt-0.5">
                              Valid until: {formatDateShort(prop.validUntil)}
                            </p>
                          )}
                        </div>

                        {prop.pdfKey ? (
                          <a
                            href={getFileUrl(prop.pdfKey)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg py-1.5 transition-colors"
                          >
                            <IconDownload className="h-3.5 w-3.5" /> View Proposal PDF
                          </a>
                        ) : (
                          <span className="text-[10px] text-text-secondary/70 italic text-center">PDF generated in system</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-text-secondary/70 text-xs italic bg-surface-page/30 border border-dashed border-border/60 rounded-xl">
                    No proposals attached to this project yet.
                  </div>
                )}
              </div>
            )}

            {/* 3. AGREEMENTS */}
            {(docCategory === "ALL" || docCategory === "AGREEMENTS") && (
              <div className="bg-surface-white border border-border rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-text-primary flex items-center gap-2">
                    <IconFileCheck className="h-4.5 w-4.5 text-purple-600" />
                    Agreements & Contracts ({filteredAgreements.length})
                  </h4>
                  <span className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">
                    Legal & Terms
                  </span>
                </div>

                {filteredAgreements.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredAgreements.map((agr) => (
                      <div key={agr.id} className="p-3.5 rounded-xl bg-surface-page/50 border border-border/60 hover:border-purple-500/30 transition-all flex flex-col justify-between gap-3">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-extrabold text-text-primary text-xs truncate">
                              {agr.title || agr.number}
                            </span>
                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase bg-purple-50 text-purple-600">
                              {agr.status}
                            </span>
                          </div>
                          <p className="text-[10px] font-bold text-text-secondary mt-1">
                            {agr.number}
                          </p>
                          {agr.effectiveDate && (
                            <p className="text-[10px] text-text-secondary font-medium mt-0.5">
                              Effective: {formatDateShort(agr.effectiveDate)}
                            </p>
                          )}
                        </div>

                        {agr.pdfKey ? (
                          <a
                            href={getFileUrl(agr.pdfKey)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 text-[11px] font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg py-1.5 transition-colors"
                          >
                            <IconDownload className="h-3.5 w-3.5" /> View Agreement PDF
                          </a>
                        ) : (
                          <span className="text-[10px] text-text-secondary/70 italic text-center">PDF document in system</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-text-secondary/70 text-xs italic bg-surface-page/30 border border-dashed border-border/60 rounded-xl">
                    No agreements or contracts for this project.
                  </div>
                )}
              </div>
            )}

            {/* 4. QUOTATIONS */}
            {(docCategory === "ALL" || docCategory === "QUOTATIONS") && (
              <div className="bg-surface-white border border-border rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-text-primary flex items-center gap-2">
                    <IconReceipt className="h-4.5 w-4.5 text-amber-600" />
                    Quotations ({filteredQuotations.length})
                  </h4>
                  <span className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">
                    Cost Estimates
                  </span>
                </div>

                {filteredQuotations.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredQuotations.map((qtn) => (
                      <div key={qtn.id} className="p-3.5 rounded-xl bg-surface-page/50 border border-border/60 hover:border-amber-500/30 transition-all flex flex-col justify-between gap-3">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-extrabold text-text-primary text-xs">
                              {qtn.number}
                            </span>
                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase bg-amber-50 text-amber-600">
                              {qtn.status}
                            </span>
                          </div>
                          <p className="text-lg font-black text-amber-600 mt-1">
                            {formatCurrency(Number(qtn.total))}
                          </p>
                          <p className="text-[10px] text-text-secondary font-medium mt-0.5">
                            Issued: {formatDateShort(qtn.issueDate)}
                          </p>
                        </div>

                        {qtn.pdfKey ? (
                          <a
                            href={getFileUrl(qtn.pdfKey)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 text-[11px] font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg py-1.5 transition-colors"
                          >
                            <IconDownload className="h-3.5 w-3.5" /> View Quotation PDF
                          </a>
                        ) : (
                          <span className="text-[10px] text-text-secondary/70 italic text-center">PDF quotation file</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-text-secondary/70 text-xs italic bg-surface-page/30 border border-dashed border-border/60 rounded-xl">
                    No quotations generated for this project yet.
                  </div>
                )}
              </div>
            )}

            {/* 5. UPLOADED FILES & ASSETS */}
            {(docCategory === "ALL" || docCategory === "FILES") && (
              <div className="bg-surface-white border border-border rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-text-primary flex items-center gap-2">
                    <IconCloudUpload className="h-4.5 w-4.5 text-brand-orange" />
                    Uploaded Files & Project Assets ({filteredUploadedFiles.length})
                  </h4>
                  <span className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">
                    Assets & Specs
                  </span>
                </div>

                {filteredUploadedFiles.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredUploadedFiles.map((file) => (
                      <div key={file.id} className="p-3.5 rounded-xl bg-surface-page/50 border border-border/60 hover:border-brand-orange/30 transition-all flex flex-col justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-brand-orange-tint/15 text-brand-orange flex items-center justify-center shrink-0">
                            {file.type === "DESIGNS" ? (
                              <IconPhoto className="h-5 w-5" />
                            ) : file.type === "LOGOS" ? (
                              <IconSparkles className="h-5 w-5" />
                            ) : (
                              <IconFileText className="h-5 w-5" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h5 className="font-extrabold text-text-primary text-xs truncate" title={file.name}>
                              {file.name}
                            </h5>
                            <p className="text-[10px] font-semibold text-text-secondary mt-0.5">
                              {file.type} • {formatBytes(file.size || 0)}
                            </p>
                            <p className="text-[9.5px] text-text-secondary/70 font-medium mt-0.5">
                              Uploaded {formatDateShort(file.createdAt)} {file.uploadedBy?.name ? `by ${file.uploadedBy.name}` : ""}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 pt-2 border-t border-border/40">
                          <a
                            href={getFileUrl(file.r2Key)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] font-bold text-text-primary bg-surface-white hover:bg-surface-page border border-border rounded-lg py-1 transition-colors"
                          >
                            <IconExternalLink className="h-3.5 w-3.5 text-brand-orange" /> Open File
                          </a>
                          <button
                            onClick={() => handleDocDelete(file.id)}
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
                            title="Delete File"
                          >
                            <IconTrash className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-text-secondary/70 text-xs italic bg-surface-page/30 border border-dashed border-border/60 rounded-xl">
                    No uploaded assets or files attached to this project.
                  </div>
                )}
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

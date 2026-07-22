"use client";

import { useState, useTransition, useMemo } from "react";
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
  IconDownload,
  IconTrash,
  IconCloudUpload,
  IconRefresh,
  IconPhoto,
  IconFileCode,
  IconLoader,
  IconSearch,
  IconCheck,
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
import { createDocument, deleteDocument } from "../../documents/actions";

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

type DocumentItem = {
  id: string;
  name: string;
  type: string;
  r2Key: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

type Client = {
  id: string;
  name: string;
  logo: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  secondaryPhone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  gstin: string | null;
  createdAt: string;
  projects: Project[];
  payments: Payment[];
  notes: ClientNote[];
  documents: DocumentItem[];
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

  // Documents Management State
  const [documents, setDocuments] = useState<DocumentItem[]>(client.documents || []);
  const [docSearchQuery, setDocSearchQuery] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isUploadSheetOpen, setIsUploadSheetOpen] = useState(false);

  // File Upload fields
  const [newDocName, setNewDocName] = useState("");
  const [newDocType, setNewDocType] = useState("DOCUMENTS");
  const [newDocUrl, setNewDocUrl] = useState("");
  const [newDocSize, setNewDocSize] = useState(0);
  const [newDocMime, setNewDocMime] = useState("application/octet-stream");

  // Document actions
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(25);
    setUploadError("");

    if (!newDocName) {
      setNewDocName(file.name);
    }
    setNewDocSize(file.size);

    if (file.type.startsWith("image/")) {
      setNewDocType("DESIGNS");
    } else if (file.type === "application/pdf") {
      setNewDocType("PDFS");
    } else {
      setNewDocType("DOCUMENTS");
    }

    const timer = setInterval(() => {
      setUploadProgress((p) => (p < 85 ? p + 15 : p));
    }, 150);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      clearInterval(timer);

      if (res.ok && data.url) {
        setUploadProgress(100);
        setNewDocUrl(data.url);
        setNewDocMime(data.mimeType || file.type || "application/octet-stream");
      } else {
        setUploadError(data.error || "Failed to upload file to storage");
        setUploadProgress(0);
      }
    } catch (err) {
      console.error(err);
      setUploadError("Error uploading file. Please try again.");
      setUploadProgress(0);
      clearInterval(timer);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocUrl || !newDocName) {
      setUploadError("Please select a file and enter a name");
      return;
    }

    startTransition(async () => {
      const res = await createDocument({
        name: newDocName,
        type: newDocType,
        r2Key: newDocUrl,
        mimeType: newDocMime,
        size: newDocSize,
        clientId: client.id,
      });

      if (res.success && res.data) {
        const docRes = res.data;
        const newDoc: DocumentItem = {
          id: docRes.id,
          name: docRes.name,
          type: docRes.type,
          r2Key: docRes.r2Key,
          mimeType: docRes.mimeType || "application/octet-stream",
          size: docRes.size || 0,
          createdAt: docRes.createdAt.toISOString(),
        };

        setDocuments((prev) => [newDoc, ...prev]);
        setIsUploadSheetOpen(false);
        setNewDocName("");
        setNewDocUrl("");
        setNewDocSize(0);
        setUploadProgress(0);
      } else {
        setUploadError(res.error || "Failed to save file metadata");
      }
    });
  };

  const handleDeleteDocument = (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    startTransition(async () => {
      const res = await deleteDocument(id);
      if (res.success) {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
      } else {
        alert(res.error || "Failed to delete file");
      }
    });
  };

  // Filtered documents search memo
  const filteredDocs = useMemo(() => {
    const q = docSearchQuery.toLowerCase().trim();
    if (!q) return documents;
    return documents.filter((d) => d.name.toLowerCase().includes(q));
  }, [documents, docSearchQuery]);

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
        className="inline-flex items-center gap-1.5 text-xs md:text-sm font-bold text-text-secondary hover:text-brand-orange transition-colors select-none"
      >
        <IconArrowLeft className="h-4 w-4" /> Back to Clients
      </Link>

      {/* Hero Client Card */}
      <div className="bg-surface-white border border-border rounded-xl p-6 shadow-sm relative">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              {client.logo && (
                <img
                  src={client.logo}
                  alt={client.name}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover border border-border shrink-0 shadow-xs"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              )}
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-text-primary capitalize">
                  {client.name}
                </h1>
                <span className="text-[9.5px] md:text-[11px] font-extrabold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Active Partner
                </span>
              </div>
            </div>
            {client.contactName && (
              <p className="text-xs md:text-sm font-bold text-text-secondary">
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
                      logo: client.logo || "",
                      contactName: client.contactName || "",
                      email: client.email || "",
                      phone: client.phone || "",
                      secondaryPhone: client.secondaryPhone || "",
                      website: client.website || "",
                      address: client.address || "",
                      city: client.city || "",
                      state: client.state || "",
                    }}
                  />
                </div>
              </SheetContent>
            </Sheet>

            <span className="text-[10px] md:text-xs text-text-secondary font-bold">
              Registered: {new Date(client.createdAt).toLocaleDateString("en-IN")}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid gap-4 mt-6 sm:grid-cols-2 md:grid-cols-3 pt-6 border-t border-border/60 text-[11px] md:text-xs">
          {client.email && (
            <div className="flex items-center gap-2.5 text-text-primary">
              <IconMail className="h-4.5 w-4.5 md:h-5 md:w-5 text-text-secondary" />
              <a href={`mailto:${client.email}`} className="hover:text-brand-orange font-semibold">
                {client.email}
              </a>
            </div>
          )}
          {client.phone && (
            <div className="flex items-center gap-2.5 text-text-primary">
              <IconPhone className="h-4.5 w-4.5 md:h-5 md:w-5 text-text-secondary" />
              <a href={`tel:${client.phone}`} className="hover:text-brand-orange font-semibold">
                {client.phone}
              </a>
            </div>
          )}
          {client.website && (
            <div className="flex items-center gap-2.5 text-text-primary">
              <IconWorld className="h-4.5 w-4.5 md:h-5 md:w-5 text-text-secondary" />
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
              <IconReceipt className="h-4.5 w-4.5 md:h-5 md:w-5 text-text-secondary" />
              <span className="font-semibold uppercase">GSTIN: {client.gstin}</span>
            </div>
          )}
          {(client.address || client.city) && (
            <div className="flex items-center gap-2.5 text-text-primary sm:col-span-2">
              <IconMapPin className="h-4.5 w-4.5 md:h-5 md:w-5 text-text-secondary" />
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
          <span className="text-[10px] md:text-xs font-bold text-text-secondary uppercase tracking-wider block">
            Total Projects
          </span>
          <span className="text-xl md:text-3xl font-extrabold text-text-primary mt-1 block">
            {totalProjects}
          </span>
        </div>
        <div className="bg-surface-white border border-border rounded-xl p-4 shadow-sm">
          <span className="text-[10px] md:text-xs font-bold text-text-secondary uppercase tracking-wider block">
            Active Projects
          </span>
          <span className="text-xl md:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">
            {activeProjects}
          </span>
        </div>
        <div className="bg-surface-white border border-border rounded-xl p-4 shadow-sm">
          <span className="text-[10px] md:text-xs font-bold text-text-secondary uppercase tracking-wider block">
            Collected Revenue
          </span>
          <span className="text-xl md:text-3xl font-extrabold text-text-primary mt-1 block">
            ₹{totalCollected.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="bg-surface-white border border-border rounded-xl p-4 shadow-sm">
          <span className="text-[10px] md:text-xs font-bold text-text-secondary uppercase tracking-wider block">
            Pending Balance
          </span>
          <span className="text-xl md:text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1 block">
            ₹{totalPending.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* TAB NAVIGATION - Styled as Segmented Slider control */}
      <div className="bg-stone-100/80 p-1.5 rounded-xl flex w-full md:w-max gap-1 select-none overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                flex-1 md:flex-none px-5 py-2 font-bold text-xs md:text-sm rounded-lg cursor-pointer transition-all duration-200 whitespace-nowrap min-h-[36px] flex items-center justify-center gap-1.5
                ${
                  isActive
                    ? "bg-white text-brand-orange shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                }
              `}
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <tab.icon className="h-4 w-4" stroke={1.75} />
              {tab.label}
              {/* Badge counts for projects and payments */}
              {tab.key === "projects" && client.projects.length > 0 && (
                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${isActive ? "bg-brand-orange-tint text-brand-orange" : "bg-stone-200/60 text-text-secondary"}`}>
                  {client.projects.length}
                </span>
              )}
              {tab.key === "payments" && client.payments.length > 0 && (
                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${isActive ? "bg-brand-orange-tint text-brand-orange" : "bg-stone-200/60 text-text-secondary"}`}>
                  {client.payments.length}
                </span>
              )}
            </button>
          );
        })}
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
                <h3 className="text-sm md:text-base font-bold text-text-primary flex items-center gap-2">
                  <IconBriefcase className="h-5 w-5 text-brand-orange" /> Recent Projects
                </h3>
                {client.projects.length > 3 && (
                  <button
                    onClick={() => setActiveTab("projects")}
                    className="text-[10px] md:text-xs font-bold text-brand-orange hover:underline cursor-pointer select-none"
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
                        <span className="text-xs md:text-sm font-bold text-text-primary capitalize">
                          {project.name}
                        </span>
                        <span
                          className={`text-[8.5px] md:text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${getStatusStyles(project.status)}`}
                        >
                          {project.status.toLowerCase()}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[10px] md:text-[11px] text-text-secondary font-medium">
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
                <h3 className="text-sm md:text-base font-bold text-text-primary flex items-center gap-2">
                  <IconCreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> Recent Payments
                </h3>
                {client.payments.length > 3 && (
                  <button
                    onClick={() => setActiveTab("payments")}
                    className="text-[10px] md:text-xs font-bold text-brand-orange hover:underline cursor-pointer select-none"
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
                        <span className="text-[11px] md:text-xs font-bold text-text-primary capitalize block">
                          {pmt.project?.name || "Client Level Payment"}
                        </span>
                        <span className="text-[9.5px] md:text-[11px] text-text-secondary font-medium">
                          {new Date(pmt.paidAt).toLocaleDateString("en-IN")} · {pmt.method.replace("_", " ")}
                        </span>
                      </div>
                      <span
                        className={`text-xs md:text-sm font-black ${
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
              <h3 className="text-sm md:text-base font-bold text-text-primary mb-4">Contract Statistics</h3>
              <div className="space-y-4">
                <div className="p-3.5 bg-surface-page rounded-lg border border-border/60">
                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <span className="font-semibold text-text-secondary">Conversion Value</span>
                    <div className="flex items-center gap-0.5 text-emerald-600 font-bold text-[10px] md:text-xs">
                      <IconTrendingUp className="h-3.5 w-3.5" /> Active Client
                    </div>
                  </div>
                  <span className="text-2xl md:text-3xl font-black text-text-primary mt-2 block">
                    ₹{(totalCollected + totalPending).toLocaleString("en-IN")}
                  </span>
                  <p className="text-[10px] md:text-xs text-text-secondary mt-1">
                    Sum of collected funds and outstanding invoices
                  </p>
                </div>

                {/* Progress visual */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs md:text-sm font-semibold">
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

                <div className="pt-2 divide-y divide-border/60 text-xs md:text-sm">
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
              <h3 className="text-sm md:text-base font-bold text-text-primary mb-3">Client Notes</h3>
              {client.notes && client.notes.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto divide-y divide-border/60">
                  {client.notes.map((note) => (
                    <div key={note.id} className="pt-3 first:pt-0">
                      <p className="text-xs md:text-sm text-text-primary whitespace-pre-wrap font-medium">
                        {note.content}
                      </p>
                      <span className="text-[9px] md:text-xs text-text-secondary mt-1 block">
                        {new Date(note.createdAt).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs md:text-sm text-text-secondary italic">No notes added yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* — PROJECTS TAB — */}
      {activeTab === "projects" && (
        <div className="animate-in fade-in duration-200">
          <div className="bg-surface-white border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-sm md:text-base font-bold text-text-primary flex items-center gap-2 mb-4">
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
                        <span className="text-sm md:text-base font-bold text-text-primary capitalize block">
                          {project.name}
                        </span>
                        {project.techStack.length > 0 && (
                          <span className="text-[10px] md:text-xs text-text-secondary block">
                            Tech stack: {project.techStack.join(", ")}
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[9px] md:text-[10.5px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider self-start ${getStatusStyles(project.status)}`}
                      >
                        {project.status.toLowerCase()}
                      </span>
                    </div>

                    {/* Progress slider bar */}
                    <div className="mt-4 space-y-1">
                      <div className="flex items-center justify-between text-[10px] md:text-xs font-semibold text-text-secondary">
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
                    <div className="mt-4 pt-3 border-t border-border/40 flex flex-wrap gap-2 items-center justify-between text-[11px] md:text-xs text-text-secondary font-semibold">
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
            <h3 className="text-sm md:text-base font-bold text-text-primary flex items-center gap-2 mb-4">
              <IconCreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> Payment Ledger
            </h3>

            {paymentsWithRunningPending.length > 0 ? (
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full text-left text-xs md:text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border/60 text-text-secondary font-bold text-[10px] md:text-xs">
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
                        <td className="py-3 text-sm md:text-[15px] font-semibold capitalize">
                          {pmt.project?.name || "Client Level Payment"}
                        </td>
                        <td className="py-3 uppercase text-[9px] md:text-[10px] tracking-wider font-bold">
                          {pmt.method.replace("_", " ")}
                        </td>
                        <td className="py-3 text-text-secondary flex items-center gap-1.5 text-xs md:text-sm">
                          <IconCalendar className="h-3.5 w-3.5 text-text-secondary/65" />
                          {new Date(pmt.paidAt).toLocaleDateString("en-IN")}
                        </td>
                        <td className="py-3">
                          <span
                            className={`text-[9px] md:text-[11px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              pmt.status === "COMPLETED"
                                ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400"
                                : "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {pmt.status.toLowerCase()}
                          </span>
                        </td>
                        <td className="py-3 text-right font-semibold text-text-secondary text-sm md:text-base">
                          ₹{pmt.runningPending.toLocaleString("en-IN")}
                        </td>
                        <td
                          className={`py-3 text-right font-bold text-sm md:text-base ${
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
        <div className="animate-in fade-in duration-200 space-y-4">
          <div className="bg-surface-white border border-border rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="relative w-full sm:w-72">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Search client files..."
                  value={docSearchQuery}
                  onChange={(e) => setDocSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 h-9 bg-surface-page border border-border/80 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-orange"
                />
              </div>

              <Sheet open={isUploadSheetOpen} onOpenChange={setIsUploadSheetOpen}>
                <SheetTrigger
                  render={
                    <Button className="font-bold text-xs bg-brand-orange hover:bg-brand-orange-hover text-white py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-xs border-0 h-9 cursor-pointer active:scale-95 transition-all">
                      <IconCloudUpload className="h-4.5 w-4.5" />
                      <span>Upload Document</span>
                    </Button>
                  }
                />
                <SheetContent className="w-full max-w-[420px] p-5 bg-surface-white border-l border-border h-full flex flex-col justify-between overflow-y-auto font-sans">
                  <form onSubmit={handleUploadSubmit} className="space-y-4">
                    <SheetHeader>
                      <SheetTitle className="text-base font-black text-text-primary text-left flex items-center gap-2">
                        <IconCloudUpload className="h-5 w-5 text-brand-orange" />
                        <span>Upload Client Asset</span>
                      </SheetTitle>
                      <SheetDescription className="text-xs text-text-secondary text-left font-medium">
                        Upload contracts, project requirements, proposals, or image assets for this client.
                      </SheetDescription>
                    </SheetHeader>

                    {uploadError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs font-bold flex items-center gap-2">
                        <IconAlertCircle className="h-4.5 w-4.5" />
                        <span>{uploadError}</span>
                      </div>
                    )}

                    {/* Drag & Drop File Selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-primary">Select File</label>
                      <div className="border-2 border-dashed border-border/80 hover:border-brand-orange/40 rounded-xl p-6 text-center cursor-pointer bg-surface-page/50 hover:bg-surface-page/80 transition-all relative">
                        <input
                          type="file"
                          required={!newDocUrl}
                          onChange={handleFileChange}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <IconCloudUpload className="mx-auto h-8 w-8 text-text-secondary mb-2" />
                        <span className="text-xs font-bold text-text-primary block">
                          Click or drag file here to upload
                        </span>
                        <span className="text-[10px] text-text-secondary mt-1 block">
                          PDF, DOCX, ZIP, PNG, JPG (Max 10MB)
                        </span>
                      </div>
                    </div>

                    {/* Progress Indicator */}
                    {uploadProgress > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-text-secondary">
                          <span>Uploading file...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-brand-orange h-full rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Doc Title Input */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-text-primary">Document Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Service Level Agreement"
                        value={newDocName}
                        onChange={(e) => setNewDocName(e.target.value)}
                        className="w-full h-10 px-3 bg-surface-page border border-border/80 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-orange"
                      />
                    </div>

                    {/* Doc Category Selector */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-text-primary">File Category</label>
                      <select
                        value={newDocType}
                        onChange={(e) => setNewDocType(e.target.value)}
                        className="w-full h-10 px-3 bg-surface-page border border-border/80 rounded-xl text-xs font-semibold text-text-primary focus:outline-none"
                      >
                        <option value="DOCUMENTS">Documents &amp; Files</option>
                        <option value="PDFS">Contracts &amp; PDFs</option>
                        <option value="DESIGNS">Designs &amp; Media</option>
                        <option value="LOGOS">Logos &amp; Branding</option>
                      </select>
                    </div>

                    <div className="pt-4 flex items-center gap-2">
                      <Button
                        type="submit"
                        disabled={isUploading || !newDocUrl}
                        className="flex-1 bg-brand-orange hover:bg-brand-orange-hover text-white font-bold text-xs h-10 rounded-xl border-0 cursor-pointer shadow-xs"
                      >
                        {isUploading ? "Uploading File..." : "Save Document Meta"}
                      </Button>
                      <button
                        type="button"
                        onClick={() => setIsUploadSheetOpen(false)}
                        className="px-4 h-10 border border-border rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </SheetContent>
              </Sheet>
            </div>

            {/* List / Table of Documents */}
            {filteredDocs.length > 0 ? (
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full text-left text-xs md:text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border/60 text-text-secondary font-bold text-[10px] md:text-xs">
                      <th className="pb-3 font-semibold">Document Title</th>
                      <th className="pb-3 font-semibold">Type</th>
                      <th className="pb-3 font-semibold">Size</th>
                      <th className="pb-3 font-semibold">Uploaded Date</th>
                      <th className="pb-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {filteredDocs.map((doc: DocumentItem) => (
                      <tr key={doc.id} className="text-text-primary hover:bg-surface-page/20 transition-colors">
                        <td className="py-3 text-sm font-bold flex items-center gap-2 truncate max-w-[200px]">
                          {getFileIcon(doc.type, doc.mimeType)}
                          <span className="truncate" title={doc.name}>
                            {doc.name}
                          </span>
                        </td>
                        <td className="py-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                          {doc.type}
                        </td>
                        <td className="py-3 text-xs text-text-secondary">
                          {formatBytes(doc.size)}
                        </td>
                        <td className="py-3 text-xs text-text-secondary">
                          {new Date(doc.createdAt).toLocaleDateString("en-IN")}
                        </td>
                        <td className="py-3 text-right space-x-1.5 whitespace-nowrap">
                          <a
                            href={getFileUrl(doc.r2Key)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center p-1.5 rounded-lg border border-border/80 text-text-secondary hover:text-brand-orange hover:bg-surface-page transition-colors cursor-pointer"
                            title="Download/View document"
                          >
                            <IconDownload className="h-4.5 w-4.5" />
                          </a>
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="inline-flex items-center justify-center p-1.5 rounded-lg border border-border/80 text-text-secondary hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete file"
                          >
                            <IconTrash className="h-4.5 w-4.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-text-secondary text-xs flex flex-col items-center justify-center gap-2 border border-dashed border-border rounded-lg bg-surface-page/35">
                <IconFileText className="h-8 w-8 text-text-secondary/70 mb-1" />
                <span className="font-bold text-text-primary">No documents found for this partner</span>
                <span className="text-[10px]">Upload contracts, invoices, or specifications above</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* — ACTIVITY TAB — */}
      {activeTab === "activity" && (
        <div className="animate-in fade-in duration-200">
          <div className="bg-surface-white border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-sm md:text-base font-bold text-text-primary flex items-center gap-2 mb-6">
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
                        <span className="text-xs md:text-sm font-bold text-text-primary capitalize">
                          {act.projectName} &middot;{" "}
                          <span className="text-text-secondary font-semibold">
                            {act.action.replace(/_/g, " ")}
                          </span>
                        </span>
                        <span className="text-[10px] md:text-xs text-text-secondary font-medium">
                          {new Date(act.createdAt).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>

                      {/* Detail text */}
                      {act.detail && (
                        <p className="text-xs md:text-sm text-text-secondary font-medium leading-relaxed max-w-2xl whitespace-pre-wrap">
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

const getFileIcon = (type: string, mime: string) => {
  if (type === "DESIGNS" || mime.startsWith("image/")) {
    return <IconPhoto className="h-4.5 w-4.5 text-orange-500" />;
  }
  if (type === "LOGOS") {
    return <IconCheck className="h-4.5 w-4.5 text-amber-500" />;
  }
  if (type === "PDFS" || mime === "application/pdf") {
    return <IconFileText className="h-4.5 w-4.5 text-rose-500" />;
  }
  return <IconFileCode className="h-4.5 w-4.5 text-blue-500" />;
};


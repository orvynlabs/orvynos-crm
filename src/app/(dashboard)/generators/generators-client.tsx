"use client";

import { useState, useTransition, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconFileText,
  IconFileInvoice,
  IconFileDescription,
  IconPlus,
  IconTrash,
  IconDownload,
  IconSearch,
  IconAlertCircle,
  IconLoader,
  IconCheck,
  IconX,
  IconSparkles,
  IconClock,
  IconCurrencyRupee,
  IconCalendar,
  IconUser,
  IconBriefcase,
  IconReceipt,
  IconPercentage,
  IconShieldCheck,
  IconEye,
  IconAward,
  IconCircleCheck,
  IconEdit,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  createProposal,
  createInvoice,
  createAgreement,
  deleteGeneratorItem,
  updateGeneratorStatus,
  regenerateAgreementPdf,
  getGeneratorItemDetails,
  updateProposal,
  updateInvoice,
  updateAgreement,
} from "./actions";
import { useToast } from "@/components/ui/toast-provider";
import { confirmModal } from "@/components/ui/confirm-provider";

// ─── Types ───────────────────────────────────

type ClientInfo = {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  gstin: string | null;
  address: string;
};

type LeadInfo = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  stage: string;
  convertedClientId: string | null;
  displayName: string;
};

type ProjectInfo = {
  id: string;
  name: string;
  clientId: string;
  budget: number;
};

type ProposalItem = {
  id: string;
  number: string;
  title: string;
  clientId: string;
  clientName: string;
  projectId: string | null;
  projectName: string | null;
  amount: number | null;
  status: string;
  validUntil: string | null;
  pdfKey: string | null;
  createdAt: string;
};

type InvoiceItem = {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  projectId: string | null;
  projectName: string | null;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: string;
  issueDate: string;
  dueDate: string | null;
  notes: string | null;
  pdfKey: string | null;
  createdAt: string;
};

type AgreementItem = {
  id: string;
  number: string;
  title: string;
  clientId: string;
  clientName: string;
  projectId: string | null;
  projectName: string | null;
  status: string;
  effectiveDate: string | null;
  expiresAt: string | null;
  pdfKey: string | null;
  createdAt: string;
};

type PricingRow = { description: string; quantity: number; rate: number; amount: number };
type LineItemRow = { description: string; quantity: number; rate: number; amount: number };

type Props = {
  clients: ClientInfo[];
  leads: LeadInfo[];
  projects: ProjectInfo[];
  initialProposals: ProposalItem[];
  initialInvoices: InvoiceItem[];
  initialAgreements: AgreementItem[];
};

// ─── Helpers ─────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(n);

const fmtDate = (d: string) => {
  try {
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch { return d; }
};

const getFileUrl = (key?: string | null) => {
  if (!key) return "#";
  const trimmed = key.trim();
  if (trimmed.startsWith("http")) return trimmed;
  if (trimmed.startsWith("/api/files/")) return trimmed;
  return `/api/files/${trimmed.replace(/^\/+/, "")}`;
};

const statusConfig: Record<string, { color: string; bg: string; dot: string }> = {
  DRAFT: { color: "text-stone-600 dark:text-stone-300", bg: "bg-stone-100 dark:bg-stone-800", dot: "bg-stone-400" },
  SENT: { color: "text-violet-700 dark:text-violet-300", bg: "bg-violet-50 dark:bg-violet-900/30", dot: "bg-violet-500" },
  ACCEPTED: { color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-900/30", dot: "bg-emerald-500" },
  SIGNED: { color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-900/30", dot: "bg-emerald-500" },
  PAID: { color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-900/30", dot: "bg-emerald-500" },
  REJECTED: { color: "text-red-700 dark:text-red-300", bg: "bg-red-50 dark:bg-red-900/20", dot: "bg-red-500" },
  EXPIRED: { color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50 dark:bg-amber-900/20", dot: "bg-amber-500" },
  OVERDUE: { color: "text-red-700 dark:text-red-300", bg: "bg-red-50 dark:bg-red-900/20", dot: "bg-red-500" },
  PARTIALLY_PAID: { color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50 dark:bg-amber-900/20", dot: "bg-amber-500" },
  CANCELLED: { color: "text-stone-500 dark:text-stone-400", bg: "bg-stone-100 dark:bg-stone-800", dot: "bg-stone-400" },
  TERMINATED: { color: "text-red-600 dark:text-red-300", bg: "bg-red-50 dark:bg-red-900/20", dot: "bg-red-500" },
};

const PROPOSAL_STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent" },
  { value: "ACCEPTED", label: "Accepted" },
];

const INVOICE_STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent" },
  { value: "PAID", label: "Paid" },
];

const AGREEMENT_STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent" },
  { value: "SIGNED", label: "Signed" },
];

const StatusBadge = ({
  status,
  options,
  onStatusChange,
}: {
  status: string;
  options?: { value: string; label: string }[];
  onStatusChange?: (newStatus: string) => void;
}) => {
  const cfg = statusConfig[status] || statusConfig.DRAFT;

  if (options && onStatusChange) {
    return (
      <div className="relative inline-flex items-center">
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold tracking-wider uppercase ${cfg.color} ${cfg.bg} cursor-pointer appearance-none pr-4 outline-none border border-transparent hover:border-border-custom transition-all shadow-2xs touch-manipulation`}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-surface-white text-foreground normal-case font-medium text-xs cursor-pointer">
              {opt.label}
            </option>
          ))}
        </select>
        <span className={`pointer-events-none absolute right-1.5 text-[7px] font-bold ${cfg.color}`}>▼</span>
      </div>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold tracking-wider uppercase ${cfg.color} ${cfg.bg}`}>
      <span className={`h-1 w-1 rounded-full ${cfg.dot}`} />
      {status.replace(/_/g, " ")}
    </span>
  );
};

const DEFAULT_TERMS = `1. Payment is due as per the agreed milestone schedule.
2. This proposal is valid for the period specified above.
3. Any changes to the scope may result in adjustments to timeline and pricing.
4. All intellectual property will be transferred upon full payment.
5. Confidentiality of shared information is maintained by both parties.`;

// ─── Main Component ───────────────────────────────

export function GeneratorsClient({
  clients,
  leads,
  projects,
  initialProposals,
  initialInvoices,
  initialAgreements,
}: Props) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"proposals" | "invoices" | "agreements">("proposals");
  const [proposals, setProposals] = useState<ProposalItem[]>(initialProposals);
  const [invoices, setInvoices] = useState<InvoiceItem[]>(initialInvoices);
  const [agreements, setAgreements] = useState<AgreementItem[]>(initialAgreements);
  const [searchQuery, setSearchQuery] = useState("");
  const [agrSubFilter, setAgrSubFilter] = useState<"ALL" | "MSA" | "SOW" | "PCC">("ALL");
  const [isPending, startTransition] = useTransition();

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetType, setSheetType] = useState<"proposal" | "invoice" | "agreement">("proposal");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<"proposal" | "invoice" | "agreement" | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Preview Modal state
  const [previewModal, setPreviewModal] = useState<{
    open: boolean;
    title: string;
    pdfKey: string | null;
    docId?: string;
    type?: "proposal" | "invoice" | "agreement";
  }>({
    open: false, title: "", pdfKey: null,
  });

  const openPreview = (
    title: string,
    pdfKey: string | null,
    docId?: string,
    type?: "proposal" | "invoice" | "agreement"
  ) => {
    if (pdfKey) {
      const url = getFileUrl(pdfKey);
      window.open(url, "_blank");
    } else {
      setPreviewModal({ open: true, title, pdfKey, docId, type });
    }
  };

  // URL search params effect for Quick Actions
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const action = params.get("action");
    const tab = params.get("tab");
    const type = params.get("type");

    if (tab === "proposals") setActiveTab("proposals");
    else if (tab === "invoices") setActiveTab("invoices");
    else if (tab === "agreements") setActiveTab("agreements");

    if (action === "create") {
      if (tab === "proposals") {
        setSheetType("proposal");
        setSheetOpen(true);
      } else if (tab === "invoices") {
        setSheetType("invoice");
        setSheetOpen(true);
      } else if (tab === "agreements") {
        setSheetType("agreement");
        if (type === "completion") {
          setAgrType("COMPLETION");
          setAgrTitle("Project Completion & Handover Certificate (PCC)");
        } else if (type === "sow") {
          setAgrType("SOW");
          setAgrTitle("Statement of Work (SOW) — Engineering Scope");
        } else {
          setAgrType("MASTER");
          setAgrTitle("Master Services Agreement (MSA)");
        }
        setSheetOpen(true);
      }
    }
  }, []);

  // Recipient Selection state (Client or Lead)
  const [recipientVal, setRecipientVal] = useState("");
  const [recipientType, setRecipientType] = useState<"client" | "lead">("client");
  const [recipientId, setRecipientId] = useState("");

  const handleRecipientChange = (rawVal: string, type: "client" | "lead", id: string) => {
    setRecipientVal(rawVal);
    setRecipientType(type);
    setRecipientId(id);

    const targetClientId = type === "client" ? id : (leads.find(l => l.id === id)?.convertedClientId || "");
    const matchingProjects = targetClientId ? projects.filter(p => p.clientId === targetClientId) : [];
    const autoProjId = matchingProjects.length > 0 ? matchingProjects[0].id : "";

    setPropProjectId(autoProjId);
    setInvProjectId(autoProjId);
    setAgrProjectId(autoProjId);

    if (matchingProjects.length > 0 && matchingProjects[0].name) {
      const pName = matchingProjects[0].name;
      setSowProjectOverview(`Engineering high-performance web architecture, cloud deployment pipelines, and digital workflows for ${pName}.`);
    }
  };

  // ─── Proposal Form State ───
  const [propTitle, setPropTitle] = useState("");
  const [propProjectId, setPropProjectId] = useState("");
  const [propSummary, setPropSummary] = useState("");
  const [propScope, setPropScope] = useState("");
  const [propDeliverables, setPropDeliverables] = useState("");
  const [propTimeline, setPropTimeline] = useState("");
  const [propTerms, setPropTerms] = useState(DEFAULT_TERMS);
  const [propValidUntil, setPropValidUntil] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [propPricingItems, setPropPricingItems] = useState<PricingRow[]>([
    { description: "", quantity: 1, rate: 0, amount: 0 },
  ]);

  // ─── Invoice Form State ───
  const [invProjectId, setInvProjectId] = useState("");
  const [invDueDate, setInvDueDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 15);
    return d.toISOString().split("T")[0];
  });
  const [invGstEnabled, setInvGstEnabled] = useState(false);
  const [invGstRate, setInvGstRate] = useState(18);
  const [invNotes, setInvNotes] = useState("");
  const [invLineItems, setInvLineItems] = useState<LineItemRow[]>([
    { description: "", quantity: 1, rate: 0, amount: 0 },
  ]);

  // ─── Agreement & SOW & Completion Form State ───
  const [agrType, setAgrType] = useState<"MASTER" | "SOW" | "COMPLETION">("MASTER");
  const [agrTitle, setAgrTitle] = useState("Master Services Agreement (MSA)");
  const [agrProjectId, setAgrProjectId] = useState("");
  const [agrEffectiveDate, setAgrEffectiveDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [agrExpiresAt, setAgrExpiresAt] = useState("");

  // SOW & Handover Specific State
  const [sowProjectOverview, setSowProjectOverview] = useState("Engineering high-performance enterprise web application architecture, cloud deployment pipelines, and digital workflows.");
  const [sowDeliverables, setSowDeliverables] = useState<Array<{ deliverable: string; description: string }>>([
    { deliverable: "Cloud & Database Architecture", description: "Next.js App Router setup, Neon PostgreSQL schema design, Prisma ORM, and cloud storage." },
    { deliverable: "Document Generator Engine", description: "Playwright Chromium HTML-to-PDF rendering engine for print Invoices, Proposals, and Agreements." },
    { deliverable: "CRM Analytics Dashboard", description: "Real-time client management, lead tracking, milestone billing, and digital payment suite." },
  ]);
  const [sowOutOfScope, setSowOutOfScope] = useState("Third-party paid API subscription costs (Client provides API keys)\nUnbudgeted custom mobile app native development for iOS App Store");
  const [sowTechStack, setSowTechStack] = useState("Next.js, TypeScript, TailwindCSS, Prisma ORM, Neon PostgreSQL, Playwright PDF");
  const [sowMilestones, setSowMilestones] = useState<Array<{ milestone: string; workDescription: string; dueDate: string; paymentAmount: number }>>([
    { milestone: "Milestone 1", workDescription: "Architecture, DB Schema & Authentication Engine", dueDate: "30 July 2026", paymentAmount: 75000 },
    { milestone: "Milestone 2", workDescription: "Document Generators & Analytics Handover", dueDate: "15 August 2026", paymentAmount: 75000 },
  ]);
  const [sowAdvanceAmount, setSowAdvanceAmount] = useState(30000);

  // ─── Derived Projects ───
  const activeClientId = recipientType === "client" ? recipientId : (leads.find(l => l.id === recipientId)?.convertedClientId || "");
  const filteredProjects = useMemo(
    () => (activeClientId ? projects.filter((p) => p.clientId === activeClientId) : projects),
    [activeClientId, projects]
  );

  const propTotal = useMemo(() => propPricingItems.reduce((s, i) => s + i.amount, 0), [propPricingItems]);
  const invSubtotal = useMemo(() => invLineItems.reduce((s, i) => s + i.amount, 0), [invLineItems]);
  const invTaxAmount = invGstEnabled ? Math.round(invSubtotal * (invGstRate / 100) * 100) / 100 : 0;
  const invTotal = invSubtotal + invTaxAmount;

  // ─── Handlers ───
  const openSheet = useCallback((type: "proposal" | "invoice" | "agreement") => {
    setEditingId(null);
    setEditingType(null);
    setSheetType(type);
    setErrorMsg("");
    setSuccessMsg("");
    resetForms();
    setSheetOpen(true);
  }, []);

  const openEditSheet = async (item: ProposalItem | InvoiceItem | AgreementItem, type: "proposal" | "invoice" | "agreement") => {
    setEditingId(item.id);
    setEditingType(type);
    setSheetType(type);
    setErrorMsg("");
    setSuccessMsg("");

    if (item.clientId) {
      setRecipientVal(`client:${item.clientId}`);
      setRecipientType("client");
      setRecipientId(item.clientId);
    }

    setSheetOpen(true);
    setIsLoadingDetails(true);

    const res = await getGeneratorItemDetails(item.id, type);
    setIsLoadingDetails(false);

    if (res.success && res.data) {
      const d = res.data;
      if (type === "proposal") {
        setPropTitle(d.title || "");
        setPropProjectId(d.projectId || "");
        setPropValidUntil(d.validUntil || "");
        if (d.content) {
          setPropSummary(d.content.executiveSummary || "");
          setPropScope(d.content.scope || "");
          setPropDeliverables(Array.isArray(d.content.deliverables) ? d.content.deliverables.join("\n") : (d.content.deliverables || ""));
          setPropTimeline(d.content.timeline || "");
          setPropTerms(d.content.termsAndConditions || DEFAULT_TERMS);
          if (Array.isArray(d.content.pricingItems) && d.content.pricingItems.length > 0) {
            setPropPricingItems(d.content.pricingItems);
          }
        }
      } else if (type === "invoice") {
        setInvProjectId(d.projectId || "");
        setInvDueDate(d.dueDate || "");
        setInvNotes(d.notes || "");
        if (d.taxRate && d.taxRate > 0) {
          setInvGstEnabled(true);
          setInvGstRate(d.taxRate);
        } else {
          setInvGstEnabled(false);
        }
        if (Array.isArray(d.items) && d.items.length > 0) {
          setInvLineItems(d.items);
        }
      } else if (type === "agreement") {
        setAgrTitle(d.title || "");
        setAgrProjectId(d.projectId || "");
        setAgrEffectiveDate(d.effectiveDate || new Date().toISOString().split("T")[0]);
        setAgrExpiresAt(d.expiresAt || "");
        if (d.content) {
          setAgrType(d.content.templateType || "MASTER");
          if (d.content.projectOverview) setSowProjectOverview(d.content.projectOverview);
          if (Array.isArray(d.content.deliverables) && d.content.deliverables.length > 0) {
            setSowDeliverables(d.content.deliverables);
          }
          if (Array.isArray(d.content.outOfScopeItems)) {
            setSowOutOfScope(d.content.outOfScopeItems.join("\n"));
          }
          if (Array.isArray(d.content.techStack)) {
            setSowTechStack(d.content.techStack.join(", "));
          }
          if (Array.isArray(d.content.milestones) && d.content.milestones.length > 0) {
            setSowMilestones(d.content.milestones);
          }
          if (d.content.advanceAmount) {
            setSowAdvanceAmount(Number(d.content.advanceAmount));
          }
        }
      }
    }
  };

  const resetForms = () => {
    setRecipientVal(""); setRecipientType("client"); setRecipientId("");
    setPropTitle(""); setPropProjectId("");
    setPropSummary(""); setPropScope(""); setPropDeliverables("");
    setPropTimeline(""); setPropTerms(DEFAULT_TERMS);
    const d = new Date(); d.setDate(d.getDate() + 30);
    setPropValidUntil(d.toISOString().split("T")[0]);
    setPropPricingItems([{ description: "", quantity: 1, rate: 0, amount: 0 }]);
    setInvProjectId("");
    const d2 = new Date(); d2.setDate(d2.getDate() + 15);
    setInvDueDate(d2.toISOString().split("T")[0]);
    setInvGstEnabled(false); setInvGstRate(18); setInvNotes("");
    setInvLineItems([{ description: "", quantity: 1, rate: 0, amount: 0 }]);
    setAgrType("MASTER"); setAgrTitle("Master Services Agreement (MSA)"); setAgrProjectId("");
    setAgrEffectiveDate(new Date().toISOString().split("T")[0]); setAgrExpiresAt("");
  };

  const updatePricingItem = (idx: number, field: keyof PricingRow, value: string | number) => {
    setPropPricingItems((prev) => {
      const next = [...prev];
      const item = { ...next[idx], [field]: value };
      if (field === "quantity" || field === "rate") item.amount = Number(item.quantity) * Number(item.rate);
      next[idx] = item;
      return next;
    });
  };
  const updateLineItem = (idx: number, field: keyof LineItemRow, value: string | number) => {
    setInvLineItems((prev) => {
      const next = [...prev];
      const item = { ...next[idx], [field]: value };
      if (field === "quantity" || field === "rate") item.amount = Number(item.quantity) * Number(item.rate);
      next[idx] = item;
      return next;
    });
  };

  // ─── Submit Handlers ───
  const handleSubmitProposal = () => {
    if (!propTitle || !recipientId) {
      setErrorMsg("Title and Recipient (Client or Lead) are required.");
      const el = document.querySelector(".sheet-scroll-area");
      if (el) el.scrollTop = 0;
      return;
    }
    if (propPricingItems.some(i => !i.description)) {
      setErrorMsg("All pricing items need a description.");
      return;
    }
    setErrorMsg("");
    startTransition(async () => {
      if (editingId) {
        const result = await updateProposal(editingId, {
          title: propTitle,
          clientId: recipientType === "client" ? recipientId : undefined,
          leadId: recipientType === "lead" ? recipientId : undefined,
          projectId: propProjectId || undefined,
          executiveSummary: propSummary, scope: propScope,
          deliverables: propDeliverables.split("\n").filter(Boolean),
          timeline: propTimeline, pricingItems: propPricingItems,
          totalAmount: propTotal, termsAndConditions: propTerms, validUntil: propValidUntil,
        });
        if (result.success && result.data) {
          setProposals(prev => prev.map(p => p.id === editingId ? {
            ...p,
            title: result.data!.title,
            clientId: result.data!.clientId,
            clientName: result.data!.clientName,
            projectId: result.data!.projectId,
            projectName: result.data!.projectName,
            amount: result.data!.amount,
            validUntil: result.data!.validUntil,
            pdfKey: result.data!.pdfKey,
          } : p));
          setActiveTab("proposals");
          setSuccessMsg(`Proposal ${result.data.number} updated successfully!`);
          toast.success("Proposal Updated", `${result.data.number} PDF regenerated & saved.`);
          resetForms();
          setEditingId(null); setEditingType(null);
          setTimeout(() => { setSheetOpen(false); setSuccessMsg(""); }, 1400);
        } else {
          const err = result.error || "Failed to update proposal";
          setErrorMsg(err);
          toast.error("Update Failed", err);
        }
      } else {
        const result = await createProposal({
          title: propTitle,
          clientId: recipientType === "client" ? recipientId : undefined,
          leadId: recipientType === "lead" ? recipientId : undefined,
          projectId: propProjectId || undefined,
          executiveSummary: propSummary, scope: propScope,
          deliverables: propDeliverables.split("\n").filter(Boolean),
          timeline: propTimeline, pricingItems: propPricingItems,
          totalAmount: propTotal, termsAndConditions: propTerms, validUntil: propValidUntil,
        });
        if (result.success && result.data) {
          const clientName = recipientType === "client"
            ? (clients.find(c => c.id === recipientId)?.name || "")
            : (leads.find(l => l.id === recipientId)?.displayName || "");
          const project = projects.find(p => p.id === propProjectId);
          setProposals(prev => [{
            id: result.data!.id, number: result.data!.number, title: propTitle,
            clientId: recipientId, clientName,
            projectId: propProjectId || null, projectName: project?.name || null,
            amount: propTotal, status: "DRAFT", validUntil: propValidUntil,
            pdfKey: result.data!.pdfKey, createdAt: new Date().toISOString(),
          }, ...prev]);
          setActiveTab("proposals");
          setSuccessMsg(`Proposal ${result.data.number} created successfully!`);
          toast.success("Proposal PDF Generated", `${result.data.number} saved & linked to ${clientName}.`);
          resetForms();
          setTimeout(() => { setSheetOpen(false); setSuccessMsg(""); }, 1400);
        } else {
          const err = result.error || "Failed to create proposal";
          setErrorMsg(err);
          toast.error("Generation Failed", err);
        }
      }
    });
  };

  const handleSubmitInvoice = () => {
    if (!recipientId) {
      setErrorMsg("Recipient (Client or Lead) is required.");
      const el = document.querySelector(".sheet-scroll-area");
      if (el) el.scrollTop = 0;
      return;
    }
    if (invLineItems.some(i => !i.description)) {
      setErrorMsg("All line items need a description.");
      return;
    }
    setErrorMsg("");
    startTransition(async () => {
      if (editingId) {
        const result = await updateInvoice(editingId, {
          clientId: recipientType === "client" ? recipientId : undefined,
          leadId: recipientType === "lead" ? recipientId : undefined,
          projectId: invProjectId || undefined,
          lineItems: invLineItems, subtotal: invSubtotal,
          taxRate: invGstEnabled ? invGstRate : 0, taxAmount: invTaxAmount,
          total: invTotal, dueDate: invDueDate, notes: invNotes || undefined,
        });
        if (result.success && result.data) {
          setInvoices(prev => prev.map(i => i.id === editingId ? {
            ...i,
            clientId: result.data!.clientId,
            clientName: result.data!.clientName,
            projectId: result.data!.projectId,
            projectName: result.data!.projectName,
            subtotal: result.data!.subtotal,
            taxRate: result.data!.taxRate,
            taxAmount: result.data!.taxAmount,
            total: result.data!.total,
            dueDate: result.data!.dueDate,
            notes: result.data!.notes,
            pdfKey: result.data!.pdfKey,
          } : i));
          setActiveTab("invoices");
          setSuccessMsg(`Invoice ${result.data.number} updated successfully!`);
          toast.success("Invoice Updated", `${result.data.number} PDF regenerated & saved.`);
          resetForms();
          setEditingId(null); setEditingType(null);
          setTimeout(() => { setSheetOpen(false); setSuccessMsg(""); }, 1400);
        } else {
          const err = result.error || "Failed to update invoice";
          setErrorMsg(err);
          toast.error("Update Failed", err);
        }
      } else {
        const result = await createInvoice({
          clientId: recipientType === "client" ? recipientId : undefined,
          leadId: recipientType === "lead" ? recipientId : undefined,
          projectId: invProjectId || undefined,
          lineItems: invLineItems, subtotal: invSubtotal,
          taxRate: invGstEnabled ? invGstRate : 0, taxAmount: invTaxAmount,
          total: invTotal, dueDate: invDueDate, notes: invNotes || undefined,
        });
        if (result.success && result.data) {
          const clientName = recipientType === "client"
            ? (clients.find(c => c.id === recipientId)?.name || "")
            : (leads.find(l => l.id === recipientId)?.displayName || "");
          const project = projects.find(p => p.id === invProjectId);
          setInvoices(prev => [{
            id: result.data!.id, number: result.data!.number,
            clientId: recipientId, clientName,
            projectId: invProjectId || null, projectName: project?.name || null,
            subtotal: invSubtotal, taxRate: invGstEnabled ? invGstRate : 0,
            taxAmount: invTaxAmount, total: invTotal, status: "DRAFT",
            issueDate: new Date().toISOString(), dueDate: invDueDate,
            notes: invNotes || null, pdfKey: result.data!.pdfKey, createdAt: new Date().toISOString(),
          }, ...prev]);
          setActiveTab("invoices");
          setSuccessMsg(`Invoice ${result.data.number} created successfully!`);
          toast.success("Invoice PDF Generated", `${result.data.number} saved & linked to ${clientName}.`);
          resetForms();
          setTimeout(() => { setSheetOpen(false); setSuccessMsg(""); }, 1400);
        } else {
          const err = result.error || "Failed to create invoice";
          setErrorMsg(err);
          toast.error("Generation Failed", err);
        }
      }
    });
  };

  const handleSubmitAgreement = () => {
    if (!recipientId) {
      setErrorMsg("Recipient (Client or Lead) is required.");
      const el = document.querySelector(".sheet-scroll-area");
      if (el) el.scrollTop = 0;
      return;
    }
    setErrorMsg("");
    startTransition(async () => {
      const payload: any = {
        title: agrTitle || (agrType === "COMPLETION" ? "Project Completion & Handover Certificate (PCC)" : agrType === "SOW" ? "Statement of Work (SOW) — Engineering Scope" : "Master Services Agreement (MSA)"),
        templateType: agrType,
        clientId: recipientType === "client" ? recipientId : undefined,
        leadId: recipientType === "lead" ? recipientId : undefined,
        projectId: agrProjectId || undefined,
        effectiveDate: agrEffectiveDate,
        expiresAt: agrExpiresAt || undefined,
      };

      if (agrType === "SOW" || agrType === "COMPLETION") {
        payload.projectOverview = sowProjectOverview;
        payload.deliverables = sowDeliverables.filter(d => d.deliverable.trim());
        payload.outOfScopeItems = sowOutOfScope.split('\n').map(s => s.trim()).filter(Boolean);
        payload.techStack = sowTechStack.split(',').map(s => s.trim()).filter(Boolean);
        payload.milestones = sowMilestones.filter(m => m.milestone.trim());
        payload.totalFee = sowMilestones.reduce((sum, m) => sum + (Number(m.paymentAmount) || 0), 0);
        payload.advanceAmount = Number(sowAdvanceAmount) || 0;
      }

      if (editingId) {
        const result = await updateAgreement(editingId, payload);
        if (result.success && result.data) {
          setAgreements(prev => prev.map(a => a.id === editingId ? {
            ...a,
            title: result.data!.title,
            clientId: result.data!.clientId,
            clientName: result.data!.clientName,
            projectId: result.data!.projectId,
            projectName: result.data!.projectName,
            effectiveDate: result.data!.effectiveDate,
            expiresAt: result.data!.expiresAt,
            pdfKey: result.data!.pdfKey,
          } : a));
          setActiveTab("agreements");
          const typeLabel = agrType === "COMPLETION" ? "Handover Certificate" : agrType === "SOW" ? "Statement of Work" : "Master Agreement";
          setSuccessMsg(`${typeLabel} ${result.data.number} updated successfully!`);
          toast.success(`${typeLabel} Updated`, `${result.data.number} PDF regenerated & saved.`);
          resetForms();
          setEditingId(null); setEditingType(null);
          setTimeout(() => { setSheetOpen(false); setSuccessMsg(""); }, 1400);
        } else {
          const err = result.error || "Failed to update agreement";
          setErrorMsg(err);
          toast.error("Update Failed", err);
        }
      } else {
        const result = await createAgreement(payload);
        if (result.success && result.data) {
          const clientName = recipientType === "client"
            ? (clients.find(c => c.id === recipientId)?.name || "")
            : (leads.find(l => l.id === recipientId)?.displayName || "");
          const project = projects.find(p => p.id === agrProjectId);
          setAgreements(prev => [{
            id: result.data!.id, number: result.data!.number, title: payload.title,
            clientId: recipientId, clientName,
            projectId: agrProjectId || null, projectName: project?.name || null,
            status: "DRAFT", effectiveDate: agrEffectiveDate,
            expiresAt: agrExpiresAt || null,
            pdfKey: result.data!.pdfKey, createdAt: new Date().toISOString(),
          }, ...prev]);
          setActiveTab("agreements");
          const typeLabel = agrType === "COMPLETION" ? "Handover Certificate" : agrType === "SOW" ? "Statement of Work" : "Master Agreement";
          setSuccessMsg(`${typeLabel} ${result.data.number} created successfully!`);
          toast.success(`${typeLabel} Rendered`, `${result.data.number} saved & linked to ${clientName}.`);
          resetForms();
          setTimeout(() => { setSheetOpen(false); setSuccessMsg(""); }, 1400);
        } else {
          const err = result.error || "Failed to create agreement";
          setErrorMsg(err);
          toast.error("Generation Failed", err);
        }
      }
    });
  };

  const handleDelete = async (id: string, type: "proposal" | "invoice" | "agreement") => {
    const ok = await confirmModal({
      title: `Delete ${type.charAt(0).toUpperCase() + type.slice(1)}?`,
      description: `Are you sure you want to delete this ${type}? This action cannot be undone.`,
      confirmText: `Delete ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      variant: "danger",
    });
    if (!ok) return;

    startTransition(async () => {
      const result = await deleteGeneratorItem(id, type);
      if (result.success) {
        if (type === "proposal") setProposals(prev => prev.filter(p => p.id !== id));
        else if (type === "invoice") setInvoices(prev => prev.filter(i => i.id !== id));
        else setAgreements(prev => prev.filter(a => a.id !== id));
        toast.warning("Document Deleted", `The ${type} record was permanently removed.`);
      } else {
        toast.error("Delete Failed", result.error || `Could not delete ${type}`);
      }
    });
  };

  const handleStatusChange = (id: string, type: "proposal" | "invoice" | "agreement", newStatus: string) => {
    startTransition(async () => {
      const result = await updateGeneratorStatus(id, type, newStatus);
      if (result.success) {
        if (type === "proposal") setProposals(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
        else if (type === "invoice") setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));
        else setAgreements(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
        toast.info("Status Updated", `Document status changed to ${newStatus.replace(/_/g, " ")}.`);
      } else {
        toast.error("Update Failed", result.error || "Failed to update status");
      }
    });
  };

  // ─── Filtered Items ───
  const filteredProposals = useMemo(
    () => proposals.filter(p => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase().trim();
      return [p.title, p.number, p.clientName, p.projectName, p.amount ? String(p.amount) : ""]
        .some(s => s && s.toLowerCase().includes(q));
    }),
    [proposals, searchQuery]
  );
  const filteredInvoices = useMemo(
    () => invoices.filter(i => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase().trim();
      return [i.number, i.clientName, i.projectName, i.total ? String(i.total) : ""]
        .some(s => s && s.toLowerCase().includes(q));
    }),
    [invoices, searchQuery]
  );
  const filteredAgreements = useMemo(
    () => agreements.filter(a => {
      if (agrSubFilter === "MSA" && !(a.title.includes("Master") || a.title.includes("MSA"))) return false;
      if (agrSubFilter === "SOW" && !(a.title.includes("Statement") || a.title.includes("SOW"))) return false;
      if (agrSubFilter === "PCC" && !(a.title.includes("Completion") || a.title.includes("PCC") || a.title.includes("Handover"))) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase().trim();
      return [a.title, a.number, a.clientName, a.projectName]
        .some(s => s && s.toLowerCase().includes(q));
    }),
    [agreements, searchQuery, agrSubFilter]
  );

  const tabs = [
    { id: "proposals" as const, label: "Proposals", icon: IconFileText, count: proposals.length, accent: "from-violet-500 to-purple-600", iconBg: "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400" },
    { id: "invoices" as const, label: "Invoices", icon: IconFileInvoice, count: invoices.length, accent: "from-blue-500 to-cyan-600", iconBg: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400" },
    { id: "agreements" as const, label: "Agreements & PCC", icon: IconFileDescription, count: agreements.length, accent: "from-emerald-500 to-teal-600", iconBg: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400" },
  ];

  return (
    <div className="space-y-4 pb-24 md:pb-6">
      {/* ─── Compact Refined Header ─── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center p-1.5 rounded-lg bg-brand-orange/10 text-brand-orange">
              <IconSparkles className="h-4 w-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Document Generators</h1>
          </div>
          <p className="text-[11px] sm:text-xs text-text-secondary mt-0.5">
            Create branded proposals, tax invoices, agreements &amp; project completion certificates.
          </p>
        </div>

        {/* Compact Responsive Action Group */}
        <div className="grid grid-cols-2 sm:flex gap-1.5 items-center">
          <Button
            size="sm"
            onClick={() => openSheet("proposal")}
            className="gap-1.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-lg active:scale-95 transition-all py-1.5 px-3 text-xs font-semibold shadow-2xs cursor-pointer"
          >
            <IconFileText className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Proposal</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => openSheet("invoice")}
            className="gap-1.5 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg active:scale-95 transition-all py-1.5 px-3 text-xs font-semibold cursor-pointer"
          >
            <IconFileInvoice className="h-3.5 w-3.5 shrink-0 text-blue-600" />
            <span className="truncate">Invoice</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSheetType("agreement");
              setAgrType("MASTER");
              setAgrTitle("Master Services Agreement (MSA)");
              setSheetOpen(true);
            }}
            className="gap-1.5 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg active:scale-95 transition-all py-1.5 px-3 text-xs font-semibold cursor-pointer"
          >
            <IconFileDescription className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
            <span className="truncate">Agreement</span>
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setSheetType("agreement");
              setAgrType("COMPLETION");
              setAgrTitle("Project Completion & Handover Certificate (PCC)");
              setSheetOpen(true);
            }}
            className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl active:scale-95 transition-all duration-150 py-2 px-3.5 text-xs font-extrabold shadow-xs cursor-pointer"
          >
            <IconAward className="h-4 w-4 shrink-0 text-indigo-100" />
            <span className="truncate">Handover PCC</span>
          </Button>
        </div>
      </div>

      {/* ─── Compact Animated Tab Cards ─── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className={`relative overflow-hidden rounded-xl border p-2.5 sm:p-3 text-left transition-all duration-200 cursor-pointer touch-manipulation ${
                isActive
                  ? "border-brand-orange/50 bg-surface-white shadow-md ring-1 ring-brand-orange/20"
                  : "border-border-custom bg-surface-white hover:border-brand-orange/30 hover:shadow-2xs"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabGlow"
                  className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${tab.accent}`}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg transition-all ${
                  isActive ? `${tab.iconBg} scale-105` : "bg-surface-page text-text-secondary"
                }`}>
                  <tab.icon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] sm:text-[10px] font-bold text-text-secondary uppercase tracking-wider truncate">{tab.label}</p>
                  <p className="text-base sm:text-lg font-black text-foreground -mt-0.5">{tab.count}</p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* ─── Compact Search & Sub-Filter Bar ─── */}
      <div className="space-y-2">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center text-text-secondary pointer-events-none">
            <IconSearch className="h-3.5 w-3.5" />
          </div>
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border-custom bg-surface-white/90 py-2 pl-9 pr-8 text-xs text-foreground placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-brand-orange/40 focus:border-brand-orange/60 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-text-secondary hover:text-foreground transition rounded-full hover:bg-surface-page cursor-pointer"
            >
              <IconX className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Sub-Filter Pill Tabs for Agreements & PCC */}
        {activeTab === "agreements" && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide pt-1">
            <button
              type="button"
              onClick={() => setAgrSubFilter("ALL")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all whitespace-nowrap active:scale-95 ${
                agrSubFilter === "ALL"
                  ? "bg-surface-white text-emerald-600 shadow-2xs border border-border-custom"
                  : "text-text-secondary hover:text-foreground bg-surface-page/60"
              }`}
            >
              All Documents ({agreements.length})
            </button>
            <button
              type="button"
              onClick={() => setAgrSubFilter("MSA")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all whitespace-nowrap active:scale-95 ${
                agrSubFilter === "MSA"
                  ? "bg-surface-white text-emerald-600 shadow-2xs border border-border-custom"
                  : "text-text-secondary hover:text-foreground bg-surface-page/60"
              }`}
            >
              Master MSA ({agreements.filter(a => a.title.includes("Master") || a.title.includes("MSA")).length})
            </button>
            <button
              type="button"
              onClick={() => setAgrSubFilter("SOW")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all whitespace-nowrap active:scale-95 ${
                agrSubFilter === "SOW"
                  ? "bg-surface-white text-emerald-600 shadow-2xs border border-border-custom"
                  : "text-text-secondary hover:text-foreground bg-surface-page/60"
              }`}
            >
              SOW Scope ({agreements.filter(a => a.title.includes("Statement") || a.title.includes("SOW")).length})
            </button>
            <button
              type="button"
              onClick={() => setAgrSubFilter("PCC")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all duration-150 whitespace-nowrap active:scale-95 flex items-center gap-1.5 ${
                agrSubFilter === "PCC"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-indigo-700 dark:text-indigo-300 hover:text-indigo-800 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20"
              }`}
            >
              <IconAward className={`h-3.5 w-3.5 ${agrSubFilter === "PCC" ? "text-indigo-200" : "text-indigo-600 dark:text-indigo-400"}`} />
              <span>Handover PCC ({agreements.filter(a => a.title.includes("Completion") || a.title.includes("PCC") || a.title.includes("Handover")).length})</span>
            </button>
          </div>
        )}
      </div>

      {/* ─── Animated Compact Document List ─── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="space-y-2.5"
        >
          {activeTab === "proposals" && (
            filteredProposals.length === 0 ? <EmptyState type="proposals" onAction={() => openSheet("proposal")} /> :
            filteredProposals.map((p, idx) => (
              <DocumentCard
                key={p.id}
                index={idx}
                icon={<IconFileText className="h-4 w-4" />}
                iconBg="bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
                title={p.title}
                status={p.status}
                type="proposal"
                badge={<StatusBadge status={p.status} options={PROPOSAL_STATUSES} onStatusChange={(ns) => handleStatusChange(p.id, "proposal", ns)} />}
                onQuickStatusChange={(ns) => handleStatusChange(p.id, "proposal", ns)}
                meta={[p.number, p.clientName, p.projectName, p.amount != null ? fmt(p.amount) : null].filter(Boolean) as string[]}
                subtitle={p.validUntil ? `Valid until ${fmtDate(p.validUntil)}` : undefined}
                pdfKey={p.pdfKey}
                onView={() => openPreview(`Proposal: ${p.title} (${p.number})`, p.pdfKey, p.id, "proposal")}
                onEdit={() => openEditSheet(p, "proposal")}
                onDelete={() => handleDelete(p.id, "proposal")}
              />
            ))
          )}

          {activeTab === "invoices" && (
            filteredInvoices.length === 0 ? <EmptyState type="invoices" onAction={() => openSheet("invoice")} /> :
            filteredInvoices.map((inv, idx) => (
              <DocumentCard
                key={inv.id}
                index={idx}
                icon={<IconFileInvoice className="h-4 w-4" />}
                iconBg="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                title={inv.number}
                status={inv.status}
                type="invoice"
                badge={<StatusBadge status={inv.status} options={INVOICE_STATUSES} onStatusChange={(ns) => handleStatusChange(inv.id, "invoice", ns)} />}
                onQuickStatusChange={(ns) => handleStatusChange(inv.id, "invoice", ns)}
                meta={[inv.clientName, inv.projectName, fmt(inv.total)].filter(Boolean) as string[]}
                subtitle={inv.dueDate ? `Due ${fmtDate(inv.dueDate)}` : undefined}
                pdfKey={inv.pdfKey}
                onView={() => openPreview(`Invoice: ${inv.number} — ${inv.clientName}`, inv.pdfKey, inv.id, "invoice")}
                onEdit={() => openEditSheet(inv, "invoice")}
                onDelete={() => handleDelete(inv.id, "invoice")}
              />
            ))
          )}

          {activeTab === "agreements" && (
            filteredAgreements.length === 0 ? <EmptyState type="agreements" onAction={() => openSheet("agreement")} /> :
            filteredAgreements.map((a, idx) => (
              <DocumentCard
                key={a.id}
                index={idx}
                icon={a.title.includes("Completion") || a.title.includes("PCC") ? <IconAward className="h-4 w-4" /> : <IconFileDescription className="h-4 w-4" />}
                iconBg={a.title.includes("Completion") || a.title.includes("PCC") ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"}
                title={a.title}
                status={a.status}
                type="agreement"
                badge={<StatusBadge status={a.status} options={AGREEMENT_STATUSES} onStatusChange={(ns) => handleStatusChange(a.id, "agreement", ns)} />}
                onQuickStatusChange={(ns) => handleStatusChange(a.id, "agreement", ns)}
                meta={[a.number, a.clientName, a.projectName].filter(Boolean) as string[]}
                subtitle={a.effectiveDate ? `Effective from ${fmtDate(a.effectiveDate)}` : undefined}
                pdfKey={a.pdfKey}
                onView={() => openPreview(`Document: ${a.number} — ${a.clientName}`, a.pdfKey, a.id, "agreement")}
                onEdit={() => openEditSheet(a, "agreement")}
                onDelete={() => handleDelete(a.id, "agreement")}
              />
            ))
          )}
        </motion.div>
      </AnimatePresence>

      {/* ─── PDF PREVIEW MODAL ─── */}
      <PdfPreviewModal
        open={previewModal.open}
        onClose={() => setPreviewModal({ open: false, title: "", pdfKey: null })}
        title={previewModal.title}
        pdfKey={previewModal.pdfKey}
        docId={previewModal.docId}
        type={previewModal.type}
        onRefreshPdf={(id, newKey) => {
          setAgreements(prev => prev.map(a => a.id === id ? { ...a, pdfKey: newKey } : a));
        }}
      />

      {/* ─── SHEET (Refined Compact Form Drawer) ─── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-hidden p-0 flex flex-col h-full border-l border-border-custom bg-surface-white">
          {/* Header */}
          <div className={`px-5 py-4 border-b border-border-custom bg-gradient-to-br ${
            sheetType === "proposal" ? "from-violet-50/80 to-surface-white dark:from-violet-950/40 dark:to-surface-white" :
            sheetType === "invoice" ? "from-blue-50/80 to-surface-white dark:from-blue-950/40 dark:to-surface-white" :
            "from-emerald-50/80 to-surface-white dark:from-emerald-950/40 dark:to-surface-white"
          }`}>
            <SheetHeader className="text-left">
              <SheetTitle className="flex items-center gap-2 text-base font-bold">
                {sheetType === "proposal" && (
                  <>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 text-white shadow-2xs">
                      <IconFileText className="h-4 w-4" />
                    </div>
                    <span>{editingId ? "Edit Proposal & Regenerate PDF" : "New Proposal"}</span>
                  </>
                )}
                {sheetType === "invoice" && (
                  <>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-2xs">
                      <IconFileInvoice className="h-4 w-4" />
                    </div>
                    <span>{editingId ? "Edit Tax Invoice & Regenerate PDF" : "New Tax Invoice"}</span>
                  </>
                )}
                {sheetType === "agreement" && (
                  <>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-2xs">
                      <IconFileDescription className="h-4 w-4" />
                    </div>
                    <span>{editingId ? "Edit Legal Document / PCC & Regenerate PDF" : "New Legal Document / PCC"}</span>
                  </>
                )}
              </SheetTitle>
              <SheetDescription className="text-[11px] text-text-secondary mt-0.5">
                {sheetType === "proposal" && (editingId ? "Modify proposal scope, deliverables, timeline & pricing, then re-render PDF." : "Create a branded proposal with scope, deliverables, timeline & pricing.")}
                {sheetType === "invoice" && (editingId ? "Modify invoice line items, GST breakdown & due date, then re-render PDF." : "Generate a tax invoice with line items, GST breakdown & due date.")}
                {sheetType === "agreement" && (editingId ? "Modify contract scope, milestones & handover details, then re-render PDF." : "Generate Master Services Agreement (MSA), Statement of Work (SOW), or Handover Certificate (PCC).")}
              </SheetDescription>
            </SheetHeader>
          </div>

          {/* Form Scroll Area */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 sheet-scroll-area">
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 p-3 text-xs text-red-700 dark:text-red-300 font-medium"
              >
                <IconAlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" /> <span>{errorMsg}</span>
              </motion.div>
            )}
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 p-3 text-xs text-emerald-700 dark:text-emerald-300 font-semibold"
              >
                <IconCheck className="h-3.5 w-3.5 shrink-0 mt-0.5" /> <span>{successMsg}</span>
              </motion.div>
            )}

            {/* ─── PROPOSAL FORM ─── */}
            {sheetType === "proposal" && (
              <>
                <FormSection title="01. General Info">
                  <Field label="Proposal Title" required icon={<IconFileText className="h-3 w-3 text-violet-500" />}>
                    <input type="text" value={propTitle} onChange={e => setPropTitle(e.target.value)} placeholder="e.g., Enterprise Web App Redesign" className="field-input" />
                  </Field>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Recipient (Client or Lead)" required icon={<IconUser className="h-3 w-3 text-violet-500" />}>
                      <RecipientSelect value={recipientVal} onChange={handleRecipientChange} clients={clients} leads={leads} />
                    </Field>
                    <Field label="Associated Project" icon={<IconBriefcase className="h-3 w-3 text-violet-500" />}>
                      <select value={propProjectId} onChange={e => setPropProjectId(e.target.value)} className="field-input field-select cursor-pointer">
                        <option value="">None (Standalone)</option>
                        {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </Field>
                  </div>
                </FormSection>

                <FormSection title="02. Scope & Deliverables">
                  <Field label="Executive Summary">
                    <textarea value={propSummary} onChange={e => setPropSummary(e.target.value)} placeholder="Brief executive summary..." rows={2} className="field-input resize-none" />
                  </Field>
                  <Field label="Scope of Work">
                    <textarea value={propScope} onChange={e => setPropScope(e.target.value)} placeholder="Technical scope details..." rows={2} className="field-input resize-none" />
                  </Field>
                  <Field label="Deliverables" hint="One per line">
                    <textarea value={propDeliverables} onChange={e => setPropDeliverables(e.target.value)} placeholder={"Responsive Web App\nAdmin CRM Dashboard\nCloud Deployment"} rows={3} className="field-input resize-none" />
                  </Field>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Timeline">
                      <input type="text" value={propTimeline} onChange={e => setPropTimeline(e.target.value)} placeholder="e.g., 6 Weeks Kickoff" className="field-input" />
                    </Field>
                    <Field label="Valid Until" icon={<IconCalendar className="h-3 w-3 text-violet-500" />}>
                      <input type="date" value={propValidUntil} onChange={e => setPropValidUntil(e.target.value)} className="field-input cursor-pointer" />
                    </Field>
                  </div>
                </FormSection>

                <FormSection title="03. Pricing">
                  <ItemsTable
                    label="Pricing Items"
                    items={propPricingItems}
                    onUpdate={updatePricingItem}
                    onAdd={() => setPropPricingItems(prev => [...prev, { description: "", quantity: 1, rate: 0, amount: 0 }])}
                    onRemove={(idx) => setPropPricingItems(prev => prev.filter((_, i) => i !== idx))}
                  />
                  <TotalBar label="Total Amount" amount={propTotal} />
                </FormSection>

                <FormSection title="04. Terms">
                  <Field label="Terms & Conditions">
                    <textarea value={propTerms} onChange={e => setPropTerms(e.target.value)} rows={3} className="field-input resize-none text-[11px] leading-relaxed" />
                  </Field>
                </FormSection>

                <SubmitButton label={editingId ? "Update Proposal & Re-render PDF" : "Generate Proposal PDF"} loading={isPending} error={errorMsg} success={successMsg} onClick={handleSubmitProposal} color="violet" />
              </>
            )}

            {/* ─── INVOICE FORM ─── */}
            {sheetType === "invoice" && (
              <>
                <FormSection title="01. Recipient & Due Date">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Recipient (Client or Lead)" required icon={<IconUser className="h-3 w-3 text-blue-500" />}>
                      <RecipientSelect value={recipientVal} onChange={handleRecipientChange} clients={clients} leads={leads} />
                    </Field>
                    <Field label="Associated Project" icon={<IconBriefcase className="h-3 w-3 text-blue-500" />}>
                      <select value={invProjectId} onChange={e => setInvProjectId(e.target.value)} className="field-input field-select cursor-pointer">
                        <option value="">None (General Invoice)</option>
                        {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </Field>
                  </div>
                  <Field label="Due Date" icon={<IconCalendar className="h-3 w-3 text-blue-500" />}>
                    <input type="date" value={invDueDate} onChange={e => setInvDueDate(e.target.value)} className="field-input cursor-pointer" />
                  </Field>
                </FormSection>

                <FormSection title="02. Line Items">
                  <ItemsTable
                    label="Services & Items"
                    items={invLineItems}
                    onUpdate={updateLineItem}
                    onAdd={() => setInvLineItems(prev => [...prev, { description: "", quantity: 1, rate: 0, amount: 0 }])}
                    onRemove={(idx) => setInvLineItems(prev => prev.filter((_, i) => i !== idx))}
                  />

                  {/* GST Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border-custom bg-surface-page/70">
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setInvGstEnabled(!invGstEnabled)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${invGstEnabled ? "bg-blue-600" : "bg-stone-300 dark:bg-stone-700"}`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform duration-200 ${invGstEnabled ? "translate-x-4" : "translate-x-0"}`} />
                      </button>
                      <span className="text-xs font-bold text-foreground flex items-center gap-1">
                        <IconPercentage className="h-3.5 w-3.5 text-blue-500" /> Enable GST
                      </span>
                    </div>
                    {invGstEnabled && (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={invGstRate}
                          onChange={e => setInvGstRate(Number(e.target.value))}
                          className="field-input w-14 text-xs text-center !py-0.5 !px-1"
                          min={0}
                          max={28}
                        />
                        <span className="text-xs text-text-secondary font-bold">%</span>
                      </div>
                    )}
                  </div>

                  {/* Total Calculations */}
                  <div className="rounded-xl border border-border-custom overflow-hidden shadow-2xs">
                    <div className="flex justify-between items-center px-3.5 py-2 text-xs bg-surface-white border-b border-border-custom">
                      <span className="text-text-secondary font-medium">Subtotal</span>
                      <span className="font-semibold text-foreground tabular-nums">{fmt(invSubtotal)}</span>
                    </div>
                    {invGstEnabled && (
                      <div className="flex justify-between items-center px-3.5 py-2 text-xs bg-surface-white border-b border-border-custom">
                        <span className="text-text-secondary font-medium flex items-center gap-1">
                          <span className="inline-flex h-4 px-1 items-center justify-center rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-[9px] font-bold">{invGstRate}%</span>
                          GST Tax
                        </span>
                        <span className="font-semibold text-foreground tabular-nums">{fmt(invTaxAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center px-3.5 py-3 bg-gradient-to-r from-blue-500/10 via-cyan-500/5 to-transparent">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 uppercase tracking-wider">
                        <IconCurrencyRupee className="h-3.5 w-3.5" /> Total Payable
                      </span>
                      <span className="text-sm sm:text-base font-extrabold text-blue-600 dark:text-blue-400 tabular-nums">{fmt(invTotal)}</span>
                    </div>
                  </div>
                </FormSection>

                <FormSection title="03. Notes">
                  <Field label="Notes">
                    <textarea value={invNotes} onChange={e => setInvNotes(e.target.value)} placeholder="Payment instructions..." rows={2} className="field-input resize-none" />
                  </Field>
                </FormSection>

                <SubmitButton label={editingId ? "Update Tax Invoice & Re-render PDF" : "Generate Tax Invoice PDF"} loading={isPending} error={errorMsg} success={successMsg} onClick={handleSubmitInvoice} color="blue" />
              </>
            )}

            {/* ─── AGREEMENT & SOW & COMPLETION FORM ─── */}
            {sheetType === "agreement" && (
              <>
                <FormSection title="01. Document Type Selector">
                  <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-surface-page border border-border-custom">
                    <button
                      type="button"
                      onClick={() => {
                        setAgrType("MASTER");
                        setAgrTitle("Master Services Agreement (MSA)");
                      }}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer touch-manipulation ${
                        agrType === "MASTER"
                          ? "bg-surface-white text-emerald-700 dark:text-emerald-300 shadow-xs border-2 border-emerald-500/80 ring-1 ring-emerald-500/20"
                          : "text-text-secondary hover:text-foreground bg-surface-page/50 border border-border/60"
                      }`}
                    >
                      <IconShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="truncate">Master MSA</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAgrType("SOW");
                        setAgrTitle("Statement of Work (SOW) — Engineering Scope");
                      }}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer touch-manipulation ${
                        agrType === "SOW"
                          ? "bg-surface-white text-emerald-700 dark:text-emerald-300 shadow-xs border-2 border-emerald-500/80 ring-1 ring-emerald-500/20"
                          : "text-text-secondary hover:text-foreground bg-surface-page/50 border border-border/60"
                      }`}
                    >
                      <IconFileDescription className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="truncate">SOW Scope</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAgrType("COMPLETION");
                        setAgrTitle("Project Completion & Handover Certificate (PCC)");
                      }}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer touch-manipulation ${
                        agrType === "COMPLETION"
                          ? "bg-surface-white text-indigo-700 dark:text-indigo-300 shadow-xs border-2 border-indigo-600 ring-1 ring-indigo-500/20"
                          : "text-text-secondary hover:text-foreground bg-surface-page/50 border border-border/60"
                      }`}
                    >
                      <IconAward className="h-4 w-4 text-indigo-600 shrink-0" />
                      <span className="truncate">Handover PCC</span>
                    </button>
                  </div>
                </FormSection>

                <FormSection title="02. Recipient & Details">
                  <Field label="Document Title" required icon={<IconFileDescription className="h-3 w-3 text-emerald-500" />}>
                    <input type="text" value={agrTitle} onChange={e => setAgrTitle(e.target.value)} placeholder="Title..." className="field-input" />
                  </Field>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Recipient (Client or Lead)" required icon={<IconUser className="h-3 w-3 text-emerald-500" />}>
                      <RecipientSelect value={recipientVal} onChange={handleRecipientChange} clients={clients} leads={leads} />
                    </Field>
                    <Field label="Associated Project" icon={<IconBriefcase className="h-3 w-3 text-emerald-500" />}>
                      <select
                        value={agrProjectId}
                        onChange={e => {
                          const pid = e.target.value;
                          setAgrProjectId(pid);
                          if (pid) {
                            const proj = projects.find(p => p.id === pid);
                            if (proj) {
                              if (agrType === "COMPLETION") {
                                setAgrTitle(`Project Completion & Handover Certificate (PCC) — ${proj.name}`);
                                setSowProjectOverview(`Official handover certificate confirming all software architecture, database schemas, cloud pipelines, and digital component modules for ${proj.name} have been 100% completed, QA verified, and delivered.`);
                              } else if (agrType === "SOW") {
                                setAgrTitle(`Statement of Work (SOW) — ${proj.name}`);
                                setSowProjectOverview(`Engineering statement of work and technical scope breakdown for ${proj.name}.`);
                              }
                            }
                          }
                        }}
                        className="field-input field-select cursor-pointer"
                      >
                        <option value="">None (Standalone)</option>
                        {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label={agrType === "COMPLETION" ? "Handover Date" : "Effective Date"} icon={<IconCalendar className="h-3 w-3 text-emerald-500" />}>
                      <input type="date" value={agrEffectiveDate} onChange={e => setAgrEffectiveDate(e.target.value)} className="field-input cursor-pointer" />
                    </Field>
                    {agrType === "MASTER" && (
                      <Field label="Expires Date" icon={<IconCalendar className="h-3 w-3 text-emerald-500" />}>
                        <input type="date" value={agrExpiresAt} onChange={e => setAgrExpiresAt(e.target.value)} className="field-input cursor-pointer" />
                      </Field>
                    )}
                  </div>
                </FormSection>

                {/* SOW & COMPLETION SPECIFIC SECTIONS */}
                {(agrType === "SOW" || agrType === "COMPLETION") && (
                  <>
                    <FormSection title={agrType === "COMPLETION" ? "03. Completion Statement & Overview" : "03. SOW Project Scope"}>
                      <Field label={agrType === "COMPLETION" ? "Completion & Handover Summary Statement" : "Project Overview"}>
                        <textarea
                          value={sowProjectOverview}
                          onChange={e => setSowProjectOverview(e.target.value)}
                          placeholder="Scope & Handover summary..."
                          rows={2}
                          className="field-input resize-none"
                        />
                      </Field>

                      {/* Deliverables Dynamic List */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="field-label text-emerald-600">Delivered Scope Items &amp; Modules</span>
                          <button
                            type="button"
                            onClick={() => setSowDeliverables(prev => [...prev, { deliverable: "", description: "" }])}
                            className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer transition"
                          >
                            <IconPlus className="h-3 w-3" /> Add
                          </button>
                        </div>

                        {sowDeliverables.map((item, idx) => (
                          <div key={idx} className="p-2.5 rounded-xl border border-border-custom bg-surface-white dark:bg-surface-page space-y-2 shadow-2xs">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-extrabold text-emerald-600 shrink-0">#{idx + 1}</span>
                              <input
                                type="text"
                                value={item.deliverable}
                                onChange={e => {
                                  const val = e.target.value;
                                  setSowDeliverables(prev => prev.map((d, i) => i === idx ? { ...d, deliverable: val } : d));
                                }}
                                placeholder="Module Name"
                                className="field-input flex-1 text-xs"
                              />
                              {sowDeliverables.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => setSowDeliverables(prev => prev.filter((_, i) => i !== idx))}
                                  className="p-1 text-text-secondary hover:text-red-500 rounded transition-colors cursor-pointer"
                                >
                                  <IconTrash className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                            <textarea
                              value={item.description}
                              onChange={e => {
                                const val = e.target.value;
                                setSowDeliverables(prev => prev.map((d, i) => i === idx ? { ...d, description: val } : d));
                              }}
                              placeholder="Handover specs..."
                              rows={1}
                              className="field-input text-xs resize-none"
                            />
                          </div>
                        ))}
                      </div>

                      {agrType === "SOW" && (
                        <Field label="Out of Scope" hint="One per line">
                          <textarea
                            value={sowOutOfScope}
                            onChange={e => setSowOutOfScope(e.target.value)}
                            placeholder="Explicitly out of scope..."
                            rows={2}
                            className="field-input resize-none text-xs"
                          />
                        </Field>
                      )}
                    </FormSection>

                    {agrType === "SOW" && (
                      <FormSection title="04. SOW Milestones">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="field-label text-emerald-600">Milestone Schedule</span>
                            <button
                              type="button"
                              onClick={() => setSowMilestones(prev => [...prev, { milestone: `Milestone ${prev.length + 1}`, workDescription: "", dueDate: "30 August 2026", paymentAmount: 50000 }])}
                              className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer transition"
                            >
                              <IconPlus className="h-3 w-3" /> Add
                            </button>
                          </div>

                          {sowMilestones.map((m, idx) => (
                            <div key={idx} className="p-2.5 rounded-xl border border-border-custom bg-surface-white dark:bg-surface-page space-y-2 shadow-2xs">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  value={m.milestone}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setSowMilestones(prev => prev.map((item, i) => i === idx ? { ...item, milestone: val } : item));
                                  }}
                                  placeholder="Milestone Name"
                                  className="field-input text-xs font-bold"
                                />
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={m.dueDate}
                                    onChange={e => {
                                      const val = e.target.value;
                                      setSowMilestones(prev => prev.map((item, i) => i === idx ? { ...item, dueDate: val } : item));
                                    }}
                                    placeholder="Due Date"
                                    className="field-input text-xs"
                                  />
                                  {sowMilestones.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => setSowMilestones(prev => prev.filter((_, i) => i !== idx))}
                                      className="p-1 text-text-secondary hover:text-red-500 rounded transition-colors cursor-pointer"
                                    >
                                      <IconTrash className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <input
                                  type="text"
                                  value={m.workDescription}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setSowMilestones(prev => prev.map((item, i) => i === idx ? { ...item, workDescription: val } : item));
                                  }}
                                  placeholder="Scope description"
                                  className="field-input text-xs sm:col-span-2"
                                />
                                <div className="relative">
                                  <span className="absolute left-2.5 top-2 text-xs text-text-secondary font-bold">₹</span>
                                  <input
                                    type="number"
                                    value={m.paymentAmount}
                                    onChange={e => {
                                      const val = Number(e.target.value);
                                      setSowMilestones(prev => prev.map((item, i) => i === idx ? { ...item, paymentAmount: val } : item));
                                    }}
                                    placeholder="Amount"
                                    className="field-input text-xs pl-6 text-right font-bold"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}

                          <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <div>
                              <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Total Project Value</span>
                              <span className="text-xs sm:text-sm font-extrabold text-emerald-700 dark:text-emerald-300 tabular-nums">
                                {fmt(sowMilestones.reduce((sum, m) => sum + (Number(m.paymentAmount) || 0), 0))}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Advance Deposit</span>
                              <input
                                type="number"
                                value={sowAdvanceAmount}
                                onChange={e => setSowAdvanceAmount(Number(e.target.value))}
                                className="field-input text-xs text-right font-extrabold text-emerald-600 dark:text-emerald-400 !py-0.5"
                              />
                            </div>
                          </div>
                        </div>
                      </FormSection>
                    )}
                  </>
                )}

                {/* COMPLETION SPECIFIC INFO CARD */}
                {agrType === "COMPLETION" && (
                  <FormSection title="04. Included Handover Provisions">
                    <div className="rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20 p-3 space-y-2">
                      <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold text-xs">
                        <IconAward className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>Included Handover Sections</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[11px]">
                        <div className="flex items-center gap-1 text-foreground font-medium bg-surface-white dark:bg-surface-page p-1.5 rounded border border-border-custom">
                          <IconCircleCheck className="h-3 w-3 text-amber-600 shrink-0" />
                          <span>1. Scope Sign-off</span>
                        </div>
                        <div className="flex items-center gap-1 text-foreground font-medium bg-surface-white dark:bg-surface-page p-1.5 rounded border border-border-custom">
                          <IconCircleCheck className="h-3 w-3 text-amber-600 shrink-0" />
                          <span>2. Asset Transfers</span>
                        </div>
                        <div className="flex items-center gap-1 text-foreground font-medium bg-surface-white dark:bg-surface-page p-1.5 rounded border border-border-custom">
                          <IconCircleCheck className="h-3 w-3 text-amber-600 shrink-0" />
                          <span>3. 30-Day SLA Support</span>
                        </div>
                        <div className="flex items-center gap-1 text-foreground font-medium bg-surface-white dark:bg-surface-page p-1.5 rounded border border-border-custom">
                          <IconCircleCheck className="h-3 w-3 text-amber-600 shrink-0" />
                          <span>4. Dual Signatures</span>
                        </div>
                      </div>
                    </div>
                  </FormSection>
                )}

                {/* MSA SPECIFIC CARD */}
                {agrType === "MASTER" && (
                  <FormSection title="03. MSA Clauses">
                    <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 space-y-2">
                      <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                        <IconShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Included Legal Provisions</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[11px]">
                        <div className="flex items-center gap-1 text-foreground font-medium bg-surface-white dark:bg-surface-page p-1.5 rounded border border-border-custom">
                          <IconCheck className="h-3 w-3 text-emerald-600 shrink-0" />
                          <span>1. Scope Terms</span>
                        </div>
                        <div className="flex items-center gap-1 text-foreground font-medium bg-surface-white dark:bg-surface-page p-1.5 rounded border border-border-custom">
                          <IconCheck className="h-3 w-3 text-emerald-600 shrink-0" />
                          <span>2. Net 15 Payment</span>
                        </div>
                        <div className="flex items-center gap-1 text-foreground font-medium bg-surface-white dark:bg-surface-page p-1.5 rounded border border-border-custom">
                          <IconCheck className="h-3 w-3 text-emerald-600 shrink-0" />
                          <span>3. 100% IP Code</span>
                        </div>
                        <div className="flex items-center gap-1 text-foreground font-medium bg-surface-white dark:bg-surface-page p-1.5 rounded border border-border-custom">
                          <IconCheck className="h-3 w-3 text-emerald-600 shrink-0" />
                          <span>4. 2-Year NDA</span>
                        </div>
                      </div>
                    </div>
                  </FormSection>
                )}

                <SubmitButton
                  label={editingId ? "Update Agreement & Re-render PDF" : (agrType === "COMPLETION" ? "Generate Project Handover Certificate (PCC)" : agrType === "SOW" ? "Generate Statement of Work (SOW)" : "Generate Master Agreement (MSA)")}
                  loading={isPending}
                  error={errorMsg}
                  success={successMsg}
                  onClick={handleSubmitAgreement}
                  color={agrType === "COMPLETION" ? "brand" : "emerald"}
                />
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ─── Global Compact CSS for Inputs & Field Labels ─── */}
      <style dangerouslySetInnerHTML={{ __html: `
        .field-input {
          width: 100%;
          padding: 8px 12px;
          border-radius: 11px;
          border: 1px solid var(--border);
          background: var(--surface-page);
          color: var(--text-primary);
          font-size: 12px;
          font-weight: 500;
          font-family: inherit;
          outline: none;
          transition: all 0.15s ease-in-out;
          touch-action: manipulation;
        }
        .field-input:focus {
          border-color: var(--brand-orange);
          box-shadow: 0 0 0 3px rgba(234, 59, 12, 0.12);
          background: var(--surface-white);
        }
        .dark .field-input:focus {
          border-color: #6366F1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
          background: #292524;
        }
        .field-input::placeholder { color: var(--text-secondary); opacity: 0.65; }
        .field-select {
          appearance: none;
          cursor: pointer;
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2378716C' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
          background-position: right 10px center;
          background-repeat: no-repeat;
          background-size: 14px;
          padding-right: 28px;
        }
        .field-label {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--text-secondary);
        }
      `}} />
    </div>
  );
}

// ═══════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 pt-0.5">
      <div className="flex items-center gap-2">
        <h4 className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">{title}</h4>
        <div className="flex-1 h-px bg-border-custom/50" />
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function PdfPreviewModal({
  open,
  onClose,
  title,
  pdfKey,
  docId,
  type,
  onRefreshPdf,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  pdfKey: string | null;
  docId?: string;
  type?: "proposal" | "invoice" | "agreement";
  onRefreshPdf?: (docId: string, newKey: string) => void;
}) {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentKey, setCurrentKey] = useState<string | null>(pdfKey);

  useEffect(() => {
    setCurrentKey(pdfKey);
  }, [pdfKey]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleRefresh = async () => {
    if (!docId || type !== "agreement") return;
    setIsRefreshing(true);
    const res = await regenerateAgreementPdf(docId);
    setIsRefreshing(false);
    if (res.success && res.pdfKey) {
      const refreshedKey = `${res.pdfKey}?t=${Date.now()}`;
      setCurrentKey(refreshedKey);
      if (onRefreshPdf) onRefreshPdf(docId, res.pdfKey);
      toast.success("Template Re-rendered", "PDF preview updated with executive Manrope styling!");
    } else {
      toast.error("Re-render Failed", res.error || "Could not re-render PDF");
    }
  };

  const url = getFileUrl(currentKey);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-stone-950/95 backdrop-blur-2xl animate-in fade-in duration-200 select-none">
      {/* ── Top Modern Glassmorphism Header Bar ── */}
      <header className="h-16 px-4 sm:px-6 bg-stone-900/90 border-b border-white/10 flex items-center justify-between gap-4 shrink-0 shadow-lg">
        {/* Left: Document Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-brand-orange/20 border border-brand-orange/30 text-brand-orange flex items-center justify-center shrink-0 shadow-xs">
            <IconFileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm sm:text-base text-white truncate tracking-tight">{title}</h3>
              {type && (
                <span className="hidden sm:inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-orange-tint text-brand-orange border border-brand-orange/30">
                  {type}
                </span>
              )}
            </div>
            <p className="text-[11px] font-medium text-stone-400 truncate flex items-center gap-1.5 mt-0.5">
              <span>Full Page Document View</span>
              <span className="w-1 h-1 rounded-full bg-emerald-400" />
              <span className="text-emerald-400 font-bold">100% Vector Rendered</span>
            </p>
          </div>
        </div>

        {/* Right: Actions & Close Button */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {docId && type === "agreement" && (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <IconSparkles className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="hidden md:inline">{isRefreshing ? "Re-rendering..." : "Re-render Template"}</span>
            </button>
          )}

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition cursor-pointer active:scale-95"
          >
            <IconEye className="h-4 w-4 text-brand-orange" />
            <span className="hidden sm:inline">Open Full Tab</span>
          </a>

          <a
            href={url}
            download
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-black rounded-xl bg-brand-orange text-white hover:bg-brand-orange-hover transition shadow-md cursor-pointer active:scale-95"
          >
            <IconDownload className="h-4 w-4" />
            <span>Download PDF</span>
          </a>

          <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block" />

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-rose-500/20 text-stone-300 hover:text-rose-400 border border-white/10 flex items-center justify-center transition cursor-pointer active:scale-95"
            title="Close Viewer (Esc)"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* ── Full Page Canvas Container ── */}
      <main className="flex-1 bg-stone-900/60 p-2 sm:p-6 flex justify-center items-center overflow-hidden relative">
        {currentKey ? (
          <div className="w-full h-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-white/10 relative flex flex-col">
            <iframe
              key={currentKey}
              src={`${url}#toolbar=1&view=FitH`}
              className="w-full h-full border-0 bg-white"
              title={title}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-stone-400 text-xs p-6 text-center bg-stone-900/40 rounded-2xl border border-white/10">
            <IconAlertCircle className="h-10 w-10 text-brand-orange/60 mb-2 animate-pulse" />
            <span className="font-bold text-sm text-stone-200">No Document Key Specified</span>
            <p className="text-xs text-stone-400 mt-1">Please select a valid proposal, invoice, or agreement file.</p>
          </div>
        )}
      </main>
    </div>
  );
}

function RecipientSelect({
  value,
  onChange,
  clients,
  leads,
}: {
  value: string;
  onChange: (val: string, type: "client" | "lead", id: string) => void;
  clients: ClientInfo[];
  leads: LeadInfo[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => {
        const val = e.target.value;
        if (!val) { onChange("", "client", ""); return; }
        const [type, id] = val.split(":") as ["client" | "lead", string];
        onChange(val, type, id);
      }}
      className="field-input field-select font-medium text-xs cursor-pointer"
    >
      <option value="">Select Client or Lead...</option>
      {clients.length > 0 && (
        <optgroup label="── Existing Clients ──">
          {clients.map((c) => (
            <option key={`client:${c.id}`} value={`client:${c.id}`} className="cursor-pointer">
              🏢 {c.name}
            </option>
          ))}
        </optgroup>
      )}
      {leads.length > 0 && (
        <optgroup label="── Pipeline Leads ──">
          {leads.map((l) => (
            <option key={`lead:${l.id}`} value={`lead:${l.id}`} className="cursor-pointer">
              🎯 {l.displayName}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );
}

function Field({ label, required, hint, icon, children }: {
  label: string; required?: boolean; hint?: string; icon?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="field-label mb-1">
        {icon} {label}
        {required && <span className="text-red-500 -ml-0.5">*</span>}
        {hint && <span className="text-[9px] font-normal normal-case tracking-normal text-text-secondary ml-0.5">({hint})</span>}
      </label>
      {children}
    </div>
  );
}

function ItemsTable({ label, items, onUpdate, onAdd, onRemove }: {
  label: string;
  items: { description: string; quantity: number; rate: number; amount: number }[];
  onUpdate: (idx: number, field: keyof PricingRow, value: string | number) => void;
  onAdd: () => void;
  onRemove: (idx: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="field-label"><IconReceipt className="h-3 w-3 text-brand-orange" /> {label}</label>
        <button type="button" onClick={onAdd} className="text-[11px] font-bold text-brand-orange hover:text-brand-orange-hover flex items-center gap-1 transition cursor-pointer">
          <IconPlus className="h-3 w-3" /> Add
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="rounded-xl border border-border-custom bg-surface-white p-2.5 space-y-2 shadow-2xs">
            <input
              type="text"
              value={item.description}
              onChange={e => onUpdate(idx, "description", e.target.value)}
              placeholder="Item description..."
              className="w-full bg-transparent border-0 text-xs font-semibold text-foreground placeholder:text-text-secondary/60 focus:outline-none p-0"
            />
            <div className="flex items-center gap-2 pt-1.5 border-t border-border-custom/50 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-bold text-text-secondary uppercase">Qty</span>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={e => onUpdate(idx, "quantity", Number(e.target.value))}
                  className="w-12 text-center text-[11px] font-bold rounded-md border border-border-custom bg-surface-page py-0.5 text-foreground focus:outline-none focus:border-brand-orange transition"
                  min={1}
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-bold text-text-secondary uppercase">Rate</span>
                <div className="relative">
                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] text-text-secondary font-bold">₹</span>
                  <input
                    type="number"
                    value={item.rate || ""}
                    onChange={e => onUpdate(idx, "rate", Number(e.target.value))}
                    placeholder="0"
                    className="w-20 text-right text-[11px] font-bold rounded-md border border-border-custom bg-surface-page py-0.5 pl-4 pr-1.5 text-foreground focus:outline-none focus:border-brand-orange transition"
                    min={0}
                  />
                </div>
              </div>
              <div className="flex-1 text-right text-xs font-bold text-foreground tabular-nums min-w-[60px]">
                {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(item.amount)}
              </div>
              {items.length > 1 && (
                <button type="button" onClick={() => onRemove(idx)} className="flex h-6 w-6 items-center justify-center rounded text-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition cursor-pointer">
                  <IconTrash className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TotalBar({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex justify-between items-center px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-brand-orange/10 via-brand-orange/5 to-transparent border border-brand-orange/20">
      <span className="text-xs font-bold text-brand-orange flex items-center gap-1 uppercase tracking-wider">
        <IconCurrencyRupee className="h-3.5 w-3.5" /> {label}
      </span>
      <span className="text-sm sm:text-base font-black text-brand-orange tabular-nums">{fmt(amount)}</span>
    </div>
  );
}

function SubmitButton({
  label, loading, error, success, onClick, color = "brand"
}: {
  label: string; loading: boolean; error?: string; success?: string; onClick: () => void; color?: "brand" | "violet" | "blue" | "emerald";
}) {
  const bgClass =
    color === "violet" ? "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-violet-500/15" :
    color === "blue" ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-blue-500/15" :
    color === "emerald" ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/15" :
    "bg-brand-orange hover:bg-brand-orange-hover shadow-brand-orange/15";

  return (
    <div className="space-y-2 pt-2 pb-4">
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 p-2.5 text-xs text-red-700 dark:text-red-300 font-medium">
          <IconAlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" /> <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50 p-2.5 text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
          <IconCheck className="h-3.5 w-3.5 shrink-0 mt-0.5" /> <span>{success}</span>
        </div>
      )}
      <Button
        type="button"
        onClick={onClick}
        disabled={loading}
        className={`w-full gap-2 h-11 text-xs sm:text-sm font-bold shadow-md active:scale-[0.98] transition-all cursor-pointer text-white rounded-xl ${bgClass}`}
      >
        {loading ? <IconLoader className="h-4 w-4 animate-spin" /> : <IconSparkles className="h-4 w-4" />}
        <span>{loading ? "Rendering PDF Document..." : label}</span>
      </Button>
    </div>
  );
}

function DocumentCard({
  icon, iconBg, title, status, type, badge, meta, subtitle, pdfKey, onView, onEdit, onDelete, onQuickStatusChange, index
}: {
  icon: React.ReactNode; iconBg: string; title: string; status: string; type: "proposal" | "invoice" | "agreement";
  badge: React.ReactNode; meta: string[]; subtitle?: string; pdfKey: string | null;
  onView: () => void; onEdit: () => void; onDelete: () => void; onQuickStatusChange: (newStatus: string) => void; index: number;
}) {
  const downloadUrl = getFileUrl(pdfKey);

  // Quick Action Button Logic
  let quickAction: { label: string; targetStatus: string; color: string } | null = null;
  if (status === "DRAFT") {
    quickAction = { label: "Mark Sent", targetStatus: "SENT", color: "hover:bg-violet-50 dark:hover:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800" };
  } else if (status === "SENT") {
    if (type === "proposal") {
      quickAction = { label: "Mark Accepted", targetStatus: "ACCEPTED", color: "hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" };
    } else if (type === "invoice") {
      quickAction = { label: "Mark Paid", targetStatus: "PAID", color: "hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" };
    } else if (type === "agreement") {
      quickAction = { label: "Mark Signed", targetStatus: "SIGNED", color: "hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" };
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: Math.min(index * 0.03, 0.25) }}
      whileHover={{ y: -1 }}
      className="group flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-border-custom bg-surface-white p-3 sm:p-3.5 transition-all duration-200 hover:shadow-sm hover:border-brand-orange/30"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconBg} shadow-2xs`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-xs sm:text-sm text-foreground truncate max-w-[200px] sm:max-w-xs">{title}</span>
            {badge}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-text-secondary flex-wrap mt-0.5">
            {meta.map((m, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-border-custom font-bold">·</span>}
                <span className={i === meta.length - 1 && m.includes("₹") ? "font-bold text-foreground bg-surface-page px-1.5 py-0.5 rounded border border-border-custom/50" : "font-medium"}>{m}</span>
              </span>
            ))}
          </div>
          {subtitle && <div className="text-[10px] text-text-secondary font-normal mt-0.5">{subtitle}</div>}
        </div>
      </div>

      {/* Compact Action Buttons for Desktop & Mobile */}
      <div className="grid grid-cols-2 sm:flex items-center gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-border-custom/50">
        {quickAction && (
          <button
            type="button"
            onClick={() => onQuickStatusChange(quickAction!.targetStatus)}
            className={`flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg bg-surface-page border text-[11px] font-semibold transition-all touch-manipulation active:scale-95 cursor-pointer ${quickAction.color}`}
            title={`Change status to ${quickAction.targetStatus}`}
          >
            <IconCheck className="h-3 w-3" />
            <span className="truncate">{quickAction.label}</span>
          </button>
        )}
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg bg-surface-page hover:bg-brand-orange-tint/40 text-text-primary hover:text-brand-orange border border-border-custom text-[11px] font-semibold transition-all touch-manipulation active:scale-95 cursor-pointer"
          title="Edit details & re-render PDF"
        >
          <IconEdit className="h-3 w-3 text-brand-orange" />
          <span>Edit</span>
        </button>
        {pdfKey && (
          <button
            type="button"
            onClick={onView}
            className="flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 text-[11px] font-semibold transition-all touch-manipulation active:scale-95 hover:bg-violet-100 cursor-pointer"
            title="Preview PDF"
          >
            <IconEye className="h-3 w-3 text-violet-600" />
            <span>View</span>
          </button>
        )}
        {pdfKey && (
          <a
            href={downloadUrl}
            download
            className="flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-semibold transition-all touch-manipulation active:scale-95 hover:bg-blue-100 cursor-pointer"
            title="Download PDF"
          >
            <IconDownload className="h-3 w-3 text-blue-600" />
            <span>Download</span>
          </a>
        )}
        <button
          type="button"
          onClick={onDelete}
          className="flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg bg-surface-page hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 border border-border-custom text-[11px] font-semibold transition-all touch-manipulation active:scale-95 cursor-pointer"
          title="Delete"
        >
          <IconTrash className="h-3 w-3 text-red-500" />
          <span>Delete</span>
        </button>
      </div>
    </motion.div>
  );
}

function EmptyState({ type, onAction }: { type: string; onAction: () => void }) {
  const singular = type.slice(0, -1);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-xl border border-dashed border-border-custom bg-surface-white/60"
    >
      <div className="relative mb-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-page border border-border-custom shadow-2xs">
          <IconClock className="h-6 w-6 text-text-secondary/70" />
        </div>
        <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-orange text-white shadow-2xs">
          <IconPlus className="h-3 w-3" />
        </div>
      </div>
      <h3 className="text-xs font-bold text-foreground mb-0.5">No {type} found</h3>
      <p className="text-[11px] text-text-secondary mb-4 max-w-xs leading-relaxed">
        Generate your first PDF {singular} — automatically saved &amp; linked to your clients.
      </p>
      <Button size="sm" onClick={onAction} className="gap-1.5 shadow-xs bg-brand-orange hover:bg-brand-orange-hover text-white text-xs font-semibold rounded-lg active:scale-95 transition-all py-1 px-3 cursor-pointer">
        <IconPlus className="h-3.5 w-3.5" /> Create {singular}
      </Button>
    </motion.div>
  );
}

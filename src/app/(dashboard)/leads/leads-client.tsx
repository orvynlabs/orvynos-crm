"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  IconTarget,
  IconTrendingUp,
  IconPlus,
  IconSearch,
  IconSparkles,
  IconUser,
  IconBuilding,
  IconMail,
  IconPhone,
  IconCalendar,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconCheck,
  IconArrowRight,
  IconChevronRight,
  IconX,
  IconAlertCircle,
  IconBriefcase,
  IconFileText,
  IconRefresh,
  IconCircleCheck,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { LeadStage } from "@/lib/enums";
import { createLead, updateLead, updateLeadStage, deleteLead, convertLeadToClient, updateLeadStageFast } from "./actions";

export type LeadItem = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  stage: LeadStage;
  sortOrder: number;
  estimatedValue: number;
  notes: string | null;
  followUpAt: string | null;
  convertedClientId: string | null;
  convertedClient: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
};

type LeadsClientProps = {
  initialLeads: LeadItem[];
};

const KANBAN_COLUMNS: { id: LeadStage; label: string; badgeColor: string; headerBg: string; borderColor: string }[] = [
  { id: LeadStage.NEW, label: "New", badgeColor: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400", headerBg: "bg-indigo-500/10", borderColor: "border-indigo-500/30" },
  { id: LeadStage.CONTACTED, label: "Contacted", badgeColor: "bg-sky-500/10 text-sky-600 dark:text-sky-400", headerBg: "bg-sky-500/10", borderColor: "border-sky-500/30" },
  { id: LeadStage.PROPOSAL_SENT, label: "Proposal Sent", badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400", headerBg: "bg-blue-500/10", borderColor: "border-blue-500/30" },
  { id: LeadStage.WON, label: "Won", badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", headerBg: "bg-emerald-500/10", borderColor: "border-emerald-500/30" },
  { id: LeadStage.LOST, label: "Lost", badgeColor: "bg-rose-500/10 text-rose-600 dark:text-rose-400", headerBg: "bg-rose-500/10", borderColor: "border-rose-500/30" },
];

const SOURCES = ["Direct", "Referral", "Website", "Instagram", "LinkedIn", "Cold Outreach", "WhatsApp", "Other"];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export function LeadsClient({ initialLeads }: LeadsClientProps) {
  const router = useRouter();
  const [leads, setLeads] = useState<LeadItem[]>(initialLeads);
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [mobileActiveStage, setMobileActiveStage] = useState<LeadStage>(LeadStage.NEW);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("new") === "true") {
        openCreateSheet();
        router.replace(window.location.pathname);
      }
    }
  }, []);

  const [isPending, startTransition] = useTransition();

  // Create / Edit Drawer State
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadItem | null>(null);

  // Form Fields State
  const [formName, setFormName] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formValue, setFormValue] = useState<number>(0);
  const [formSource, setFormSource] = useState("Direct");
  const [formStage, setFormStage] = useState<LeadStage>(LeadStage.NEW);
  const [formFollowUp, setFormFollowUp] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Conversion loading state
  const [convertingId, setConvertingId] = useState<string | null>(null);

  // Convert Confirmation Drawer State
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [convertLeadId, setConvertLeadId] = useState<string | null>(null);
  const [convertName, setConvertName] = useState("");
  const [convertContactName, setConvertContactName] = useState("");
  const [convertEmail, setConvertEmail] = useState("");
  const [convertPhone, setConvertPhone] = useState("");
  const [convertWebsite, setConvertWebsite] = useState("");
  const [convertAddress, setConvertAddress] = useState("");
  const [convertCity, setConvertCity] = useState("");
  const [convertState, setConvertState] = useState("");
  const [convertGstin, setConvertGstin] = useState("");
  const [convertNotes, setConvertNotes] = useState("");

  // Drag and Drop Dragging item state
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

  const openCreateSheet = () => {
    setEditingLead(null);
    setFormName("");
    setFormCompany("");
    setFormEmail("");
    setFormPhone("");
    setFormValue(0);
    setFormSource("Direct");
    setFormStage(LeadStage.NEW);
    setFormFollowUp("");
    setFormNotes("");
    setErrorMsg("");
    setIsSheetOpen(true);
  };

  const openEditSheet = (lead: LeadItem) => {
    setEditingLead(lead);
    setFormName(lead.name);
    setFormCompany(lead.company || "");
    setFormEmail(lead.email || "");
    setFormPhone(lead.phone || "");
    setFormValue(lead.estimatedValue || 0);
    setFormSource(lead.source || "Direct");
    setFormStage(lead.stage);
    setFormFollowUp(lead.followUpAt ? lead.followUpAt.split("T")[0] : "");
    setFormNotes(lead.notes || "");
    setErrorMsg("");
    setIsSheetOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setErrorMsg("Lead contact name is required");
      return;
    }

    setErrorMsg("");
    startTransition(async () => {
      if (editingLead) {
        // Update existing lead
        const res = await updateLead(editingLead.id, {
          name: formName,
          company: formCompany,
          email: formEmail,
          phone: formPhone,
          estimatedValue: Number(formValue) || 0,
          source: formSource,
          stage: formStage,
          followUpAt: formFollowUp,
          notes: formNotes,
        });

        if (res.success && res.data) {
          setLeads((prev) =>
            prev.map((l) =>
              l.id === editingLead.id
                ? {
                    ...l,
                    name: formName,
                    company: formCompany || null,
                    email: formEmail || null,
                    phone: formPhone || null,
                    estimatedValue: Number(formValue) || 0,
                    source: formSource,
                    stage: formStage,
                    followUpAt: formFollowUp || null,
                    notes: formNotes || null,
                  }
                : l
            )
          );
          setIsSheetOpen(false);
        } else {
          setErrorMsg(res.error || "Failed to update lead");
        }
      } else {
        // Create new lead
        const res = await createLead({
          name: formName,
          company: formCompany,
          email: formEmail,
          phone: formPhone,
          estimatedValue: Number(formValue) || 0,
          source: formSource,
          stage: formStage,
          followUpAt: formFollowUp,
          notes: formNotes,
        });

        if (res.success && res.data) {
          const newLeadItem: LeadItem = {
            id: res.data.id,
            name: res.data.name,
            company: res.data.company,
            email: res.data.email,
            phone: res.data.phone,
            source: res.data.source,
            stage: res.data.stage as LeadStage,
            sortOrder: res.data.sortOrder,
            estimatedValue: res.data.estimatedValue ? Number(res.data.estimatedValue) : 0,
            notes: res.data.notes,
            followUpAt: res.data.followUpAt ? (typeof res.data.followUpAt === "string" ? res.data.followUpAt : (res.data.followUpAt as any).toISOString()) : null,
            convertedClientId: null,
            convertedClient: null,
            createdAt: typeof res.data.createdAt === "string" ? res.data.createdAt : (res.data.createdAt as any).toISOString(),
            updatedAt: typeof res.data.updatedAt === "string" ? res.data.updatedAt : (res.data.updatedAt as any).toISOString(),
          };

          setLeads((prev) => [newLeadItem, ...prev]);
          setIsSheetOpen(false);
        } else {
          setErrorMsg(res.error || "Failed to create lead");
        }
      }
    });
  };

  // Optimistic stage transfer
  const handleStageChange = (leadId: string, newStage: LeadStage) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, stage: newStage } : l))
    );

    updateLeadStageFast(leadId, newStage).then((res) => {
      if (!res.success) {
        // Revert on error
        setLeads(initialLeads);
        alert(res.error || "Failed to update lead stage");
      }
    });
  };

  // Delete lead
  const handleDeleteLead = (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;

    setLeads((prev) => prev.filter((l) => l.id !== id));
    startTransition(async () => {
      const res = await deleteLead(id);
      if (!res.success) {
        alert(res.error || "Failed to delete lead");
        setLeads(initialLeads);
      }
    });
  };

  // 🏆 Section 7.3: Convert Lead to Client interaction
  const triggerConvertLead = (lead: LeadItem) => {
    setConvertLeadId(lead.id);
    setConvertName(lead.company || lead.name);
    setConvertContactName(lead.company ? lead.name : "");
    setConvertEmail(lead.email || "");
    setConvertPhone(lead.phone || "");
    setConvertWebsite("");
    setConvertAddress("");
    setConvertCity("");
    setConvertState("");
    setConvertGstin("");
    setConvertNotes(lead.notes ? `Converted from Lead: ${lead.notes}` : "Converted from Lead Pipeline");
    setIsConvertOpen(true);
  };

  const submitConvertLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertLeadId) return;
    setConvertingId(convertLeadId);

    try {
      const res = await convertLeadToClient(convertLeadId, {
        name: convertName,
        contactName: convertContactName || null,
        email: convertEmail || null,
        phone: convertPhone || null,
        website: convertWebsite || null,
        address: convertAddress || null,
        city: convertCity || null,
        state: convertState || null,
        gstin: convertGstin || null,
        notes: convertNotes || null,
      });

      if (res.success && res.clientId) {
        // Optimistically mark lead as WON & converted
        setLeads((prev) =>
          prev.map((l) =>
            l.id === convertLeadId
              ? {
                  ...l,
                  stage: LeadStage.WON,
                  convertedClientId: res.clientId,
                  convertedClient: { id: res.clientId, name: convertName },
                }
              : l
          )
        );
        setIsConvertOpen(false);
        router.push(`/clients/${res.clientId}`);
      } else {
        alert(res.error || "Failed to convert lead to client");
      }
    } catch (err) {
      console.error(err);
      alert("Error converting lead to client");
    } finally {
      setConvertingId(null);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.setData("text/plain", leadId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetStage: LeadStage) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("text/plain") || draggedLeadId;
    if (leadId) {
      handleStageChange(leadId, targetStage);
    }
    setDraggedLeadId(null);
  };

  // Filtered Leads (Memoized)
  const filteredLeads = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return leads.filter((l) => {
      if (sourceFilter !== "ALL" && l.source !== sourceFilter) return false;
      if (!q) return true;
      return (
        l.name.toLowerCase().includes(q) ||
        (l.company && l.company.toLowerCase().includes(q)) ||
        (l.email && l.email.toLowerCase().includes(q)) ||
        (l.phone && l.phone.includes(q))
      );
    });
  }, [leads, searchQuery, sourceFilter]);

  // Grouped Leads by stage (O(N) rendering optimization)
  const groupedLeads = useMemo(() => {
    const groups: Record<string, LeadItem[]> = {
      NEW: [],
      CONTACTED: [],
      PROPOSAL_SENT: [],
      WON: [],
      LOST: [],
    };
    filteredLeads.forEach((l) => {
      let stage = l.stage === "QUALIFIED" ? "CONTACTED" : l.stage;
      if (stage === "NEGOTIATION") {
        stage = "PROPOSAL_SENT";
      }
      if (groups[stage]) {
        groups[stage].push(l);
      } else {
        groups[stage] = [l];
      }
    });
    return groups;
  }, [filteredLeads]);

  // Overall pipeline metrics
  const openLeadsCount = useMemo(() => {
    return filteredLeads.filter((l) => l.stage !== LeadStage.WON && l.stage !== LeadStage.LOST).length;
  }, [filteredLeads]);

  const openPipelineValue = useMemo(() => {
    return filteredLeads
      .filter((l) => l.stage !== LeadStage.WON && l.stage !== LeadStage.LOST)
      .reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
  }, [filteredLeads]);

  const wonLeadsCount = useMemo(() => {
    return filteredLeads.filter((l) => l.stage === LeadStage.WON).length;
  }, [filteredLeads]);

  const lostLeadsCount = useMemo(() => {
    return filteredLeads.filter((l) => l.stage === LeadStage.LOST).length;
  }, [filteredLeads]);

  const winRate = useMemo(() => {
    const totalFinished = wonLeadsCount + lostLeadsCount;
    if (totalFinished === 0) return 100;
    return Math.round((wonLeadsCount / totalFinished) * 100);
  }, [wonLeadsCount, lostLeadsCount]);

  return (
    <div className="space-y-6 font-sans text-text-primary select-none pb-12">
      {/* 🚀 Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-surface-white border border-border/80 rounded-2xl p-4 md:p-5 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-orange animate-pulse" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-orange bg-brand-orange-tint px-2.5 py-0.5 rounded-md">
              Sales Pipeline
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-text-primary mt-1">
            Leads &amp; Deal Flow Kanban
          </h1>
          <p className="text-xs text-text-secondary font-medium">
            Track inquiries, pitch proposals, negotiate contracts, and convert won deals to client rosters.
          </p>
        </div>

        {/* Premium metric badges */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Metric 1: Open Leads */}
          <div className="flex items-center gap-3 bg-surface-page/70 border border-border/60 rounded-2xl px-3.5 py-2 min-w-[90px] shadow-3xs hover:border-brand-orange/30 transition-all select-none">
            <div className="p-1.5 bg-surface-white rounded-xl border border-border/50 text-text-secondary shrink-0">
              <IconTarget className="h-3.5 w-3.5 text-text-secondary" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider leading-none">Open</span>
              <span className="text-sm font-black text-text-primary mt-1 leading-none">{openLeadsCount}</span>
            </div>
          </div>

          {/* Metric 2: Pipeline Value */}
          <div className="flex items-center gap-3 bg-surface-page/70 border border-border/60 rounded-2xl px-3.5 py-2 min-w-[110px] shadow-3xs hover:border-brand-orange/30 transition-all select-none">
            <div className="p-1.5 bg-surface-white rounded-xl border border-border/50 text-text-secondary shrink-0">
              <IconTrendingUp className="h-3.5 w-3.5 text-text-secondary" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider leading-none">Pipeline</span>
              <span className="text-sm font-black text-text-primary mt-1 leading-none">{formatCurrency(openPipelineValue)}</span>
            </div>
          </div>

          {/* Metric 3: Won Count */}
          <div className="flex items-center gap-3 bg-surface-page/70 border border-border/60 rounded-2xl px-3.5 py-2 min-w-[90px] shadow-3xs hover:border-brand-orange/30 transition-all select-none">
            <div className="p-1.5 bg-surface-white rounded-xl border border-border/50 text-text-secondary shrink-0">
              <IconCheck className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider leading-none">Won / mo</span>
              <span className="text-sm font-black text-text-primary mt-1 leading-none">{wonLeadsCount}</span>
            </div>
          </div>

          {/* Metric 4: Win Rate */}
          <div className="flex items-center gap-3 bg-surface-page/70 border border-border/60 rounded-2xl px-3.5 py-2 min-w-[90px] shadow-3xs hover:border-brand-orange/30 transition-all select-none">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider leading-none">Win rate</span>
              <span className="text-sm font-black text-emerald-600 mt-1 leading-none">{winRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 🔍 Search & Filters Bar */}
      <div className="bg-surface-white border border-border/80 rounded-2xl p-3.5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-48 transition-all duration-300 focus-within:sm:w-56">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Search lead name, company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 h-9 bg-surface-page border border-border/80 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-orange"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto no-scrollbar">
          {/* Add New Lead button placed right before/above All Sources */}
          <Button
            onClick={openCreateSheet}
            className="font-bold text-xs bg-brand-orange hover:bg-brand-orange-hover text-white py-1.5 px-3 rounded-xl flex items-center gap-1.5 shadow-xs border-0 h-9 cursor-pointer active:scale-95 transition-all shrink-0 mr-1"
          >
            <IconPlus className="h-3.5 w-3.5" stroke={2.5} />
            <span>Add Lead</span>
          </Button>

          <span className="text-xs font-bold text-text-secondary shrink-0">Source:</span>
          <button
            onClick={() => setSourceFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
              sourceFilter === "ALL"
                ? "bg-brand-orange text-white shadow-xs font-black"
                : "bg-surface-page text-text-secondary hover:text-text-primary"
            }`}
          >
            All Sources ({leads.length})
          </button>
          {SOURCES.map((src) => {
            const count = leads.filter((l) => l.source === src).length;
            if (count === 0 && sourceFilter !== src) return null;
            return (
              <button
                key={src}
                onClick={() => setSourceFilter(src)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
                  sourceFilter === src
                    ? "bg-brand-orange text-white shadow-xs font-black"
                    : "bg-surface-page text-text-secondary hover:text-text-primary"
                }`}
              >
                {src} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* MOBILE COLUMN SELECTOR TAB BAR (visible only on mobile screens) */}
      <div className="md:hidden border-b border-border/80 flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-hide select-none">
        {KANBAN_COLUMNS.map((col) => {
          const isActive = mobileActiveStage === col.id;
          const count = (groupedLeads[col.id] || []).length;
          return (
            <button
              key={col.id}
              onClick={() => setMobileActiveStage(col.id)}
              className={`px-3.5 py-2 text-[11px] font-extrabold uppercase tracking-wider border-b-2 transition-all duration-150 active:scale-95 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? "border-brand-orange text-brand-orange bg-brand-orange-tint/20 rounded-t-lg"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              {col.label}
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${isActive ? "bg-brand-orange text-white" : "bg-surface-page text-text-secondary"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 🎯 Section 7.1: Interactive Kanban Board */}
      <div className="flex md:gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar snap-x snap-mandatory min-h-[580px]">
        {KANBAN_COLUMNS.map((col) => {
          const colLeads = groupedLeads[col.id] || [];
          const colValue = colLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
          const mobileDisplayClass = mobileActiveStage === col.id ? "flex w-full" : "hidden md:flex";

          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`${mobileDisplayClass} snap-start md:min-w-[280px] md:w-[280px] flex-shrink-0 bg-surface-page/50 rounded-2xl border ${col.borderColor} p-3 flex-col justify-between space-y-3 transition-all duration-300 hover:shadow-sm`}
            >
              {/* Column Header */}
              <div className="space-y-2">
                <div className={`flex items-center justify-between p-2.5 rounded-xl ${col.headerBg} border ${col.borderColor}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-text-primary">{col.label}</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${col.badgeColor}`}>
                      {colLeads.length}
                    </span>
                  </div>
                  <span className="text-[11px] font-black text-text-primary">
                    {formatCurrency(colValue)}
                  </span>
                </div>

                {/* Column Lead Cards list */}
                <div className="space-y-3 min-h-[480px]">
                  {colLeads.length > 0 ? (
                    colLeads.map((lead) => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        className={`bg-surface-white border border-border/80 hover:border-brand-orange/40 rounded-2xl p-3.5 space-y-3 shadow-3xs hover:shadow-2xs transition-all duration-200 cursor-grab active:cursor-grabbing group/card ${
                          draggedLeadId === lead.id ? "opacity-40 scale-95" : ""
                        }`}
                      >
                        {/* Header: Company / Contact Person & Actions */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-black text-xs text-text-primary truncate" title={lead.company || lead.name}>
                              {lead.company || lead.name}
                            </h3>
                            {lead.company && (
                              <p className="text-[10.5px] font-bold text-text-secondary truncate mt-0.5">
                                Contact: {lead.name}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => openEditSheet(lead)}
                              className="p-1 rounded-lg text-text-secondary hover:text-brand-orange hover:bg-surface-page transition-colors cursor-pointer"
                              title="Edit lead details"
                            >
                              <IconEdit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteLead(lead.id)}
                              className="p-1 rounded-lg text-text-secondary hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete lead"
                            >
                              <IconTrash className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Value & Source Badges */}
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-[11px] font-black text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg shadow-3xs flex items-center gap-1">
                            <span className="text-[9px] font-extrabold text-emerald-600/70 uppercase">Est:</span>
                            <span>{formatCurrency(lead.estimatedValue)}</span>
                          </span>

                          <span className={`text-[9.5px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-lg border truncate max-w-[110px] ${getSourceColor(lead.source)}`}>
                            {lead.source || "Direct"}
                          </span>
                        </div>

                        {/* Contact details */}
                        <div className="space-y-1 text-[10px] font-bold text-text-secondary pt-1 border-t border-border/50">
                          {lead.email && (
                            <div className="flex items-center gap-1.5 truncate">
                              <IconMail className="h-3 w-3 shrink-0 text-text-secondary" />
                              <span className="truncate">{lead.email}</span>
                            </div>
                          )}
                          {lead.phone && (
                            <div className="flex items-center gap-1.5 truncate">
                              <IconPhone className="h-3 w-3 shrink-0 text-text-secondary" />
                              <span>{lead.phone}</span>
                            </div>
                          )}
                          {lead.followUpAt && (
                            <div className="flex items-center gap-1.5 text-amber-600 font-extrabold">
                              <IconCalendar className="h-3 w-3 shrink-0" />
                              <span>Due: {new Date(lead.followUpAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                            </div>
                          )}
                        </div>

                        {/* 🏆 Section 7.3: Convert to Client Button (Won stage or converted badge) */}
                        <div className="pt-2 border-t border-border/60">
                          {lead.convertedClientId ? (
                            <button
                              onClick={() => router.push(`/clients/${lead.convertedClientId}`)}
                              className="w-full h-8 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-extrabold text-[10.5px] flex items-center justify-center gap-1.5 hover:bg-emerald-500/20 transition-all cursor-pointer shadow-3xs"
                            >
                              <IconCircleCheck className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Converted Client ➔</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              {/* 1-Click Convert to Client Button */}
                              <button
                                onClick={() => triggerConvertLead(lead)}
                                disabled={convertingId === lead.id}
                                className="flex-1 h-8 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-black text-[10.5px] flex items-center justify-center gap-1 transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] shadow-sm hover:shadow-md disabled:opacity-50"
                                title="Convert this lead into a client profile"
                              >
                                {convertingId === lead.id ? (
                                  <IconRefresh className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <IconSparkles className="h-3.5 w-3.5 animate-pulse" />
                                )}
                                <span>Convert to Client</span>
                              </button>

                              {/* Stage Switch Dropdown for quick move */}
                              <select
                                value={lead.stage}
                                onChange={(e) => handleStageChange(lead.id, e.target.value as LeadStage)}
                                className="h-8 px-1.5 bg-surface-page border border-border/80 rounded-xl text-[10px] font-extrabold text-text-secondary focus:outline-none cursor-pointer"
                              >
                                {KANBAN_COLUMNS.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    Move to {c.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-32 border-2 border-dashed border-border/60 rounded-2xl flex flex-col items-center justify-center text-center p-3 text-text-secondary space-y-1">
                      <span className="text-xs font-bold">No leads in {col.label}</span>
                      <span className="text-[9.5px]">Drag lead here</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 📝 Section 7.2: Lead Form Drawer (Create & Edit) */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full max-w-[440px] p-5 bg-surface-white border-l border-border h-full flex flex-col justify-between overflow-y-auto font-sans">
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <SheetHeader>
              <SheetTitle className="text-base font-black text-text-primary text-left flex items-center gap-2">
                <IconTarget className="h-5 w-5 text-brand-orange" />
                <span>{editingLead ? "Edit Lead Opportunity" : "Add New Lead Inquiry"}</span>
              </SheetTitle>
              <SheetDescription className="text-xs text-text-secondary text-left font-medium">
                Record potential client inquiries, deal value estimates, and follow-up dates.
              </SheetDescription>
            </SheetHeader>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs font-bold flex items-center gap-2">
                <IconAlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Input: Contact Person Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-primary">
                Contact Person Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full h-10 px-3 bg-surface-page border border-border/80 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-orange"
              />
            </div>

            {/* Input: Company Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-primary">
                Company / Agency Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. TechVibe Solutions"
                value={formCompany}
                onChange={(e) => setFormCompany(e.target.value)}
                className="w-full h-10 px-3 bg-surface-page border border-border/80 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-orange"
              />
            </div>

            {/* Grid: Email & Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-primary">Email Address</label>
                <input
                  type="email"
                  placeholder="rahul@techvibe.io"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full h-10 px-3 bg-surface-page border border-border/80 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-orange"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-primary">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full h-10 px-3 bg-surface-page border border-border/80 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-orange"
                />
              </div>
            </div>

            {/* Grid: Estimated Budget & Source */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-primary">Estimated Budget (₹)</label>
                <input
                  type="number"
                  placeholder="75000"
                  value={formValue}
                  onChange={(e) => setFormValue(Number(e.target.value))}
                  className="w-full h-10 px-3 bg-surface-page border border-border/80 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-orange"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-primary">Lead Source</label>
                <select
                  value={formSource}
                  onChange={(e) => setFormSource(e.target.value)}
                  className="w-full h-10 px-3 bg-surface-page border border-border/80 rounded-xl text-xs font-semibold text-text-primary focus:outline-none"
                >
                  {SOURCES.map((src) => (
                    <option key={src} value={src}>
                      {src}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Grid: Stage & Follow-Up Date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-primary">Kanban Stage</label>
                <select
                  value={formStage}
                  onChange={(e) => setFormStage(e.target.value as LeadStage)}
                  className="w-full h-10 px-3 bg-surface-page border border-border/80 rounded-xl text-xs font-semibold text-text-primary focus:outline-none"
                >
                  {KANBAN_COLUMNS.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-primary">Follow-Up Date</label>
                <input
                  type="date"
                  value={formFollowUp}
                  onChange={(e) => setFormFollowUp(e.target.value)}
                  className="w-full h-10 px-3 bg-surface-page border border-border/80 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-orange"
                />
              </div>
            </div>

            {/* Input: Notes */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-primary">Notes / Inquiry Details</label>
              <textarea
                rows={3}
                placeholder="Requirements, scope outline, tech stack requested..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="w-full p-3 bg-surface-page border border-border/80 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-orange resize-none"
              />
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="pt-3 flex items-center gap-2">
              <Button
                type="submit"
                disabled={isPending}
                className="flex-1 bg-brand-orange hover:bg-brand-orange-hover text-white font-bold text-xs h-10 rounded-xl border-0 cursor-pointer shadow-xs"
              >
                {isPending ? "Saving Lead..." : editingLead ? "Update Lead" : "Save Lead"}
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

      {/* 🏆 Convert Confirmation Drawer */}
      <Sheet open={isConvertOpen} onOpenChange={setIsConvertOpen}>
        <SheetContent className="w-full max-w-[440px] p-5 bg-surface-white border-l border-border h-full flex flex-col justify-between overflow-y-auto font-sans">
          <form onSubmit={submitConvertLead} className="space-y-4">
            <SheetHeader>
              <SheetTitle className="text-base font-black text-text-primary text-left flex items-center gap-2">
                <IconSparkles className="h-5 w-5 text-emerald-600 animate-pulse" />
                <span>Confirm Client Conversion</span>
              </SheetTitle>
              <SheetDescription className="text-xs text-text-secondary text-left font-medium">
                Verify details and add extra business profiles (GSTIN, Address, Website) before converting Rahul into a client partner.
              </SheetDescription>
            </SheetHeader>

            {/* Input: Company Name / Client Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-primary">
                Client / Company Name *
              </label>
              <input
                type="text"
                required
                value={convertName}
                onChange={(e) => setConvertName(e.target.value)}
                className="w-full h-10 px-3 bg-surface-page border border-border/80 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-orange"
              />
            </div>

            {/* Input: Contact Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-primary">
                Contact Person Name
              </label>
              <input
                type="text"
                value={convertContactName}
                onChange={(e) => setConvertContactName(e.target.value)}
                className="w-full h-10 px-3 bg-surface-page border border-border/80 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-orange"
              />
            </div>

            {/* Grid: Email & Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-primary">Email Address</label>
                <input
                  type="email"
                  value={convertEmail}
                  onChange={(e) => setConvertEmail(e.target.value)}
                  className="w-full h-10 px-3 bg-surface-page border border-border/80 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-orange"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-primary">Phone Number</label>
                <input
                  type="tel"
                  value={convertPhone}
                  onChange={(e) => setConvertPhone(e.target.value)}
                  className="w-full h-10 px-3 bg-surface-page border border-border/80 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-orange"
                />
              </div>
            </div>

            {/* Website & GSTIN */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-primary">Website URL</label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={convertWebsite}
                  onChange={(e) => setConvertWebsite(e.target.value)}
                  className="w-full h-10 px-3 bg-surface-page border border-border/80 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-orange"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-primary">GSTIN / Tax ID</label>
                <input
                  type="text"
                  placeholder="07AAAAA1111A1Z1"
                  value={convertGstin}
                  onChange={(e) => setConvertGstin(e.target.value)}
                  className="w-full h-10 px-3 bg-surface-page border border-border/80 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-orange"
                />
              </div>
            </div>

            {/* City & State */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-primary">City</label>
                <input
                  type="text"
                  placeholder="New Delhi"
                  value={convertCity}
                  onChange={(e) => setConvertCity(e.target.value)}
                  className="w-full h-10 px-3 bg-surface-page border border-border/80 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-orange"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-primary">State</label>
                <input
                  type="text"
                  placeholder="Delhi"
                  value={convertState}
                  onChange={(e) => setConvertState(e.target.value)}
                  className="w-full h-10 px-3 bg-surface-page border border-border/80 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-orange"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-primary">Street Address</label>
              <input
                type="text"
                placeholder="Connaught Place, Block A"
                value={convertAddress}
                onChange={(e) => setConvertAddress(e.target.value)}
                className="w-full h-10 px-3 bg-surface-page border border-border/80 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-orange"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-primary">Internal Client Notes</label>
              <textarea
                rows={2}
                value={convertNotes}
                onChange={(e) => setConvertNotes(e.target.value)}
                className="w-full p-3 bg-surface-page border border-border/80 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-orange resize-none"
              />
            </div>

            {/* Convert Finalize Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <Button
                type="submit"
                disabled={convertingId !== null}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 rounded-xl border-0 cursor-pointer shadow-xs animate-pulse"
              >
                {convertingId !== null ? "Converting Deal..." : "Finalize & Convert Partner 🏆"}
              </Button>
              <button
                type="button"
                onClick={() => setIsConvertOpen(false)}
                className="px-4 h-10 border border-border rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}

const getSourceColor = (source: string | null) => {
  const src = (source || "Direct").toLowerCase().trim();
  switch (src) {
    case "direct":
      return "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/30";
    case "referral":
      return "bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 border-purple-200/50 dark:border-purple-900/30";
    case "website":
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/30";
    case "instagram":
      return "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border-rose-200/50 dark:border-rose-900/30";
    case "linkedin":
      return "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-900/30";
    case "cold outreach":
      return "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/30";
    case "whatsapp":
      return "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 border-green-200/50 dark:border-green-900/30";
    default:
      return "bg-stone-50 text-stone-700 dark:bg-stone-900/20 dark:text-stone-400 border-stone-200/50 dark:border-stone-800/30";
  }
};


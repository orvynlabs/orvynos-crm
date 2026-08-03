"use client";

import { useState, useTransition, useMemo, useDeferredValue } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconSearch,
  IconDownload,
  IconPlus,
  IconPhone,
  IconChevronRight,
  IconAlertCircle,
  IconBuilding,
  IconUser,
  IconBriefcase,
  IconSparkles,
  IconFileText,
  IconX,
  IconTrash,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { ClientForm, type ClientFormValues } from "@/components/clients/client-form";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { createClient, deleteClient } from "./actions";
import { toast } from "@/components/ui/toast-provider";
import { confirmModal } from "@/components/ui/confirm-provider";

type Project = {
  id: string;
  name: string;
  status: string;
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
};

type ClientsClientProps = {
  initialClients: Client[];
  metrics: {
    totalClients: number;
    totalProjects: number;
    ongoingProjects: number;
    completedProjects: number;
  };
};

const getAvatarGradient = (name: string) => {
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradients = [
    "from-orange-500 to-amber-500 text-white shadow-orange-500/20",
    "from-blue-600 to-cyan-500 text-white shadow-blue-500/20",
    "from-emerald-600 to-teal-500 text-white shadow-emerald-500/20",
    "from-purple-600 to-indigo-500 text-white shadow-purple-500/20",
    "from-rose-600 to-pink-500 text-white shadow-rose-500/20",
    "from-violet-600 to-fuchsia-500 text-white shadow-violet-500/20"
  ];
  return gradients[hash % gradients.length];
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case "ONGOING":
      return {
        badge: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30",
        dot: "bg-emerald-500",
      };
    case "COMPLETED":
      return {
        badge: "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30",
        dot: "bg-blue-500",
      };
    case "REVIEW":
      return {
        badge: "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30",
        dot: "bg-amber-500",
      };
    case "ON_HOLD":
      return {
        badge: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30",
        dot: "bg-indigo-500",
      };
    default:
      return {
        badge: "bg-stone-50 text-stone-600 dark:bg-stone-900/40 dark:text-stone-400 border border-stone-150",
        dot: "bg-stone-400",
      };
  }
};

export function ClientsClient({ initialClients, metrics }: ClientsClientProps) {
  const [clientsList, setClientsList] = useState<Client[]>(initialClients);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Relative time helper
  const getRelativeTime = (dateString: string) => {
    const diffTime = Math.abs(Date.now() - new Date(dateString).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    return `${diffDays}d ago`;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  // Memoized Filtered Clients with non-blocking deferredSearchQuery
  const filteredClients = useMemo(() => {
    const q = deferredSearchQuery.toLowerCase().trim();
    if (!q) return clientsList;
    return clientsList.filter((client) => {
      return (
        client.name.toLowerCase().includes(q) ||
        (client.phone && client.phone.includes(q)) ||
        (client.contactName && client.contactName.toLowerCase().includes(q))
      );
    });
  }, [clientsList, deferredSearchQuery]);

  // Paginated clients
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredClients.length);
  const paginatedClients = useMemo(
    () => filteredClients.slice(startIndex, endIndex),
    [filteredClients, startIndex, endIndex]
  );

  // CSV Export handler
  const exportToCSV = () => {
    const headers = [
      "Company Name",
      "Contact Person",
      "Email",
      "Phone",
      "Website",
      "GSTIN",
      "City",
      "Projects Count",
      "Date Added",
    ];

    const rows = filteredClients.map((client) => [
      `"${client.name.replace(/"/g, '""')}"`,
      `"${(client.contactName || "").replace(/"/g, '""')}"`,
      client.email || "",
      client.phone || "",
      client.website || "",
      client.gstin || "",
      client.city || "",
      client.projects?.length || 0,
      client.createdAt,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `clients_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.info("Export Complete", `Exported ${filteredClients.length} clients to CSV file.`);
  };

  // JSON Export handler
  const exportToJSON = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(filteredClients, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `clients_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    toast.info("Export Complete", `Exported ${filteredClients.length} clients to JSON file.`);
  };

  // Handle Client Form Submission (Optimistic 0ms Update)
  const handleClientSubmit = (values: ClientFormValues) => {
    setErrorMsg("");

    const tempId = `temp-${Date.now()}`;
    const optimisticClient: Client = {
      id: tempId,
      name: values.name,
      logo: values.logo || null,
      contactName: values.contactName || null,
      email: values.email || null,
      phone: values.phone || null,
      secondaryPhone: values.secondaryPhone || null,
      website: values.website || null,
      address: values.address || null,
      city: values.city || null,
      state: values.state || null,
      gstin: values.gstin || null,
      createdAt: new Date().toISOString(),
      projects: [],
    };

    // ⚡ 1. Update UI optimistically & close sheet instantly
    setClientsList((prev) => [optimisticClient, ...prev]);
    setIsSheetOpen(false);
    toast.success("Client Profile Created 🎉", `${values.name} added to Orvynos CRM.`);

    // ⚡ 2. Persist in background
    startTransition(async () => {
      const res = await createClient(values);
      if (res.success && res.data) {
        setClientsList((prev) =>
          prev.map((c) => (c.id === tempId ? { ...c, id: res.data!.id } : c))
        );
      } else {
        setClientsList((prev) => prev.filter((c) => c.id !== tempId));
        const err = res.error || "Failed to create client profile.";
        setErrorMsg(err);
        toast.error("Failed to Add Client", err);
      }
    });
  };

  const handleDeleteClient = async (id: string, name: string) => {
    const ok = await confirmModal({
      title: `Delete Client "${name}"?`,
      description: `Are you sure you want to delete ${name}? This will remove the client profile and linked data. This action cannot be undone.`,
      confirmText: "Delete Client",
      variant: "danger",
    });
    if (!ok) return;

    startTransition(async () => {
      setClientsList((prev) => prev.filter((c) => c.id !== id));
      const res = await deleteClient(id);
      if (res.success) {
        toast.warning("Client Deleted", `${name} was permanently removed.`);
      } else {
        const err = res.error || "Failed to delete client.";
        toast.error("Delete Failed", err);
      }
    });
  };

  return (
    <div className="space-y-4 font-sans text-left pb-20 md:pb-6">
      {/* ─── Compact Modern Header ─── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center p-1.5 rounded-lg bg-brand-orange/10 text-brand-orange">
              <IconBuilding className="h-4 w-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Client Directory</h1>
          </div>
          <p className="text-[11px] sm:text-xs text-text-secondary mt-0.5 font-medium">
            Manage agency clients, contact persons, billing info &amp; linked projects.
          </p>
        </div>

        {/* Slide-out Add Client drawer */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger
            render={
              <Button className="gap-1.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold text-xs py-1.5 px-3.5 rounded-xl shadow-xs border-0 h-9 cursor-pointer active:scale-95 transition-all">
                <IconPlus className="h-4 w-4" stroke={2.5} />
                <span>Add Client</span>
              </Button>
            }
          />
          <SheetContent className="w-full max-w-[420px] p-5 bg-surface-white border-l border-border h-full flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <SheetHeader>
                <SheetTitle className="text-base font-bold text-text-primary text-left flex items-center gap-2">
                  <IconBuilding className="h-4 w-4 text-brand-orange" />
                  <span>Create New Client</span>
                </SheetTitle>
                <SheetDescription className="text-xs text-text-secondary mt-0.5 text-left">
                  Add a new client profile to Orvynos CRM. Fill out the details below.
                </SheetDescription>
              </SheetHeader>

              <ClientForm
                onSubmit={handleClientSubmit}
                onCancel={() => setIsSheetOpen(false)}
                isPending={isPending}
                errorMsg={errorMsg}
                submitLabel="Save Client Profile"
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* ─── METRICS ROW ─── */}
      <div className="grid gap-2.5 grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Clients", value: metrics.totalClients, color: "bg-orange-50 dark:bg-orange-950/30 text-brand-orange border-orange-100 dark:border-orange-900/30", desc: "Registered accounts" },
          { label: "Total Projects", value: metrics.totalProjects, color: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30", desc: "Contracts across all" },
          { label: "Active Execution", value: metrics.ongoingProjects, color: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30", desc: "In active workflow" },
          { label: "Completed", value: metrics.completedProjects, color: "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/30", desc: "Delivered contracts" },
        ].map((m) => (
          <div key={m.label} className="p-3 bg-surface-white border border-border-custom rounded-xl flex items-center gap-3 shadow-2xs hover:shadow-xs transition-shadow">
            <div className={`w-9 h-9 rounded-lg ${m.color} flex items-center justify-center border shrink-0`}>
              <span className="text-base font-black">{m.value}</span>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase text-text-secondary tracking-wider block truncate">{m.label}</span>
              <span className="text-[10px] text-text-secondary/70 font-medium truncate block">{m.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ─── ACTION BAR ─── */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between bg-surface-white border border-border-custom rounded-xl p-2.5 shadow-2xs">
        {/* Search */}
        <div className="relative w-full sm:max-w-[280px]">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-secondary" />
          <input
            type="text"
            placeholder="Search name, contact, or phone..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-8 h-8 bg-surface-page border border-border-custom rounded-lg text-xs shadow-2xs placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-foreground cursor-pointer"
            >
              <IconX className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Export buttons */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            className="h-8 bg-surface-page border border-border-custom hover:bg-surface-white text-[11px] font-bold px-2.5 rounded-lg flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95 transition-all"
          >
            <IconDownload className="h-3.5 w-3.5 text-text-secondary" /> CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToJSON}
            className="h-8 bg-surface-page border border-border-custom hover:bg-surface-white text-[11px] font-bold px-2.5 rounded-lg flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95 transition-all"
          >
            <IconDownload className="h-3.5 w-3.5 text-text-secondary" /> JSON
          </Button>
        </div>
      </div>

      {/* ─── ANIMATED CLIENT CARDS GRID ─── */}
      <AnimatePresence mode="wait">
        {paginatedClients.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          >
            {paginatedClients.map((client, idx) => {
              const clientInitials = getInitials(client.name);
              const avatarGrad = getAvatarGradient(client.name);
              return (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15, delay: Math.min(idx * 0.03, 0.2) }}
                  whileHover={{ y: -2 }}
                  className="bg-surface-white border border-border-custom rounded-xl p-3.5 shadow-2xs hover:shadow-md hover:border-brand-orange/40 transition-all duration-200 flex flex-col justify-between group/card"
                >
                  <Link href={`/clients/${client.id}`} className="block cursor-pointer space-y-2.5">
                    {/* Client Header Info */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {client.logo ? (
                          <img
                            src={client.logo}
                            alt={client.name}
                            className="w-8 h-8 rounded-full object-cover border border-border-custom shrink-0 shadow-2xs"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div
                            className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarGrad} flex items-center justify-center text-xs font-black shrink-0 shadow-xs`}
                          >
                            {clientInitials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="font-extrabold text-xs sm:text-sm text-foreground truncate group-hover/card:text-brand-orange transition-colors">
                            {client.name}
                          </h3>
                          {client.contactName && (
                            <p className="text-[10px] text-text-secondary font-medium truncate flex items-center gap-1">
                              <IconUser className="h-3 w-3 text-text-secondary/70" />
                              {client.contactName}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Touch chevron */}
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-surface-page text-text-secondary group-hover/card:bg-brand-orange/10 group-hover/card:text-brand-orange transition-all shrink-0">
                        <IconChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </div>

                    {/* Phone & Location Metadata */}
                    <div className="space-y-1 pt-1 border-t border-border-custom/40">
                      {client.phone && (
                        <div className="text-[11px] text-text-secondary font-medium flex items-center justify-between">
                          <span className="flex items-center gap-1 text-text-secondary/80">
                            <IconPhone className="h-3 w-3 text-brand-orange" /> {client.phone}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[10px] text-text-secondary font-normal">
                        <span>Added {getRelativeTime(client.createdAt)}</span>
                        {client.city && <span className="font-bold text-foreground">{client.city}</span>}
                      </div>
                    </div>
                  </Link>

                  {/* Projects Badge Footer */}
                  <div className="pt-2.5 mt-2 border-t border-border-custom/50 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1">
                      <IconBriefcase className="h-3 w-3 text-blue-500" />
                      {client.projects.length} {client.projects.length === 1 ? "Project" : "Projects"}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleDeleteClient(client.id, client.name);
                        }}
                        className="p-1 rounded-lg text-text-secondary hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                        title="Delete Client"
                      >
                        <IconTrash className="h-3.5 w-3.5" />
                      </button>
                      <Link
                        href={`/clients/${client.id}`}
                        className="text-[11px] font-bold text-brand-orange hover:text-brand-orange-hover flex items-center gap-0.5 cursor-pointer touch-manipulation active:scale-95 transition-transform"
                      >
                        <span>View Profile</span>
                        <IconChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-xl border border-dashed border-border-custom bg-surface-white/60"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-page border border-border-custom shadow-2xs mb-3">
              <IconBuilding className="h-6 w-6 text-text-secondary/70" />
            </div>
            <h3 className="text-xs font-bold text-foreground mb-0.5">No clients found</h3>
            <p className="text-[11px] text-text-secondary mb-4 max-w-xs leading-relaxed">
              No matching client profiles found. Add your first client to manage projects &amp; invoices.
            </p>
            <Button
              size="sm"
              onClick={() => setIsSheetOpen(true)}
              className="gap-1.5 shadow-xs bg-brand-orange hover:bg-brand-orange-hover text-white text-xs font-semibold rounded-lg active:scale-95 transition-all py-1 px-3 cursor-pointer"
            >
              <IconPlus className="h-3.5 w-3.5" /> Add Client
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── PAGINATION ─── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs text-text-secondary">
          <span>Showing {startIndex + 1}-{endIndex} of {filteredClients.length} clients</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded-lg border border-border-custom bg-surface-white hover:bg-surface-page disabled:opacity-40 disabled:cursor-not-allowed font-bold cursor-pointer transition active:scale-95"
            >
              Prev
            </button>
            <span className="font-bold text-foreground px-2">{currentPage} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded-lg border border-border-custom bg-surface-white hover:bg-surface-page disabled:opacity-40 disabled:cursor-not-allowed font-bold cursor-pointer transition active:scale-95"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

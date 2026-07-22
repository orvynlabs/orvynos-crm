"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  IconSearch,
  IconDownload,
  IconPlus,
  IconPhone,
  IconChevronRight,
  IconAlertCircle,
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
import { createClient } from "./actions";

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
    case "NEW":
      return {
        badge: "bg-stone-50 text-stone-600 dark:bg-stone-900/40 dark:text-stone-450 border border-stone-150",
        dot: "bg-stone-400",
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
  const [searchQuery, setSearchQuery] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Calculate relative date strings
  const getRelativeTime = (dateString: string) => {
    const diffTime = Math.abs(Date.now() - new Date(dateString).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    return `${diffDays}d ago`;
  };

  // Helper for avatar initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  // Filter clients
  const filteredClients = initialClients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.phone && client.phone.includes(searchQuery)) ||
      (client.contactName &&
        client.contactName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  // Paginated clients
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredClients.length);
  const paginatedClients = filteredClients.slice(startIndex, endIndex);

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
      client.projects.length,
      new Date(client.createdAt).toLocaleDateString("en-IN"),
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
  };

  // Handle Client Form Submission
  const handleClientSubmit = (values: ClientFormValues) => {
    setErrorMsg("");
    startTransition(async () => {
      const res = await createClient(values);
      if (res.success) {
        setIsSheetOpen(false);
      } else {
        setErrorMsg(res.error || "Something went wrong.");
      }
    });
  };

  return (
    <div className="space-y-5 font-sans text-left">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-lg md:text-xl font-black tracking-tight text-text-primary">
            Clients
          </h1>
          <p className="text-[11px] text-text-secondary mt-0.5 font-medium">
            Manage client accounts, contact details, and linked projects.
          </p>
        </div>

        {/* Slide-out Add Client drawer */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger
            render={
              <Button className="font-bold text-xs bg-brand-orange hover:bg-brand-orange-hover text-white py-2 px-4 rounded-lg flex items-center gap-1.5 shadow-xs border-0 h-8 cursor-pointer active:scale-[0.98] transition-all">
                <IconPlus className="h-3.5 w-3.5" stroke={2.5} /> Add Client
              </Button>
            }
          />
          <SheetContent className="w-full max-w-[420px] p-5 bg-surface-white border-l border-border h-full flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <SheetHeader>
                <SheetTitle className="text-base font-bold text-text-primary text-left">
                  Create New Client
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
                submitLabel="Save Client"
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>



      {/* METRICS ROW */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Clients", value: metrics.totalClients, color: "bg-orange-50 text-brand-orange border-orange-100", desc: "Registered accounts" },
          { label: "Total Projects", value: metrics.totalProjects, color: "bg-blue-50 text-blue-600 border-blue-100", desc: "Contracts across all" },
          { label: "Active", value: metrics.ongoingProjects, color: "bg-emerald-50 text-emerald-600 border-emerald-100", desc: "In active execution" },
          { label: "Completed", value: metrics.completedProjects, color: "bg-purple-50 text-purple-600 border-purple-100", desc: "Delivered projects" },
        ].map((m) => (
          <div key={m.label} className="p-3.5 md:p-4 bg-surface-white border border-border rounded-xl flex items-center gap-3.5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className={`w-10 h-10 rounded-lg ${m.color} flex items-center justify-center border shrink-0`}>
              <span className="text-base md:text-lg font-black">{m.value}</span>
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold uppercase text-text-secondary tracking-wider block truncate">{m.label}</span>
              <span className="text-[11px] text-text-secondary/70 font-medium truncate block">{m.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ACTION BAR */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between bg-surface-white border border-border rounded-xl p-3 shadow-2xs">
        {/* Search */}
        <div className="relative w-full sm:max-w-[280px]">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 h-8 bg-surface-page border border-border rounded-lg text-base sm:text-xs shadow-2xs placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
          />
        </div>

        {/* Export buttons */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            className="h-8 bg-surface-page border border-border hover:bg-surface-white text-[11px] font-bold px-3 rounded-lg flex items-center gap-1 cursor-pointer shadow-2xs active:scale-[0.98] transition-all"
          >
            <IconDownload className="h-3.5 w-3.5 text-text-secondary" /> CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToJSON}
            className="h-8 bg-surface-page border border-border hover:bg-surface-white text-[11px] font-bold px-3 rounded-lg flex items-center gap-1 cursor-pointer shadow-2xs active:scale-[0.98] transition-all"
          >
            <IconDownload className="h-3.5 w-3.5 text-text-secondary" /> JSON
          </Button>
        </div>
      </div>

      {/* CARD LIST GRID */}
      {paginatedClients.length > 0 ? (
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {paginatedClients.map((client) => {
            const clientInitials = getInitials(client.name);
            const avatarGrad = getAvatarGradient(client.name);
            return (
              <div
                key={client.id}
                className="bg-surface-white border border-border rounded-xl p-3 shadow-2xs hover:shadow-xs hover:border-brand-orange/30 transition-all duration-200 flex flex-col justify-between group/card"
              >
                <Link href={`/clients/${client.id}`} className="block cursor-pointer space-y-2">
                  {/* Client Info Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Logo or Initials */}
                      {client.logo ? (
                        <img
                          src={client.logo}
                          alt={client.name}
                          className="w-7 h-7 rounded-full object-cover border border-border/80 shrink-0 shadow-2xs"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className={`w-7 h-7 rounded-full bg-gradient-to-tr ${avatarGrad} flex items-center justify-center font-bold text-[10px] select-none shrink-0 shadow-2xs`}>
                          {clientInitials}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-bold text-stone-900 text-xs tracking-tight capitalize group-hover/card:text-brand-orange transition-colors truncate leading-tight">
                          {client.name}
                        </h4>
                        {client.contactName && (
                          <p className="text-[10px] text-text-secondary font-medium truncate leading-tight">
                            {client.contactName}
                          </p>
                        )}
                      </div>
                    </div>
                    {/* Visual Chevron Link */}
                    <div className="text-stone-400 group-hover/card:text-brand-orange p-0.5 rounded-full group-hover/card:bg-stone-50 transition-all duration-200 shrink-0">
                      <IconChevronRight className="h-3.5 w-3.5" />
                    </div>
                  </div>

                  {/* Phone Numbers Bar */}
                  {(client.phone || client.secondaryPhone) && (
                    <div className="flex flex-wrap items-center gap-1 text-[10px] font-semibold text-text-secondary">
                      {client.phone && (
                        <span className="inline-flex items-center gap-0.5 bg-surface-page px-1.5 py-0.5 rounded border border-border/60">
                          <IconPhone className="h-2.5 w-2.5 text-brand-orange" />
                          <span>{client.phone}</span>
                        </span>
                      )}
                      {client.secondaryPhone && (
                        <span className="inline-flex items-center gap-0.5 bg-surface-page px-1.5 py-0.5 rounded border border-border/60 text-text-secondary/80">
                          <IconPhone className="h-2.5 w-2.5 text-stone-400" />
                          <span>{client.secondaryPhone}</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Inner Panel for Projects */}
                  <div className="bg-stone-50/60 border border-border/60 rounded-lg p-2 space-y-1 group-hover/card:border-brand-orange-tint transition-all duration-200">
                    <div className="flex items-center justify-between text-[9px] font-extrabold text-text-secondary uppercase tracking-wider">
                      <span>Projects</span>
                      <span className="bg-surface-white px-1.5 py-0.5 rounded border border-border/60 font-bold text-text-primary text-[9px]">
                        {client.projects.length}
                      </span>
                    </div>

                    {client.projects.length > 0 ? (
                      <div className="space-y-0.5">
                        {client.projects.slice(0, 2).map((proj) => {
                          const statusConf = getStatusConfig(proj.status);
                          return (
                            <div
                              key={proj.id}
                              className="flex items-center justify-between gap-2 py-0.5"
                            >
                              <span className="font-semibold text-stone-800 truncate flex-1 min-w-0 text-[10px]">
                                {proj.name}
                              </span>
                              <span
                                className={`inline-flex items-center gap-0.5 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${statusConf.badge}`}
                              >
                                <span className={`w-1 h-1 rounded-full ${statusConf.dot}`} />
                                {proj.status.toLowerCase()}
                              </span>
                            </div>
                          );
                        })}
                        {client.projects.length > 2 && (
                          <div className="text-right text-[9px] font-bold text-brand-orange group-hover/card:underline">
                            + {client.projects.length - 2} more
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-1 text-center text-[9px] text-stone-400 font-semibold italic">
                        No active projects
                      </div>
                    )}
                  </div>
                </Link>

                {/* Compact Card Footer */}
                <div className="flex items-center justify-between text-[9px] text-text-secondary mt-2 pt-2 border-t border-border/50">
                  <span className="font-medium text-stone-400">
                    {getRelativeTime(client.createdAt)}
                  </span>
                  <Link
                    href={`/projects/new?clientId=${client.id}`}
                    className="font-extrabold text-brand-orange hover:text-brand-orange-hover transition-colors text-[10px]"
                  >
                    + New Project
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-surface-white border border-border rounded-xl p-10 text-center shadow-2xs">
          <div className="inline-block p-2.5 bg-brand-orange-tint text-brand-orange rounded-full mb-3">
            <IconAlertCircle className="h-5 w-5" />
          </div>
          <h3 className="text-xs font-bold text-text-primary">No clients found</h3>
          <p className="text-[11px] text-text-secondary mt-1">
            Try adjusting your search query or add a new client profile.
          </p>
        </div>
      )}

      {/* PAGINATION FOOTER */}
      {filteredClients.length > itemsPerPage && (
        <div className="flex items-center justify-between pt-3 border-t border-border/60 select-none">
          <span className="text-[11px] text-text-secondary font-medium">
            Showing <span className="font-bold text-text-primary">{startIndex + 1}</span>-
            <span className="font-bold text-text-primary">{endIndex}</span> of{" "}
            <span className="font-bold text-text-primary">{filteredClients.length}</span> clients
          </span>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="h-7 text-[11px] font-semibold px-3 rounded-lg bg-surface-white border border-border hover:bg-surface-page cursor-pointer active:scale-[0.96] transition-all"
            >
              &lt; Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              className="h-7 text-[11px] font-semibold px-3 rounded-lg bg-surface-white border border-border hover:bg-surface-page cursor-pointer active:scale-[0.96] transition-all"
            >
              Next &gt;
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

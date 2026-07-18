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
        dot: "bg-stone-405",
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
  const itemsPerPage = 6;

  // Calculate relative date strings
  const getRelativeTime = (dateString: string) => {
    const diffTime = Math.abs(Date.now() - new Date(dateString).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) return "Added today";
    if (diffDays === 2) return "Added yesterday";
    return `Added ${diffDays} days ago`;
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
    <div className="space-y-6 font-sans text-left">
      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-text-primary">
            Clients
          </h1>
          <p className="text-sm md:text-[15px] text-text-secondary font-medium">
            View all client accounts, manage contact details, and jump directly into active projects.
          </p>
        </div>

        {/* Slide-out Add Client drawer */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger
            render={
              <Button className="font-bold text-xs bg-brand-orange hover:bg-brand-orange-hover text-white py-2.5 px-4 rounded-lg flex items-center gap-1.5 shadow-none border-0 min-h-[40px] cursor-pointer active:scale-[0.98] transition-all">
                <IconPlus className="h-4.5 w-4.5" stroke={2.5} /> Add Client
              </Button>
            }
          />
          <SheetContent className="w-full max-w-[450px] p-6 bg-surface-white border-l border-border h-full flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <SheetHeader>
                <SheetTitle className="text-lg font-bold text-text-primary text-left">
                  Create New Client
                </SheetTitle>
                <SheetDescription className="text-xs text-text-secondary mt-1 text-left">
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

      {/* METRICS ROW - Premium Cards with Icons and Simple Descriptions */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Total clients */}
        <div className="bg-surface-white border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-250 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] md:text-[11px] font-extrabold text-text-secondary uppercase tracking-wider block">
              Total clients
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-brand-orange flex items-center justify-center border border-orange-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
                <path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
              </svg>
            </div>
          </div>
          <span className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight mt-3 block">
            {metrics.totalClients}
          </span>
          <p className="text-[10px] md:text-[11px] text-stone-400 font-semibold mt-2 border-t border-stone-100 pt-2 leading-relaxed">
            Registered corporate partners.
          </p>
        </div>

        {/* Total projects */}
        <div className="bg-surface-white border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-250 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] md:text-[11px] font-extrabold text-text-secondary uppercase tracking-wider block">
              Total projects
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M5 19l2.757 -7.351a1 1 0 0 1 .936 -.649h12.307a1 1 0 0 1 .986 1.164l-.996 5.211a2 2 0 0 1 -1.972 1.625h-12.022a2 2 0 0 1 -2 -2z" />
                <path d="M5 14v-6a2 2 0 0 1 2 -2h3.586a1 1 0 0 1 .707 .293l2.414 2.414a1 1 0 0 0 .707 .293h3.586a2 2 0 0 1 2 2v2" />
              </svg>
            </div>
          </div>
          <span className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight mt-3 block">
            {metrics.totalProjects}
          </span>
          <p className="text-[10px] md:text-[11px] text-stone-400 font-semibold mt-2 border-t border-stone-100 pt-2 leading-relaxed">
            All registered tasks & outputs.
          </p>
        </div>

        {/* Ongoing */}
        <div className="bg-surface-white border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-250 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] md:text-[11px] font-extrabold text-text-secondary uppercase tracking-wider block">
              Ongoing
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M9 4.55a8 8 0 0 1 6 14.9a8 8 0 0 1 -12 -6.9a8 8 0 0 1 6 -8" />
                <path d="M12 7v5l3 3" />
              </svg>
            </div>
          </div>
          <span className="text-2xl md:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight mt-3 block">
            {metrics.ongoingProjects}
          </span>
          <p className="text-[10px] md:text-[11px] text-stone-400 font-semibold mt-2 border-t border-stone-100 pt-2 leading-relaxed">
            Active projects currently being built.
          </p>
        </div>

        {/* Completed */}
        <div className="bg-surface-white border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-250 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] md:text-[11px] font-extrabold text-text-secondary uppercase tracking-wider block">
              Completed
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M5 12l5 5l10 -10" />
              </svg>
            </div>
          </div>
          <span className="text-2xl md:text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tight mt-3 block">
            {metrics.completedProjects}
          </span>
          <p className="text-[10px] md:text-[11px] text-stone-400 font-semibold mt-2 border-t border-stone-100 pt-2 leading-relaxed">
            Finished projects successfully delivered.
          </p>
        </div>
      </div>

      {/* ACTION BAR - Unified Modern Dock Style */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-surface-white border border-border rounded-xl p-3.5 shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:max-w-[320px]">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-text-secondary" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9.5 pr-4 h-9 bg-surface-page border border-border rounded-lg text-sm md:text-[15px] shadow-sm placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
          />
        </div>

        {/* Export buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            className="h-9 bg-surface-page border border-border hover:bg-surface-white text-xs md:text-sm font-bold px-4 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-[0.98] transition-all"
          >
            <IconDownload className="h-4 w-4 text-text-secondary" /> CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToJSON}
            className="h-9 bg-surface-page border border-border hover:bg-surface-white text-xs md:text-sm font-bold px-4 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-[0.98] transition-all"
          >
            <IconDownload className="h-4 w-4 text-text-secondary" /> JSON
          </Button>
        </div>
      </div>

      {/* CARD LIST GRID - Redesigned Modern Cards with Dynamic Gradients */}
      {paginatedClients.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2">
          {paginatedClients.map((client) => {
            const clientInitials = getInitials(client.name);
            const avatarGrad = getAvatarGradient(client.name);
            return (
              <div
                key={client.id}
                className="bg-surface-white border border-border rounded-xl p-4.5 shadow-sm hover:shadow-md hover:border-brand-orange/30 transition-all duration-200 flex flex-col justify-between group/card"
              >
                <Link href={`/clients/${client.id}`} className="block cursor-pointer">
                  {/* Client Info Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {/* Initials Circle with Deterministic Premium Gradient */}
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${avatarGrad} flex items-center justify-center font-bold text-xs select-none transition-transform group-hover/card:scale-105 duration-300 shadow`}>
                        {clientInitials}
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="font-extrabold text-stone-900 text-[14px] md:text-[16px] tracking-tight capitalize group-hover/card:text-brand-orange transition-colors">
                          {client.name}
                        </h4>
                        {client.phone && (
                          <p className="text-[10px] md:text-xs text-text-secondary font-semibold flex items-center gap-1">
                            <IconPhone className="h-3.5 w-3.5 shrink-0 text-text-secondary/70" />
                            {client.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    {/* Visual Chevron Link */}
                    <div className="text-stone-400 group-hover/card:text-brand-orange p-1 rounded-full group-hover/card:bg-stone-50 transition-all duration-250">
                      <IconChevronRight className="h-4 w-4" />
                    </div>
                  </div>

                  {/* Inner Panel for Projects */}
                  <div className="bg-stone-50/70 border border-border/80 rounded-xl p-3.5 mt-3.5 space-y-2 group-hover/card:border-brand-orange-tint group-hover/card:bg-stone-50/30 transition-all duration-200">
                    <div className="flex items-center gap-1.5 text-[9px] md:text-[10.5px] font-extrabold text-text-secondary uppercase tracking-widest border-b border-stone-200/40 pb-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-text-secondary/70" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <path d="M5 4h4l3 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2" />
                      </svg>
                      <span>
                        {client.projects.length}{" "}
                        {client.projects.length === 1 ? "project" : "projects"}
                      </span>
                    </div>

                    {client.projects.length > 0 ? (
                      <div className="divide-y divide-border/40">
                        {client.projects.slice(0, 2).map((proj) => {
                          const statusConf = getStatusConfig(proj.status);
                          return (
                            <div
                              key={proj.id}
                              className="py-2 flex items-center justify-between text-xs md:text-[13.5px] gap-2"
                            >
                              <span className="font-semibold text-stone-850 truncate flex-1 min-w-0">
                                {proj.name}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 text-[9px] md:text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${statusConf.badge}`}
                              >
                                <span className={`w-1 h-1 rounded-full ${statusConf.dot}`} />
                                {proj.status.toLowerCase()}
                              </span>
                            </div>
                          );
                        })}
                        {client.projects.length > 2 && (
                          <div className="pt-2 text-right text-[10px] md:text-xs font-bold text-brand-orange group-hover/card:underline">
                            + {client.projects.length - 2} more projects
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-2 flex items-center justify-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-stone-300" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                          <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
                          <path d="M12 9h.01" />
                          <path d="M11 12h1v4h1" />
                        </svg>
                        <span className="text-[11px] text-stone-400 font-semibold italic">
                          No projects registered
                        </span>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Footer details with active action effects */}
                <div className="flex items-center justify-between text-xs text-text-secondary mt-4 pt-3.5 border-t border-border/60">
                  <span className="font-medium text-[10px] md:text-xs text-stone-450">
                    {getRelativeTime(client.createdAt)}
                  </span>
                  <Link
                    href={`/projects/new?clientId=${client.id}`}
                    className="font-extrabold text-brand-orange hover:text-brand-orange-hover active:scale-[0.98] transition-all duration-150 text-[11px] md:text-[13px]"
                  >
                    + New Project
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-surface-white border border-border rounded-xl p-12 text-center shadow-sm">
          <div className="inline-block p-3 bg-brand-orange-tint text-brand-orange rounded-full mb-3">
            <IconAlertCircle className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-text-primary">No clients found</h3>
          <p className="text-xs text-text-secondary mt-1">
            Try adjusting your search query or add a new client profile.
          </p>
        </div>
      )}

      {/* PAGINATION FOOTER */}
      {filteredClients.length > itemsPerPage && (
        <div className="flex items-center justify-between pt-4 border-t border-border/60 select-none">
          <span className="text-xs text-text-secondary font-medium">
            Showing <span className="font-bold text-text-primary">{startIndex + 1}</span>-
            <span className="font-bold text-text-primary">{endIndex}</span> of{" "}
            <span className="font-bold text-text-primary">{filteredClients.length}</span> clients
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="h-8 text-xs font-semibold px-3 rounded-lg bg-surface-white border border-border hover:bg-surface-page cursor-pointer active:scale-[0.96] transition-all"
            >
              &lt; Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              className="h-8 text-xs font-semibold px-3 rounded-lg bg-surface-white border border-border hover:bg-surface-page cursor-pointer active:scale-[0.96] transition-all"
            >
              Next &gt;
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  IconSearch,
  IconDownload,
  IconPlus,
  IconPhone,
  IconFolder,
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

export function ClientsClient({ initialClients, metrics }: ClientsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Form states managed by ClientForm

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

  // Helper for project status styling
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
    <div className="space-y-6 font-sans">
      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-text-primary">
            Clients
          </h1>
          <p className="text-sm text-text-secondary">
            View all clients and jump into their projects
          </p>
        </div>

        {/* Slide-out Add Client drawer */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger
            render={
              <Button className="h-9 bg-brand-orange text-white hover:bg-brand-orange-hover font-bold px-4 rounded-lg flex items-center gap-1 shadow-sm cursor-pointer self-start sm:self-auto">
                <IconPlus className="h-4.5 w-4.5" stroke={2.5} /> Add Client
              </Button>
            }
          />
          <SheetContent className="w-full max-w-[450px] p-6 bg-surface-white border-l border-border h-full flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <SheetHeader>
                <SheetTitle className="text-lg font-bold text-text-primary">
                  Create New Client
                </SheetTitle>
                <SheetDescription className="text-xs text-text-secondary mt-1">
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
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Total clients */}
        <div className="bg-surface-white border border-border rounded-xl p-4 shadow-sm">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
            Total clients
          </span>
          <span className="text-2xl font-extrabold text-text-primary tracking-tight mt-1.5 block">
            {metrics.totalClients}
          </span>
        </div>

        {/* Total projects */}
        <div className="bg-surface-white border border-border rounded-xl p-4 shadow-sm">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
            Total projects
          </span>
          <span className="text-2xl font-extrabold text-text-primary tracking-tight mt-1.5 block">
            {metrics.totalProjects}
          </span>
        </div>

        {/* Ongoing */}
        <div className="bg-surface-white border border-border rounded-xl p-4 shadow-sm">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
            Ongoing
          </span>
          <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight mt-1.5 block">
            {metrics.ongoingProjects}
          </span>
        </div>

        {/* Completed */}
        <div className="bg-surface-white border border-border rounded-xl p-4 shadow-sm">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
            Completed
          </span>
          <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight mt-1.5 block">
            {metrics.completedProjects}
          </span>
        </div>
      </div>

      {/* ACTION BAR */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-surface-white border border-border rounded-xl p-4 shadow-sm">
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
            className="w-full pl-9.5 pr-4 h-9 bg-surface-page border border-border rounded-lg text-sm shadow-sm placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-medium"
          />
        </div>

        {/* Export buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            className="h-9 bg-surface-page border border-border hover:bg-surface-white text-xs font-bold px-3.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <IconDownload className="h-4.5 w-4.5 text-text-secondary" /> CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToJSON}
            className="h-9 bg-surface-page border border-border hover:bg-surface-white text-xs font-bold px-3.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <IconDownload className="h-4.5 w-4.5 text-text-secondary" /> JSON
          </Button>
        </div>
      </div>

      {/* CARD LIST GRID */}
      {paginatedClients.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {paginatedClients.map((client) => {
            const clientInitials = getInitials(client.name);
            return (
              <div
                key={client.id}
                className="bg-surface-white border border-border rounded-xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-brand-orange/40 hover:bg-brand-orange-tint/15 dark:hover:bg-brand-orange-tint/5 transition-all duration-200"
              >
                <Link href={`/clients/${client.id}`} className="group/card block cursor-pointer">
                  {/* Client Info Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {/* Initials Circle */}
                      <div className="w-9 h-9 rounded-full bg-brand-orange-tint text-brand-orange flex items-center justify-center font-bold text-xs select-none transition-transform group-hover/card:scale-105">
                        {clientInitials}
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="font-extrabold text-text-primary text-sm tracking-tight capitalize group-hover/card:text-brand-orange transition-colors">
                          {client.name}
                        </h4>
                        {client.phone && (
                          <p className="text-[10px] text-text-secondary font-semibold flex items-center gap-1">
                            <IconPhone className="h-3.5 w-3.5 shrink-0 text-text-secondary/85" />
                            {client.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    {/* Visual Chevron Link */}
                    <div
                      className="text-text-secondary group-hover/card:text-brand-orange p-1 rounded-full group-hover/card:bg-surface-page transition-colors"
                    >
                      <IconChevronRight className="h-4.5 w-4.5" />
                    </div>
                  </div>

                  {/* Grey Sub-row/Panel for Projects */}
                  <div className="bg-surface-page border border-border/80 rounded-lg p-3 mt-3.5 space-y-2 group-hover/card:border-brand-orange/30 group-hover/card:bg-surface-white transition-all duration-200">
                    <div className="flex items-center gap-1.5 text-[9px] font-extrabold text-text-secondary uppercase tracking-widest">
                      <IconFolder className="h-3.5 w-3.5 shrink-0 text-text-secondary/85" />
                      <span>
                        {client.projects.length}{" "}
                        {client.projects.length === 1 ? "project" : "projects"}
                      </span>
                    </div>

                    {client.projects.length > 0 ? (
                      <div className="divide-y divide-border/60">
                        {client.projects.slice(0, 2).map((proj) => (
                          <div
                            key={proj.id}
                            className="py-1.5 flex items-center justify-between text-xs"
                          >
                            <span className="font-bold text-text-primary truncate max-w-[200px]">
                              {proj.name}
                            </span>
                            <span
                              className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${getStatusStyles(
                                proj.status
                              )}`}
                            >
                              {proj.status.toLowerCase()}
                            </span>
                          </div>
                        ))}
                        {client.projects.length > 2 && (
                          <div className="pt-1.5 text-right text-[10px] font-bold text-brand-orange group-hover/card:underline">
                            + {client.projects.length - 2} more projects
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-text-secondary italic">
                        No projects registered
                      </p>
                    )}
                  </div>
                </Link>

                {/* Footer details */}
                <div className="flex items-center justify-between text-xs text-text-secondary mt-4 pt-3 border-t border-border/60">
                  <span className="font-medium text-[10px]">
                    {getRelativeTime(client.createdAt)}
                  </span>
                  <Link
                    href={`/projects/new?clientId=${client.id}`}
                    className="font-bold text-brand-orange hover:text-brand-orange-hover"
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
              className="h-8 text-xs font-semibold px-3 rounded-lg bg-surface-white border border-border hover:bg-surface-page cursor-pointer"
            >
              &lt; Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              className="h-8 text-xs font-semibold px-3 rounded-lg bg-surface-white border border-border hover:bg-surface-page cursor-pointer"
            >
              Next &gt;
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import {
  IconChartBar,
  IconCurrencyRupee,
  IconReceipt2,
  IconTrendingUp,
  IconDownload,
  IconFileSpreadsheet,
  IconFileCode,
  IconPrinter,
  IconCalendar,
  IconCheck,
  IconBriefcase,
  IconUsers,
  IconCreditCard,
  IconSparkles,
} from "@tabler/icons-react";
import { getReportsData, type ReportDateFilter } from "./actions";
import { toast } from "@/components/ui/toast-provider";

type ReportsClientProps = {
  initialData: any;
};

const PRESET_OPTIONS: { id: ReportDateFilter; label: string }[] = [
  { id: "ALL", label: "All Time" },
  { id: "THIS_MONTH", label: "This Month" },
  { id: "LAST_MONTH", label: "Last Month" },
  { id: "THIS_QUARTER", label: "This Quarter" },
  { id: "YTD", label: "Year To Date (YTD)" },
];

export function ReportsClient({ initialData }: ReportsClientProps) {
  const [data, setData] = useState<any>(initialData);
  const [preset, setPreset] = useState<ReportDateFilter>("ALL");
  const [activeTab, setActiveTab] = useState<"revenue" | "expenses" | "pnl" | "payments" | "projects" | "clients">("revenue");
  const [isPending, startTransition] = useTransition();

  const fmt = (val: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(val);

  const handleFilterChange = (newPreset: ReportDateFilter) => {
    setPreset(newPreset);
    startTransition(async () => {
      const res = await getReportsData(newPreset);
      if (res.success && res.data) {
        setData(res.data);
        toast.info("Report Filter Applied", `Updated report view for ${newPreset.replace("_", " ")}.`);
      } else {
        toast.error("Error", "Failed to update report filter.");
      }
    });
  };

  // CSV Export Handler
  const exportCSV = () => {
    let filename = `orvynos-${activeTab}-report.csv`;
    let csvContent = "";

    if (activeTab === "revenue") {
      csvContent = "Receipt Number,Date,Client,Project,Amount (INR),Method,Reference\n";
      data.revenueItems.forEach((r: any) => {
        csvContent += `"${r.receiptNumber}","${new Date(r.date).toLocaleDateString("en-IN")}","${r.clientName}","${r.projectName}",${r.amount},"${r.method}","${r.reference}"\n`;
      });
    } else if (activeTab === "expenses") {
      csvContent = "Title,Category,Date,Project,Amount (INR)\n";
      data.expenseItems.forEach((e: any) => {
        csvContent += `"${e.title}","${e.category}","${new Date(e.date).toLocaleDateString("en-IN")}","${e.projectName}",${e.amount}\n`;
      });
    } else if (activeTab === "pnl") {
      csvContent = "Metric,Amount (INR)\n";
      csvContent += `"Total Revenue Generated",${data.summary.revenue}\n`;
      csvContent += `"Total Business Expenses",${data.summary.expenses}\n`;
      csvContent += `"Net Profit",${data.summary.netProfit}\n`;
      csvContent += `"Profit Margin %",${data.summary.profitMargin}%\n`;
    } else if (activeTab === "projects") {
      csvContent = "Project Name,Client,Status,Budget (INR),Collected (INR),Spent (INR),Profit (INR),Progress %\n";
      data.projectsReport.forEach((p: any) => {
        csvContent += `"${p.name}","${p.clientName}","${p.status}",${p.budget},${p.totalCollected},${p.totalSpent},${p.profit},${p.progress}%\n`;
      });
    } else if (activeTab === "clients") {
      csvContent = "Client Name,Total Projects,Active Projects,Total Contracted (INR),Total Paid (INR),Pending (INR)\n";
      data.clientsReport.forEach((c: any) => {
        csvContent += `"${c.name}",${c.totalProjects},${c.activeProjects},${c.totalContracted},${c.totalPaid},${c.pending}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    toast.success("CSV Downloaded", `Exported ${filename} successfully.`);
  };

  // JSON Export Handler
  const exportJSON = () => {
    let filename = `orvynos-${activeTab}-report.json`;
    let exportData = data;
    if (activeTab === "revenue") exportData = data.revenueItems;
    if (activeTab === "expenses") exportData = data.expenseItems;
    if (activeTab === "projects") exportData = data.projectsReport;
    if (activeTab === "clients") exportData = data.clientsReport;

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    toast.success("JSON Exported", `Saved ${filename} to downloads.`);
  };

  // Print PDF Report Handler
  const exportPrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6 font-sans select-none pb-10">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-surface-white border border-border/80 rounded-2xl p-4 md:p-5 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-orange animate-pulse" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-orange bg-brand-orange-tint px-2 py-0.5 rounded-md">
              Founders Executive Audit
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-text-primary mt-1">
            Financial &amp; Performance Reports
          </h1>
          <p className="text-xs text-text-secondary font-medium">
            Verified financial reports backed by <code className="text-brand-orange font-bold">finance.ts</code> single source of truth.
          </p>
        </div>

        {/* Date Filter & Export Tools */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-surface-page border border-border/80 rounded-xl px-3 py-1.5">
            <IconCalendar className="h-4 w-4 text-brand-orange" />
            <select
              value={preset}
              onChange={(e) => handleFilterChange(e.target.value as ReportDateFilter)}
              className="bg-transparent text-xs font-bold text-text-primary focus:outline-none cursor-pointer"
            >
              {PRESET_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Financial Summary Cards (finance.ts verified) */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="p-4 bg-surface-white border border-border/80 rounded-2xl flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-text-secondary tracking-wider block">
              Total Revenue
            </span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 leading-tight mt-1 block">
              {fmt(data.summary.revenue)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/30 shrink-0">
            <IconCurrencyRupee className="h-5 w-5" stroke={2.5} />
          </div>
        </div>

        {/* Total Expenses */}
        <div className="p-4 bg-surface-white border border-border/80 rounded-2xl flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-text-secondary tracking-wider block">
              Total Expenses
            </span>
            <span className="text-xl font-black text-rose-600 dark:text-rose-400 leading-tight mt-1 block">
              {fmt(data.summary.expenses)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 flex items-center justify-center border border-rose-100 dark:border-rose-900/30 shrink-0">
            <IconReceipt2 className="h-5 w-5" stroke={2} />
          </div>
        </div>

        {/* Net Profit */}
        <div className="p-4 bg-surface-white border border-border/80 rounded-2xl flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-text-secondary tracking-wider block">
              Net Operating Profit
            </span>
            <span className="text-xl font-black text-brand-orange leading-tight mt-1 block">
              {fmt(data.summary.netProfit)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-orange-tint text-brand-orange flex items-center justify-center border border-brand-orange/20 shrink-0">
            <IconTrendingUp className="h-5 w-5" stroke={2.5} />
          </div>
        </div>

        {/* Profit Margin */}
        <div className="p-4 bg-surface-white border border-border/80 rounded-2xl flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-text-secondary tracking-wider block">
              Net Profit Margin
            </span>
            <span className="text-xl font-black text-text-primary leading-tight mt-1 block">
              {data.summary.profitMargin}%
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/30 text-brand-orange flex items-center justify-center border border-orange-100 shrink-0">
            <IconSparkles className="h-5 w-5" stroke={2} />
          </div>
        </div>
      </div>

      {/* Tabs & Export Toolbar */}
      <div className="bg-surface-white border border-border/80 rounded-2xl p-4 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-3">
          {/* Tabs Navigation */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: "revenue", label: "Revenue", icon: IconCurrencyRupee },
              { id: "expenses", label: "Expenses", icon: IconReceipt2 },
              { id: "pnl", label: "Profit & Loss", icon: IconTrendingUp },
              { id: "payments", label: "Payments", icon: IconCreditCard },
              { id: "projects", label: "Projects", icon: IconBriefcase },
              { id: "clients", label: "Clients", icon: IconUsers },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap border ${
                  activeTab === tab.id
                    ? "bg-brand-orange text-white border-brand-orange shadow-2xs"
                    : "bg-surface-page text-text-secondary hover:text-text-primary border-border/60"
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Export Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={exportCSV}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-surface-page hover:bg-surface-white border border-border text-xs font-bold text-text-primary hover:border-brand-orange/40 transition-all cursor-pointer shadow-2xs"
              title="Export report tab as CSV"
            >
              <IconFileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button
              onClick={exportJSON}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-surface-page hover:bg-surface-white border border-border text-xs font-bold text-text-primary hover:border-brand-orange/40 transition-all cursor-pointer shadow-2xs"
              title="Export report tab as JSON"
            >
              <IconFileCode className="h-4 w-4 text-blue-600" />
              <span className="hidden sm:inline">JSON</span>
            </button>
            <button
              onClick={exportPrintPDF}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-brand-orange-tint text-brand-orange border border-brand-orange/30 hover:border-brand-orange text-xs font-extrabold transition-all cursor-pointer shadow-2xs"
              title="Print PDF report"
            >
              <IconPrinter className="h-4 w-4" />
              <span>Print PDF</span>
            </button>
          </div>
        </div>

        {/* Tab Content Display */}
        {activeTab === "revenue" && (
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-text-primary">Revenue Inflow Audit</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border/80 text-[10px] uppercase font-extrabold text-text-secondary tracking-wider">
                    <th className="py-2.5 px-3">Receipt No</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Client</th>
                    <th className="py-2.5 px-3">Project</th>
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3 text-right">Amount (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-medium text-text-primary">
                  {data.revenueItems.length > 0 ? (
                    data.revenueItems.map((r: any) => (
                      <tr key={r.id} className="hover:bg-surface-page/50 transition-colors">
                        <td className="py-2.5 px-3 font-extrabold text-brand-orange">{r.receiptNumber}</td>
                        <td className="py-2.5 px-3">{new Date(r.date).toLocaleDateString("en-IN")}</td>
                        <td className="py-2.5 px-3 font-bold">{r.clientName}</td>
                        <td className="py-2.5 px-3 text-text-secondary">{r.projectName}</td>
                        <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-surface-page border border-border text-[10px] font-bold">{r.method}</span></td>
                        <td className="py-2.5 px-3 text-right font-black text-emerald-600 dark:text-emerald-400">{fmt(r.amount)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-text-secondary font-medium">No revenue entries recorded for this filter.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "expenses" && (
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-text-primary">Expenses Breakdown</h3>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
              {data.expenseCategories.map((c: any) => (
                <div key={c.category} className="p-3 rounded-xl bg-surface-page border border-border/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-text-primary uppercase tracking-wider">{c.category}</span>
                  <span className="text-xs font-black text-rose-600">{fmt(c.amount)}</span>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border/80 text-[10px] uppercase font-extrabold text-text-secondary tracking-wider">
                    <th className="py-2.5 px-3">Title</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Project Link</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-medium text-text-primary">
                  {data.expenseItems.map((e: any) => (
                    <tr key={e.id} className="hover:bg-surface-page/50 transition-colors">
                      <td className="py-2.5 px-3 font-bold">{e.title}</td>
                      <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-rose-50 text-rose-600 text-[10px] font-bold border border-rose-200">{e.category}</span></td>
                      <td className="py-2.5 px-3">{new Date(e.date).toLocaleDateString("en-IN")}</td>
                      <td className="py-2.5 px-3 text-text-secondary">{e.projectName}</td>
                      <td className="py-2.5 px-3 text-right font-black text-rose-600">{fmt(e.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "pnl" && (
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-text-primary">Profit &amp; Loss Statement</h3>
            <div className="p-5 rounded-2xl border border-brand-orange/30 bg-gradient-to-br from-brand-orange-tint/40 via-surface-page to-surface-white space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <span className="text-xs font-bold text-text-primary">Gross Revenue Collected</span>
                <span className="text-base font-black text-emerald-600">{fmt(data.summary.revenue)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <span className="text-xs font-bold text-text-primary">Less Total Operating Expenses</span>
                <span className="text-base font-black text-rose-600">- {fmt(data.summary.expenses)}</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-sm font-black text-text-primary uppercase tracking-wider block">Net Operating Profit</span>
                  <span className="text-[10px] text-text-secondary font-bold">Margin: {data.summary.profitMargin}%</span>
                </div>
                <span className="text-2xl font-black text-brand-orange">{fmt(data.summary.netProfit)}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "projects" && (
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-text-primary">Project Financial Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border/80 text-[10px] uppercase font-extrabold text-text-secondary tracking-wider">
                    <th className="py-2.5 px-3">Project</th>
                    <th className="py-2.5 px-3">Client</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Budget</th>
                    <th className="py-2.5 px-3 text-right">Collected</th>
                    <th className="py-2.5 px-3 text-right">Spent</th>
                    <th className="py-2.5 px-3 text-right">Net Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-medium text-text-primary">
                  {data.projectsReport.map((p: any) => (
                    <tr key={p.id} className="hover:bg-surface-page/50 transition-colors">
                      <td className="py-2.5 px-3 font-extrabold">{p.name}</td>
                      <td className="py-2.5 px-3 text-text-secondary">{p.clientName}</td>
                      <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-brand-orange-tint text-brand-orange text-[10px] font-extrabold">{p.status}</span></td>
                      <td className="py-2.5 px-3 text-right font-bold">{fmt(p.budget)}</td>
                      <td className="py-2.5 px-3 text-right font-black text-emerald-600">{fmt(p.totalCollected)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-rose-600">{fmt(p.totalSpent)}</td>
                      <td className="py-2.5 px-3 text-right font-black text-brand-orange">{fmt(p.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(activeTab === "clients" || activeTab === "payments") && (
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-text-primary">Client Accounts Summary</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border/80 text-[10px] uppercase font-extrabold text-text-secondary tracking-wider">
                    <th className="py-2.5 px-3">Client Name</th>
                    <th className="py-2.5 px-3">Total Projects</th>
                    <th className="py-2.5 px-3">Active</th>
                    <th className="py-2.5 px-3 text-right">Contracted Value</th>
                    <th className="py-2.5 px-3 text-right">Total Paid</th>
                    <th className="py-2.5 px-3 text-right">Pending Billing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-medium text-text-primary">
                  {data.clientsReport.map((c: any) => (
                    <tr key={c.id} className="hover:bg-surface-page/50 transition-colors">
                      <td className="py-2.5 px-3 font-extrabold text-brand-orange">{c.name}</td>
                      <td className="py-2.5 px-3 font-bold">{c.totalProjects}</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-600">{c.activeProjects}</td>
                      <td className="py-2.5 px-3 text-right font-bold">{fmt(c.totalContracted)}</td>
                      <td className="py-2.5 px-3 text-right font-black text-emerald-600">{fmt(c.totalPaid)}</td>
                      <td className="py-2.5 px-3 text-right font-black text-rose-600">{fmt(c.pending)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

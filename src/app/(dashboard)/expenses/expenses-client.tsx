"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExpenseForm, ProjectOption } from "@/components/expenses/expense-form";
import { createExpense } from "./actions";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  IconPlus,
  IconSearch,
  IconReceipt,
  IconCalendar,
} from "@tabler/icons-react";
import { ExpenseCategory } from "@/generated/prisma/client";

export type ExpenseRow = {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number | any;
  date: Date | string;
  notes: string | null;
  projectId: string | null;
  project?: {
    id: string;
    name: string;
  } | null;
};

type ExpensesClientProps = {
  initialExpenses: ExpenseRow[];
  projects: ProjectOption[];
  metrics: {
    totalExpenses: number;
    categoryTotals: Record<string, number>;
  };
};

const getCategoryConfig = (category: ExpenseCategory) => {
  switch (category) {
    case ExpenseCategory.SOFTWARE:
      return {
        badge: "bg-blue-50/60 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-100/70 dark:border-blue-900/30",
        border: "border-l-[4px] border-l-blue-500",
        dot: "bg-blue-500",
      };
    case ExpenseCategory.HOSTING:
      return {
        badge: "bg-violet-50/60 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400 border border-violet-100/70 dark:border-violet-900/30",
        border: "border-l-[4px] border-l-violet-500",
        dot: "bg-violet-500",
      };
    case ExpenseCategory.DOMAINS:
      return {
        badge: "bg-purple-50/60 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400 border border-purple-100/70 dark:border-purple-900/30",
        border: "border-l-[4px] border-l-purple-500",
        dot: "bg-purple-500",
      };
    case ExpenseCategory.MARKETING:
      return {
        badge: "bg-amber-50/60 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-100/70 dark:border-amber-900/30",
        border: "border-l-[4px] border-l-amber-500",
        dot: "bg-amber-500",
      };
    case ExpenseCategory.OFFICE:
      return {
        badge: "bg-rose-50/60 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-100/70 dark:border-rose-900/30",
        border: "border-l-[4px] border-l-rose-500",
        dot: "bg-rose-500",
      };
    case ExpenseCategory.TRAVEL:
      return {
        badge: "bg-indigo-50/60 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 border border-indigo-100/70 dark:border-indigo-900/30",
        border: "border-l-[4px] border-l-indigo-500",
        dot: "bg-indigo-500",
      };
    case ExpenseCategory.TEAM_PAYMENTS:
      return {
        badge: "bg-emerald-50/60 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100/70 dark:border-emerald-900/30",
        border: "border-l-[4px] border-l-emerald-500",
        dot: "bg-emerald-500",
      };
    default:
      return {
        badge: "bg-stone-50/60 text-stone-600 dark:bg-stone-900/30 dark:text-stone-400 border border-stone-150 dark:border-stone-800",
        border: "border-l-[4px] border-l-stone-400",
        dot: "bg-stone-400",
      };
  }
};

export function ExpensesClient({
  initialExpenses,
  projects,
  metrics,
}: ExpensesClientProps) {
  const router = useRouter();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "PROJECT" | "BUSINESS">("ALL");
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleLogExpense = async (data: any) => {
    setErrorMsg("");
    startTransition(async () => {
      const result = await createExpense(data);
      if (result.success) {
        setIsSheetOpen(false);
        router.refresh();
      } else {
        setErrorMsg(result.error || "Failed to log expense.");
      }
    });
  };

  // Calculate dynamic totals based on project linkages
  const projectExpensesOnly = initialExpenses.filter((e) => e.projectId !== null);
  const businessExpensesOnly = initialExpenses.filter((e) => e.projectId === null);

  const totalProjectOutflows = projectExpensesOnly.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalBusinessOutflows = businessExpensesOnly.reduce((sum, e) => sum + Number(e.amount), 0);

  const filteredExpenses = initialExpenses.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.project?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.notes || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === "ALL" || e.category === selectedCategory;

    const expenseDate = new Date(e.date);
    const matchesStart = !startDateFilter || expenseDate >= new Date(startDateFilter);
    const matchesEnd = !endDateFilter || expenseDate <= new Date(endDateFilter + "T23:59:59");

    const matchesTab =
      activeTab === "ALL" ||
      (activeTab === "PROJECT" && e.projectId !== null) ||
      (activeTab === "BUSINESS" && e.projectId === null);

    return matchesSearch && matchesCategory && matchesStart && matchesEnd && matchesTab;
  });

  return (
    <div className="space-y-6 text-left">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-text-primary">Expenses Ledger</h1>
          <p className="text-sm md:text-[15px] text-text-secondary mt-1 font-medium">
            Keep track of where your agency's money is going. Filter, view, and document every cost.
          </p>
        </div>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger
            render={
              <Button className="font-bold text-xs bg-brand-orange hover:bg-brand-orange-hover text-white py-2.5 px-4 rounded-lg flex items-center gap-1.5 shadow-none border-0 min-h-[40px] cursor-pointer active:scale-[0.98] transition-all">
                <IconPlus className="h-4 w-4" />
                Log Expense
              </Button>
            }
          />
          <SheetContent className="w-full sm:max-w-[450px] p-6 bg-surface-white border-l border-border h-full flex flex-col justify-between overflow-y-auto">
            <div>
              <SheetHeader className="mb-6">
                <SheetTitle className="text-lg font-bold text-text-primary text-left">
                  Log Business Expense
                </SheetTitle>
                <SheetDescription className="text-xs text-text-secondary mt-1 text-left">
                  Log operational costs or project-specific expenditures.
                </SheetDescription>
              </SheetHeader>
              <ExpenseForm
                projects={projects}
                onSubmit={handleLogExpense}
                isPending={isPending}
                errorMsg={errorMsg}
                onCancel={() => setIsSheetOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Metrics Summary Area with Simple English Explanations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Total Outflows */}
        <div className="p-5 bg-surface-white border border-border rounded-xl flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center shrink-0 border border-rose-100 shadow-sm">
              <IconReceipt className="h-6 w-6" stroke={2} />
            </div>
            <div>
              <span className="text-[10px] md:text-[12px] font-extrabold uppercase text-text-secondary tracking-wider block">
                Total Outflows
              </span>
              <span className="text-2xl md:text-3xl font-black text-stone-900 mt-1 block">
                {formatCurrency(metrics.totalExpenses)}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border/60">
            <p className="text-[11px] md:text-xs text-stone-400 font-medium leading-relaxed">
              <strong>All Money Spent:</strong> The complete sum of all money paid out by your agency, combining both project work and general overhead costs.
            </p>
          </div>
        </div>

        {/* Metric 2: Project Work Costs */}
        <div className="p-5 bg-surface-white border border-border rounded-xl flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0 border border-emerald-100 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M5 19l2.757 -7.351a1 1 0 0 1 .936 -.649h12.307a1 1 0 0 1 .986 1.164l-.996 5.211a2 2 0 0 1 -1.972 1.625h-12.022a2 2 0 0 1 -2 -2z" />
                <path d="M5 14v-6a2 2 0 0 1 2 -2h3.586a1 1 0 0 1 .707 .293l2.414 2.414a1 1 0 0 0 .707 .293h3.586a2 2 0 0 1 2 2v2" />
              </svg>
            </div>
            <div>
              <span className="text-[10px] md:text-[12px] font-extrabold uppercase text-text-secondary tracking-wider block">
                Project Expenses
              </span>
              <span className="text-2xl md:text-3xl font-black text-stone-900 mt-1 block">
                {formatCurrency(totalProjectOutflows)}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border/60">
            <p className="text-[11px] md:text-xs text-stone-400 font-medium leading-relaxed">
              <strong>Client Work Costs:</strong> Expenses linked directly to specific projects, such as subcontractor payments, design assets, or custom APIs.
            </p>
          </div>
        </div>

        {/* Metric 3: Business Overhead Costs */}
        <div className="p-5 bg-surface-white border border-border rounded-xl flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0 border border-blue-100 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M3 21l18 0" />
                <path d="M9 21v-10a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v10" />
                <path d="M3 3l18 0" />
                <path d="M5 3v18" />
                <path d="M19 3v18" />
                <path d="M9 7l6 0" />
                <path d="M9 13l6 0" />
              </svg>
            </div>
            <div>
              <span className="text-[10px] md:text-[12px] font-extrabold uppercase text-text-secondary tracking-wider block">
                Business Overhead
              </span>
              <span className="text-2xl md:text-3xl font-black text-stone-900 mt-1 block">
                {formatCurrency(totalBusinessOutflows)}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border/60">
            <p className="text-[11px] md:text-xs text-stone-400 font-medium leading-relaxed">
              <strong>Overhead Costs:</strong> General operational costs required to run the agency itself, like server hosting, domain names, general marketing, and software.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs and Switchers - Redesigned Segmented Control Style */}
      <div className="space-y-4">
        <div className="bg-stone-100/80 p-1.5 rounded-xl flex w-full md:w-max gap-1 select-none">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`flex-1 md:flex-none px-5 py-2 font-bold text-xs md:text-sm rounded-lg cursor-pointer transition-all duration-200 whitespace-nowrap min-h-[36px] flex items-center justify-center gap-1.5 ${
              activeTab === "ALL"
                ? "bg-white text-brand-orange shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            All Expenses ({initialExpenses.length})
          </button>
          <button
            onClick={() => setActiveTab("PROJECT")}
            className={`flex-1 md:flex-none px-5 py-2 font-bold text-xs md:text-sm rounded-lg cursor-pointer transition-all duration-200 whitespace-nowrap min-h-[36px] flex items-center justify-center gap-1.5 ${
              activeTab === "PROJECT"
                ? "bg-white text-brand-orange shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Project Expenses ({projectExpensesOnly.length})
          </button>
          <button
            onClick={() => setActiveTab("BUSINESS")}
            className={`flex-1 md:flex-none px-5 py-2 font-bold text-xs md:text-sm rounded-lg cursor-pointer transition-all duration-200 whitespace-nowrap min-h-[36px] flex items-center justify-center gap-1.5 ${
              activeTab === "BUSINESS"
                ? "bg-white text-brand-orange shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Business Overhead ({businessExpensesOnly.length})
          </button>
        </div>

        {/* Lightweight Section Introduction Header in Simple English */}
        <div className="p-4 bg-stone-50 border border-border/80 rounded-xl shadow-inner-sm">
          {activeTab === "ALL" && (
            <p className="text-xs md:text-sm text-text-secondary font-medium leading-relaxed">
              💡 <strong>Overview:</strong> This ledger shows all expenses combined. Use the search bar below or change the tabs to view costs by specific category.
            </p>
          )}
          {activeTab === "PROJECT" && (
            <p className="text-xs md:text-sm text-text-secondary font-medium leading-relaxed">
              💡 <strong>Project Expenses:</strong> These are direct operational costs assigned to build client projects. Tracking this helps calculate your real project margins.
            </p>
          )}
          {activeTab === "BUSINESS" && (
            <p className="text-xs md:text-sm text-text-secondary font-medium leading-relaxed">
              💡 <strong>Business Overhead:</strong> These are the base expenses needed to keep Orvyn Labs running. This includes software, domain subscriptions, server fees, and office supplies.
            </p>
          )}
        </div>

        {/* Filter controls */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-2.5 h-4 w-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search expenses by title or project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-border bg-surface-white pl-9 pr-3 py-1 text-sm md:text-[15px] shadow-sm transition-all placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
            />
          </div>
          <div className="w-full md:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-border bg-surface-white px-3 py-1 text-sm md:text-[15px] shadow-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
            >
              <option value="ALL">All Categories</option>
              <option value={ExpenseCategory.SOFTWARE}>Software / Subscriptions</option>
              <option value={ExpenseCategory.HOSTING}>Server Hosting</option>
              <option value={ExpenseCategory.DOMAINS}>Domain Names</option>
              <option value={ExpenseCategory.MARKETING}>Marketing & Sales</option>
              <option value={ExpenseCategory.OFFICE}>Office Rent & Supplies</option>
              <option value={ExpenseCategory.TRAVEL}>Travel & Client Meetings</option>
              <option value={ExpenseCategory.TEAM_PAYMENTS}>Team Payments</option>
              <option value={ExpenseCategory.OTHER}>Other Business Expense</option>
            </select>
          </div>
        </div>

        {/* Date Filter */}
        <div className="flex flex-col sm:flex-row gap-3 items-center text-xs text-text-secondary">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <IconCalendar className="h-4 w-4 text-text-secondary" />
            <span className="font-semibold">Filter Date:</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="flex h-8 rounded-lg border border-border bg-surface-white px-2 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
            />
            <span>to</span>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="flex h-8 rounded-lg border border-border bg-surface-white px-2 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
            />
            {(startDateFilter || endDateFilter) && (
              <button
                onClick={() => {
                  setStartDateFilter("");
                  setEndDateFilter("");
                }}
                className="text-rose-500 font-bold hover:underline ml-2 cursor-pointer"
              >
                Clear Dates
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Card Layout - Premium Styling with Category Colors */}
      <div className="block md:hidden space-y-3 font-sans">
        {filteredExpenses.length === 0 ? (
          <div className="p-8 text-center text-text-secondary bg-surface-white border border-border rounded-xl font-semibold">
            No expenses found.
          </div>
        ) : (
          filteredExpenses.map((e) => {
            const catConf = getCategoryConfig(e.category);
            return (
              <div key={e.id} className={`p-4 bg-surface-white border border-border ${catConf.border} rounded-r-xl rounded-l-none space-y-3 shadow-sm hover:shadow-md transition-all`}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-text-secondary font-bold block">{formatDate(e.date)}</span>
                    <span className="font-bold text-stone-900 block mt-0.5 text-sm">{e.title}</span>
                    <span className="text-xs text-text-secondary block font-semibold mt-0.5">
                      {e.project?.name || <span className="text-stone-400 font-normal italic text-[11px]">General Overhead</span>}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-rose-600 block">{formatCurrency(Number(e.amount))}</span>
                    <span className={`inline-flex items-center gap-1 mt-1 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${catConf.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${catConf.dot}`} />
                      {e.category.replace(/_/g, " ").toLowerCase()}
                    </span>
                  </div>
                </div>
                
                {e.notes && (
                  <div className="pt-2 border-t border-dashed border-border text-xs text-text-secondary">
                    <span className="text-[10px] text-text-secondary uppercase font-extrabold tracking-wider block">Notes</span>
                    <p className="mt-0.5 text-stone-700 font-medium break-words leading-relaxed">{e.notes}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table Layout - Premium SaaS style layout with dynamic left indicators */}
      <div className="hidden md:block w-full overflow-hidden rounded-xl border border-border bg-surface-white font-sans shadow-sm">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/70 border-b border-border text-[10px] md:text-xs font-extrabold text-text-secondary uppercase tracking-wider">
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Title / Description</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Linked Project</th>
                <th className="px-5 py-3.5">Notes</th>
                <th className="px-5 py-3.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-sm text-text-primary">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-text-secondary font-semibold">
                    No expenses found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((e) => {
                  const catConf = getCategoryConfig(e.category);
                  return (
                    <tr key={e.id} className="group hover:bg-stone-50/40 transition-colors">
                      {/* Left border highlight effect on row hover */}
                      <td className={`px-5 py-4 text-sm md:text-[15px] font-semibold whitespace-nowrap ${catConf.border} border-l-0 group-hover:border-l-[4px] transition-all`}>
                        {formatDate(e.date)}
                      </td>
                      <td className="px-5 py-4 text-sm md:text-[15.5px] font-bold text-stone-900 whitespace-nowrap">
                        {e.title}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-[10px] md:text-[11.5px] font-extrabold uppercase px-2 py-0.5 rounded-full ${catConf.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${catConf.dot}`} />
                          {e.category.replace(/_/g, " ").toLowerCase()}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm md:text-[14.5px] font-semibold text-text-secondary whitespace-nowrap">
                        {e.project?.name ? (
                          <span className="inline-flex items-center gap-1.5 text-stone-800">
                            {/* Modern direct SVG folder icon */}
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-brand-orange/60" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                              <path d="M5 4h4l3 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2" />
                            </svg>
                            {e.project.name}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 bg-stone-100 text-stone-500 font-medium rounded text-[11px] md:text-xs border border-stone-200/50">
                            General Overhead
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs md:text-sm text-text-secondary max-w-xs overflow-hidden text-ellipsis whitespace-nowrap font-medium italic">
                        {e.notes || <span className="text-stone-300 font-normal not-italic">—</span>}
                      </td>
                      <td className="px-5 py-4 text-right font-black text-rose-600 whitespace-nowrap text-base md:text-lg">
                        {formatCurrency(Number(e.amount))}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

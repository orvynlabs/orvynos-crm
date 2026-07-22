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
  IconBriefcase,
  IconBuildingStore,
  IconX,
} from "@tabler/icons-react";
import { ExpenseCategory } from "@/lib/enums";

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
        badge: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40",
        dot: "bg-blue-500",
      };
    case ExpenseCategory.HOSTING:
      return {
        badge: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400 border border-violet-200/60 dark:border-violet-900/40",
        dot: "bg-violet-500",
      };
    case ExpenseCategory.DOMAINS:
      return {
        badge: "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200/60 dark:border-purple-900/40",
        dot: "bg-purple-500",
      };
    case ExpenseCategory.MARKETING:
      return {
        badge: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40",
        dot: "bg-amber-500",
      };
    case ExpenseCategory.OFFICE:
      return {
        badge: "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40",
        dot: "bg-rose-500",
      };
    case ExpenseCategory.TRAVEL:
      return {
        badge: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/40",
        dot: "bg-indigo-500",
      };
    case ExpenseCategory.TEAM_PAYMENTS:
      return {
        badge: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40",
        dot: "bg-emerald-500",
      };
    default:
      return {
        badge: "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300 border border-stone-200 dark:border-stone-700",
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
    <div className="w-full max-w-full space-y-4 text-left font-sans overflow-x-hidden">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-lg md:text-xl font-bold tracking-tight text-text-primary">Expenses</h1>
          <p className="text-[11px] text-text-secondary mt-0.5 font-medium">
            Monitor agency expenditures and project-related outflows.
          </p>
        </div>

        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger
            render={
              <Button className="font-bold text-xs bg-brand-orange hover:bg-brand-orange-hover text-white py-1.5 px-3.5 rounded-lg flex items-center gap-1.5 shadow-2xs border-0 h-8 cursor-pointer active:scale-[0.98] transition-all">
                <IconPlus className="h-3.5 w-3.5" />
                Log Expense
              </Button>
            }
          />
          <SheetContent className="w-full sm:max-w-[420px] p-5 bg-surface-white border-l border-border h-full flex flex-col justify-between overflow-y-auto">
            <div>
              <SheetHeader className="mb-4">
                <SheetTitle className="text-base font-bold text-text-primary text-left">
                  Log Business Expense
                </SheetTitle>
                <SheetDescription className="text-xs text-text-secondary mt-0.5 text-left">
                  Record operational costs or project expenditures.
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

      {/* Responsive Metrics Summary Cards */}
      <div className="flex overflow-x-auto sm:grid sm:grid-cols-3 gap-2.5 pb-0.5 snap-x scrollbar-none max-w-full">
        {/* Metric 1: Total Money Spent */}
        <div className="min-w-[220px] sm:min-w-0 flex-1 shrink-0 sm:shrink snap-start p-3 sm:p-3.5 bg-surface-white border border-border rounded-xl flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-rose-50 dark:bg-rose-950/30 text-rose-600 rounded-lg flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900/30">
                <IconReceipt className="h-4 w-4" stroke={2} />
              </div>
              <div>
                <span className="text-[10px] sm:text-[11px] font-bold uppercase text-text-secondary tracking-wider block">
                  Total Money Spent
                </span>
                <span className="text-base sm:text-lg md:text-xl font-black text-stone-900 dark:text-stone-100 leading-tight">
                  {formatCurrency(metrics.totalExpenses)}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-text-secondary bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md">
              {initialExpenses.length} entries
            </span>
          </div>
          <p className="text-[10px] text-text-secondary font-medium mt-1.5 pt-1.5 border-t border-border/40">
            Total of all agency &amp; project expenses combined.
          </p>
        </div>

        {/* Metric 2: Client Project Costs */}
        <div className="min-w-[220px] sm:min-w-0 flex-1 shrink-0 sm:shrink snap-start p-3 sm:p-3.5 bg-surface-white border border-border rounded-xl flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-lg flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/30">
                <IconBriefcase className="h-4 w-4" stroke={2} />
              </div>
              <div>
                <span className="text-[10px] sm:text-[11px] font-bold uppercase text-text-secondary tracking-wider block">
                  Client Project Costs
                </span>
                <span className="text-base sm:text-lg md:text-xl font-black text-stone-900 dark:text-stone-100 leading-tight">
                  {formatCurrency(totalProjectOutflows)}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200/50">
              {projectExpensesOnly.length} linked
            </span>
          </div>
          <p className="text-[10px] text-text-secondary font-medium mt-1.5 pt-1.5 border-t border-border/40">
            Costs directly assigned to build client projects.
          </p>
        </div>

        {/* Metric 3: Company Expenses */}
        <div className="min-w-[220px] sm:min-w-0 flex-1 shrink-0 sm:shrink snap-start p-3 sm:p-3.5 bg-surface-white border border-border rounded-xl flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-50 dark:bg-blue-950/30 text-blue-600 rounded-lg flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/30">
                <IconBuildingStore className="h-4 w-4" stroke={2} />
              </div>
              <div>
                <span className="text-[10px] sm:text-[11px] font-bold uppercase text-text-secondary tracking-wider block">
                  Company Expenses
                </span>
                <span className="text-base sm:text-lg md:text-xl font-black text-stone-900 dark:text-stone-100 leading-tight">
                  {formatCurrency(totalBusinessOutflows)}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md border border-blue-200/50">
              {businessExpensesOnly.length} company
            </span>
          </div>
          <p className="text-[10px] text-text-secondary font-medium mt-1.5 pt-1.5 border-t border-border/40">
            Software, tools, domains, travel, food &amp; team costs.
          </p>
        </div>
      </div>

      {/* Control Toolbar: Tabs, Search, Category, Date */}
      <div className="p-3 bg-surface-white border border-border rounded-xl space-y-2.5 shadow-2xs max-w-full">
        <div className="flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-center justify-between">
          {/* Segmented Tab Controls */}
          <div className="bg-surface-page p-1 rounded-lg flex gap-1 select-none overflow-x-auto scrollbar-none w-full lg:w-auto shrink-0 border border-border/60">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`flex-1 lg:flex-none px-3 py-1 font-extrabold text-[11px] rounded-md cursor-pointer transition-all whitespace-nowrap ${
                activeTab === "ALL"
                  ? "bg-surface-white text-brand-orange shadow-2xs"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              All ({initialExpenses.length})
            </button>
            <button
              onClick={() => setActiveTab("PROJECT")}
              className={`flex-1 lg:flex-none px-3 py-1 font-extrabold text-[11px] rounded-md cursor-pointer transition-all whitespace-nowrap ${
                activeTab === "PROJECT"
                  ? "bg-surface-white text-brand-orange shadow-2xs"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Project ({projectExpensesOnly.length})
            </button>
            <button
              onClick={() => setActiveTab("BUSINESS")}
              className={`flex-1 lg:flex-none px-3 py-1 font-extrabold text-[11px] rounded-md cursor-pointer transition-all whitespace-nowrap ${
                activeTab === "BUSINESS"
                  ? "bg-surface-white text-brand-orange shadow-2xs"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Company ({businessExpensesOnly.length})
            </button>
          </div>

          {/* Search Bar & Category Filter */}
          <div className="flex flex-col sm:flex-row flex-1 gap-2 w-full">
            <div className="relative flex-1 w-full">
              <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-secondary" />
              <input
                type="text"
                placeholder="Search title, project, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 rounded-lg border border-border bg-surface-page pl-8 pr-3 text-base sm:text-[11px] shadow-2xs transition-all placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-auto h-8 rounded-lg border border-border bg-surface-page px-2.5 text-[11px] shadow-2xs transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-bold cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value={ExpenseCategory.SOFTWARE}>Software / Subscriptions — Company</option>
              <option value={ExpenseCategory.HOSTING}>Server Hosting — Project / Company</option>
              <option value={ExpenseCategory.DOMAINS}>Domain Names — Project / Company</option>
              <option value={ExpenseCategory.MARKETING}>Marketing &amp; Sales — Company</option>
              <option value={ExpenseCategory.OFFICE}>Office, Food &amp; Supplies — Company</option>
              <option value={ExpenseCategory.TRAVEL}>Travel &amp; Meetings — Company</option>
              <option value={ExpenseCategory.TEAM_PAYMENTS}>Team Payments — Company</option>
              <option value={ExpenseCategory.OTHER}>Other Business Expense — Company</option>
            </select>
          </div>
        </div>

        {/* Date Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-text-secondary pt-2 border-t border-border/50">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 font-bold text-text-primary">
              <IconCalendar className="h-3.5 w-3.5 text-brand-orange" />
              <span>Date Range:</span>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                className="h-7 rounded-lg border border-border bg-surface-page px-2 text-[11px] font-semibold shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange cursor-pointer"
              />
              <span className="text-text-secondary font-medium">to</span>
              <input
                type="date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                className="h-7 rounded-lg border border-border bg-surface-page px-2 text-[11px] font-semibold shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange cursor-pointer"
              />
            </div>
          </div>

          {(startDateFilter || endDateFilter || searchQuery || selectedCategory !== "ALL" || activeTab !== "ALL") && (
            <button
              onClick={() => {
                setStartDateFilter("");
                setEndDateFilter("");
                setSearchQuery("");
                setSelectedCategory("ALL");
                setActiveTab("ALL");
              }}
              className="text-[10.5px] font-bold text-brand-orange hover:text-brand-orange-hover hover:underline transition-colors cursor-pointer ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Mobile Touch-Friendly Card View (< 768px) */}
      <div className="block md:hidden space-y-2.5 font-sans">
        {filteredExpenses.length === 0 ? (
          <div className="p-6 text-center text-xs md:text-sm text-text-secondary bg-surface-white border border-border rounded-xl font-medium">
            No expenses found matching filters.
          </div>
        ) : (
          filteredExpenses.map((e) => {
            const catConf = getCategoryConfig(e.category);
            return (
              <div
                key={e.id}
                className="p-3.5 bg-surface-white border border-border rounded-xl space-y-2 shadow-xs hover:border-brand-orange/40 transition-colors"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <span className="text-xs md:text-sm font-bold text-stone-900 dark:text-stone-100 block truncate">
                      {e.title}
                    </span>
                    <span className="text-xs text-text-secondary font-medium block">
                      {formatDate(e.date)}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold text-rose-600 dark:text-rose-400 block">
                      {formatCurrency(Number(e.amount))}
                    </span>
                    <span className={`inline-flex items-center gap-1 mt-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                      e.projectId
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50"
                        : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${e.projectId ? "bg-emerald-500" : "bg-blue-500"}`} />
                      {e.projectId ? "Client Project Cost" : "Company Expense"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs text-text-secondary">
                  <span className="font-medium">
                    {e.project?.name ? (
                      <span className="text-stone-800 dark:text-stone-200 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-orange shrink-0" />
                        <span className="truncate max-w-[150px]">{e.project.name}</span>
                      </span>
                    ) : (
                      <span className="text-stone-400 italic font-normal">Company Expense</span>
                    )}
                  </span>
                  {e.notes && (
                    <span className="text-xs text-text-secondary truncate max-w-[140px] font-normal italic">
                      {e.notes}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Compact Table View (>= 768px) */}
      <div className="hidden md:block w-full max-w-full rounded-xl border border-border bg-surface-white font-sans shadow-2xs overflow-hidden">
        <table className="w-full text-left border-collapse table-auto">
          <thead>
            <tr className="bg-stone-50/80 dark:bg-stone-900/40 border-b border-border text-[10.5px] font-black text-text-secondary uppercase tracking-wider">
              <th className="px-3.5 py-2.5 w-[110px]">Date</th>
              <th className="px-3.5 py-2.5">Title / Description</th>
              <th className="px-3.5 py-2.5 w-[150px]">Category</th>
              <th className="px-3.5 py-2.5 w-[160px]">Linked Project</th>
              <th className="px-3.5 py-2.5">Notes</th>
              <th className="px-3.5 py-2.5 text-right w-[110px]">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-xs text-text-primary">
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3.5 py-6 text-center text-text-secondary font-medium">
                  No expenses match the selected filters.
                </td>
              </tr>
            ) : (
              filteredExpenses.map((e) => {
                const catConf = getCategoryConfig(e.category);
                return (
                  <tr key={e.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                    <td className="px-3.5 py-2.5 font-semibold text-text-secondary text-[11px] whitespace-nowrap">
                      {formatDate(e.date)}
                    </td>
                    <td className="px-3.5 py-2.5 font-bold text-stone-900 dark:text-stone-100 text-xs">
                      {e.title}
                    </td>
                    <td className="px-3.5 py-2.5">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-1 rounded-lg border w-fit ${
                        e.projectId
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50"
                          : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${e.projectId ? "bg-emerald-500" : "bg-blue-500"}`} />
                        {e.projectId ? "Client Project Cost" : "Company Expense"}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 text-xs font-semibold text-text-secondary">
                      {e.project?.name ? (
                        <span className="inline-flex items-center gap-1 text-stone-800 dark:text-stone-200 font-bold truncate max-w-[150px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-orange shrink-0" />
                          <span className="truncate">{e.project.name}</span>
                        </span>
                      ) : (
                        <span className="text-stone-400 dark:text-stone-500 font-normal italic text-[11px]">
                          Company Expense
                        </span>
                      )}
                    </td>
                    <td className="px-3.5 py-2.5 text-xs text-text-secondary max-w-[200px] truncate font-normal">
                      {e.notes || <span className="text-stone-300 dark:text-stone-600">—</span>}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-black text-rose-600 dark:text-rose-400 text-xs whitespace-nowrap">
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
  );
}

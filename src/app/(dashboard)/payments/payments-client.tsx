"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PaymentHistoryTable, PaymentRow } from "@/components/payments/payment-history-table";
import { PaymentForm, ProjectSelectOption } from "@/components/payments/payment-form";
import { createPayment } from "./actions";
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
  IconDownload, 
  IconArrowDownLeft, 
  IconArrowUpRight 
} from "@tabler/icons-react";
import { PaymentMethod } from "@/lib/enums";

type PaymentsClientProps = {
  initialPayments: PaymentRow[];
  projects: ProjectSelectOption[];
  metrics: {
    thisMonthRevenue: number;
    thisMonthExpenses: number;
    overallRevenue: number;
    overallExpenses: number;
  };
};

export function PaymentsClient({
  initialPayments,
  projects,
  metrics,
}: PaymentsClientProps) {
  const router = useRouter();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string>("ALL");
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleRecordPayment = async (data: any) => {
    setErrorMsg("");
    startTransition(async () => {
      const result = await createPayment(data);
      if (result.success) {
        setIsSheetOpen(false);
        router.refresh();
      } else {
        setErrorMsg(result.error || "Failed to log payment.");
      }
    });
  };

  const filteredPayments = initialPayments.filter((p) => {
    const matchesSearch =
      (p.client?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.project?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.receiptNumber || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesMethod = selectedMethod === "ALL" || p.method === selectedMethod;

    return matchesSearch && matchesMethod;
  });

  return (
    <div className="space-y-6 font-sans text-text-primary select-none pb-12">
      {/* 🚀 Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-white border border-border/80 rounded-2xl p-4 md:p-5 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-md">
              Finance & Inflows
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-text-primary mt-1">
            Payments & Financial Inflows
          </h1>
          <p className="text-xs text-text-secondary font-medium">
            Timeline of incoming client payments, milestone receipts, and financial records.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 no-print">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger
              render={
                <Button className="font-bold text-xs bg-brand-orange hover:bg-brand-orange-hover text-white py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-xs border-0 h-10 cursor-pointer active:scale-95 transition-all">
                  <IconPlus className="h-4 w-4" stroke={2.5} />
                  <span>Add Payment</span>
                </Button>
              }
            />
            <SheetContent className="w-full sm:max-w-[420px] p-5 bg-surface-white border-l border-border h-full flex flex-col justify-between overflow-y-auto">
              <div>
                <SheetHeader className="mb-4">
                  <SheetTitle className="text-base font-bold text-text-primary text-left">
                    Record Client Payment
                  </SheetTitle>
                  <SheetDescription className="text-xs text-text-secondary mt-0.5 text-left">
                    Log a payment received from a client for a project milestone.
                  </SheetDescription>
                </SheetHeader>
                <PaymentForm
                  projects={projects}
                  onSubmit={handleRecordPayment}
                  isPending={isPending}
                  errorMsg={errorMsg}
                  onCancel={() => setIsSheetOpen(false)}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Metrics Section: 4 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: This Month Received */}
        <div className="p-4 bg-surface-white border border-border/80 rounded-2xl flex flex-col justify-between shadow-2xs hover:border-brand-orange/30 transition-all select-none">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-text-secondary tracking-wider block">
                This Month Received
              </span>
              <span className="text-lg md:text-xl font-black text-emerald-600 leading-tight mt-1 block">
                {formatCurrency(metrics.thisMonthRevenue)}
              </span>
            </div>
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/30 shadow-3xs">
              <IconArrowDownLeft className="h-5 w-5 stroke-[2.2]" />
            </div>
          </div>
          <p className="text-[11px] text-text-secondary font-medium mt-3 pt-2.5 border-t border-border/50">
            Client payments collected this month.
          </p>
        </div>

        {/* Metric 2: This Month Expenses */}
        <div className="p-4 bg-surface-white border border-border/80 rounded-2xl flex flex-col justify-between shadow-2xs hover:border-brand-orange/30 transition-all select-none">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-text-secondary tracking-wider block">
                This Month Expenses
              </span>
              <span className="text-lg md:text-xl font-black text-rose-600 leading-tight mt-1 block">
                {formatCurrency(metrics.thisMonthExpenses)}
              </span>
            </div>
            <div className="w-10 h-10 bg-rose-50 dark:bg-rose-950/30 text-rose-600 rounded-xl flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900/30 shadow-3xs">
              <IconArrowUpRight className="h-5 w-5 stroke-[2.2]" />
            </div>
          </div>
          <p className="text-[11px] text-text-secondary font-medium mt-3 pt-2.5 border-t border-border/50">
            Team payouts &amp; overhead spent this month.
          </p>
        </div>

        {/* Metric 3: Total Collected */}
        <div className="p-4 bg-surface-white border border-border/80 rounded-2xl flex flex-col justify-between shadow-2xs hover:border-brand-orange/30 transition-all select-none">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-text-secondary tracking-wider block">
                Total Collected
              </span>
              <span className="text-lg md:text-xl font-black text-text-primary leading-tight mt-1 block">
                {formatCurrency(metrics.overallRevenue)}
              </span>
            </div>
            <div className="w-10 h-10 bg-surface-page text-brand-orange rounded-xl flex items-center justify-center shrink-0 border border-border/60 shadow-3xs">
              <IconArrowDownLeft className="h-5 w-5 stroke-[2.2]" />
            </div>
          </div>
          <p className="text-[11px] text-text-secondary font-medium mt-3 pt-2.5 border-t border-border/50">
            Total revenue collected from all projects.
          </p>
        </div>

        {/* Metric 4: Total Money Spent */}
        <div className="p-4 bg-surface-white border border-border/80 rounded-2xl flex flex-col justify-between shadow-2xs hover:border-brand-orange/30 transition-all select-none">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-text-secondary tracking-wider block">
                Total Money Spent
              </span>
              <span className="text-lg md:text-xl font-black text-text-primary leading-tight mt-1 block">
                {formatCurrency(metrics.overallExpenses)}
              </span>
            </div>
            <div className="w-10 h-10 bg-surface-page text-text-secondary rounded-xl flex items-center justify-center shrink-0 border border-border/60 shadow-3xs">
              <IconArrowUpRight className="h-5 w-5 stroke-[2.2]" />
            </div>
          </div>
          <p className="text-[11px] text-text-secondary font-medium mt-3 pt-2.5 border-t border-border/50">
            Total of all business &amp; project expenses to date.
          </p>
        </div>
      </div>

      {/* 🔍 Search & Method Filter Toolbar */}
      <div className="bg-surface-white border border-border/80 rounded-2xl p-3.5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
        <div className="relative w-full sm:w-64 transition-all duration-300 focus-within:sm:w-72">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Search client, project, or receipt..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 h-9 bg-surface-page border border-border/80 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-orange"
          />
        </div>

        {/* Payment Method Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar py-0.5">
          {[
            { label: "All Methods", value: "ALL" },
            { label: "Bank Transfer", value: PaymentMethod.BANK_TRANSFER },
            { label: "UPI", value: PaymentMethod.UPI },
            { label: "Cash", value: PaymentMethod.CASH },
            { label: "Cheque", value: PaymentMethod.CHEQUE },
            { label: "Card", value: PaymentMethod.CARD },
            { label: "Other", value: PaymentMethod.OTHER },
          ].map((method) => (
            <button
              key={method.value}
              onClick={() => setSelectedMethod(method.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
                selectedMethod === method.value
                  ? "bg-brand-orange text-white shadow-xs font-black"
                  : "bg-surface-page text-text-secondary hover:text-text-primary"
              }`}
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              {method.label}
            </button>
          ))}
        </div>
      </div>

      <PaymentHistoryTable payments={filteredPayments} />
    </div>
  );
}

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
import { PaymentMethod } from "@/generated/prisma/client";

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
    <div className="space-y-6 text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-stone-900">Payments</h1>
          <p className="text-sm md:text-[15px] text-stone-500 mt-1">
            All incoming client payments and outgoing team or business payouts in one timeline
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto shrink-0 no-print">

          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger
              render={
                <Button className="font-bold text-xs bg-brand-orange hover:bg-brand-orange-hover text-white py-2.5 px-4 rounded-lg flex items-center justify-center gap-1.5 shadow-none border-0 min-h-[40px] flex-1 md:flex-none md:w-auto cursor-pointer">
                  <IconPlus className="h-4 w-4" />
                  Add Payment
                </Button>
              }
            />
            <SheetContent className="w-full sm:max-w-[450px] p-6 bg-surface-white border-l border-border h-full flex flex-col justify-between overflow-y-auto">
              <div>
                <SheetHeader className="mb-6">
                  <SheetTitle className="text-lg font-bold text-text-primary text-left">
                    Record Client Payment
                  </SheetTitle>
                  <SheetDescription className="text-xs text-text-secondary mt-1 text-left">
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: This Month Payments */}
        <div className="p-4 bg-surface-white border border-border rounded-xl flex items-center justify-between gap-3 shadow-sm hover:shadow-md transition-shadow duration-200 animate-fade-in">
          <div>
            <span className="text-[10px] md:text-[13px] font-bold uppercase text-stone-500 tracking-wider block">
              This month
            </span>
            <span className="text-lg sm:text-xl lg:text-3xl font-black text-stone-900 mt-0.5 block">
              {formatCurrency(metrics.thisMonthRevenue)}
            </span>
            <span className="text-[9px] md:text-xs text-stone-400 font-medium mt-0.5 block">
              Client payments received this month
            </span>
          </div>
          <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0 border border-emerald-100/50">
            <IconArrowDownLeft className="h-4.5 w-4.5" />
          </div>
        </div>

        {/* Metric 2: Total Expenses (This Month) */}
        <div className="p-4 bg-surface-white border border-border rounded-xl flex items-center justify-between gap-3 shadow-sm hover:shadow-md transition-shadow duration-200 animate-fade-in">
          <div>
            <span className="text-[10px] md:text-[13px] font-bold uppercase text-stone-500 tracking-wider block">
              Expenses (month)
            </span>
            <span className="text-lg sm:text-xl lg:text-3xl font-black text-stone-900 mt-0.5 block">
              {formatCurrency(metrics.thisMonthExpenses)}
            </span>
            <span className="text-[9px] md:text-xs text-stone-400 font-medium mt-0.5 block">
              Team salaries, tools & business costs
            </span>
          </div>
          <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center shrink-0 border border-amber-100/50">
            <IconArrowUpRight className="h-4.5 w-4.5" />
          </div>
        </div>

        {/* Metric 3: Overall client payments received */}
        <div className="p-4 bg-surface-white border border-border rounded-xl flex items-center justify-between gap-3 shadow-sm hover:shadow-md transition-shadow duration-200 animate-fade-in">
          <div>
            <span className="text-[10px] md:text-[13px] font-bold uppercase text-stone-500 tracking-wider block">
              Total collected
            </span>
            <span className="text-lg sm:text-xl lg:text-3xl font-black text-stone-900 mt-0.5 block">
              {formatCurrency(metrics.overallRevenue)}
            </span>
            <span className="text-[9px] md:text-xs text-stone-400 font-medium mt-0.5 block">
              All-time revenue from all clients
            </span>
          </div>
          <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0 border border-emerald-100/50">
            <IconArrowDownLeft className="h-4.5 w-4.5" />
          </div>
        </div>

        {/* Metric 4: Total Expenses */}
        <div className="p-4 bg-surface-white border border-border rounded-xl flex items-center justify-between gap-3 shadow-sm hover:shadow-md transition-shadow duration-200 animate-fade-in">
          <div>
            <span className="text-[10px] md:text-[13px] font-bold uppercase text-stone-500 tracking-wider block">
              Total expenses
            </span>
            <span className="text-lg sm:text-xl lg:text-3xl font-black text-stone-900 mt-0.5 block">
              {formatCurrency(metrics.overallExpenses)}
            </span>
            <span className="text-[9px] md:text-xs text-stone-400 font-medium mt-0.5 block">
              All-time business outgoings
            </span>
          </div>
          <div className="w-9 h-9 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center shrink-0 border border-purple-100/50">
            <IconArrowUpRight className="h-4.5 w-4.5" />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 no-print">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-3 h-4 w-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Search by client, project, or receipt number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-border bg-surface-white pl-9 pr-3 py-1 text-sm md:text-[15px] shadow-sm transition-colors placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold animate-fade-in"
          />
        </div>
        <div className="w-full md:w-48">
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-border bg-surface-white px-3 py-1 text-sm md:text-[15px] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
          >
            <option value="ALL">All Methods</option>
            <option value={PaymentMethod.BANK_TRANSFER}>Bank Transfer</option>
            <option value={PaymentMethod.UPI}>UPI</option>
            <option value={PaymentMethod.CASH}>Cash</option>
            <option value={PaymentMethod.CHEQUE}>Cheque</option>
            <option value={PaymentMethod.CARD}>Card</option>
            <option value={PaymentMethod.OTHER}>Other</option>
          </select>
        </div>
      </div>

      <PaymentHistoryTable payments={filteredPayments} />
    </div>
  );
}

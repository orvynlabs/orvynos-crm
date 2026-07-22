"use client";

import { useState } from "react";
import Link from "next/link";
import {
  IconCheck,
  IconTrash,
  IconAlertCircle,
  IconCurrencyRupee,
  IconCalendar,
  IconCreditCard,
  IconBriefcase,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

export type TeamPaymentItem = {
  id: string;
  amount: number;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  method: string | null;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
  projectId: string | null;
  projectName: string | null;
};

type TeamPaymentHistoryTableProps = {
  payments: TeamPaymentItem[];
  onMarkPaid?: (paymentId: string) => void;
  onDelete?: (paymentId: string) => void;
  isPending?: boolean;
};

export function TeamPaymentHistoryTable({
  payments,
  onMarkPaid,
  onDelete,
  isPending = false,
}: TeamPaymentHistoryTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (payments.length === 0) {
    return (
      <div className="bg-surface-white border border-border rounded-xl p-8 text-center space-y-2">
        <div className="w-10 h-10 rounded-full bg-surface-page text-text-secondary flex items-center justify-center mx-auto border border-border">
          <IconCurrencyRupee className="h-5 w-5 text-stone-400" />
        </div>
        <p className="text-sm font-bold text-text-primary">No payout records found</p>
        <p className="text-xs text-text-secondary">
          No internal payouts or pending amounts logged for this team member yet.
        </p>
      </div>
    );
  }

  const formatPaymentMethod = (method: string | null) => {
    if (!method) return "—";
    switch (method) {
      case "BANK_TRANSFER":
        return "Bank Transfer";
      case "UPI":
        return "UPI";
      case "CASH":
        return "Cash";
      case "CHEQUE":
        return "Cheque";
      case "CARD":
        return "Card";
      default:
        return method;
    }
  };

  const totalCompleted = payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPending = payments
    .filter((p) => p.status === "PENDING")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-4 font-sans">
      {/* Table summary row */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-page border border-border rounded-xl p-3.5 text-xs font-bold">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-text-secondary uppercase text-[10px] tracking-wider block">Total Paid Out</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
              ₹{totalCompleted.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="h-6 w-px bg-border" />
          <div>
            <span className="text-text-secondary uppercase text-[10px] tracking-wider block">Total Pending</span>
            <span className="text-amber-600 dark:text-amber-400 font-extrabold text-sm">
              ₹{totalPending.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
        <span className="text-text-secondary text-[11px] font-semibold">
          {payments.length} payout entry{payments.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Payouts list container */}
      <div className="bg-surface-white border border-border rounded-xl overflow-hidden shadow-xs">
        {/* MOBILE CARD VIEW */}
        <div className="block md:hidden divide-y divide-border/60">
          {payments.map((p) => {
            const isCompleted = p.status === "COMPLETED";
            const displayDate = p.paidAt
              ? new Date(p.paidAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : new Date(p.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });

            return (
              <div key={p.id} className="p-3.5 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold text-stone-500 block">{displayDate}</span>
                    {p.projectId && p.projectName ? (
                      <Link
                        href={`/projects/${p.projectId}`}
                        className="text-brand-orange hover:underline font-bold text-xs flex items-center gap-1 mt-0.5"
                      >
                        <IconBriefcase className="h-3.5 w-3.5 shrink-0 text-text-secondary" />
                        <span className="truncate max-w-[180px]">{p.projectName}</span>
                      </Link>
                    ) : (
                      <span className="text-xs text-text-secondary/70 italic">—</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-black text-sm text-text-primary block">
                      ₹{p.amount.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[10px] font-semibold text-text-secondary capitalize">
                      {formatPaymentMethod(p.method)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
                  <div>
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/50">
                        <IconCheck className="h-3 w-3" /> Paid Out
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/50">
                        <IconAlertCircle className="h-3 w-3" /> Pending Owed
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!isCompleted && onMarkPaid && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => onMarkPaid(p.id)}
                        className="h-7 text-[11px] font-bold px-2 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                      >
                        Mark Paid
                      </Button>
                    )}
                    {onDelete && (
                      <button
                        disabled={isPending}
                        onClick={() => onDelete(p.id)}
                        className="p-1 hover:bg-rose-50 text-stone-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                      >
                        <IconTrash className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* DESKTOP TABLE VIEW */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-page border-b border-border text-[10px] uppercase font-extrabold text-text-secondary tracking-wider select-none">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Project Link</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Amount (₹)</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-semibold text-text-primary">
              {payments.map((p) => {
                const isCompleted = p.status === "COMPLETED";
                const displayDate = p.paidAt
                  ? new Date(p.paidAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : new Date(p.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    });

                return (
                  <tr key={p.id} className="hover:bg-surface-page/50 transition-colors">
                    {/* Date */}
                    <td className="px-4 py-3 text-stone-700 dark:text-stone-300 font-medium whitespace-nowrap">
                      {displayDate}
                    </td>

                    {/* Project Link */}
                    <td className="px-4 py-3">
                      {p.projectId && p.projectName ? (
                        <Link
                          href={`/projects/${p.projectId}`}
                          className="text-brand-orange hover:underline font-bold flex items-center gap-1 max-w-[160px] truncate"
                        >
                          <IconBriefcase className="h-3.5 w-3.5 shrink-0 text-text-secondary" />
                          <span className="truncate">{p.projectName}</span>
                        </Link>
                      ) : (
                        <span className="text-text-secondary/70 italic">—</span>
                      )}
                    </td>

                    {/* Method */}
                    <td className="px-4 py-3 text-text-secondary font-medium">
                      {formatPaymentMethod(p.method)}
                    </td>

                    {/* Notes */}
                    <td className="px-4 py-3 text-text-secondary max-w-[200px] truncate">
                      {p.notes || <span className="text-text-secondary/50 italic">—</span>}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/50">
                          <IconCheck className="h-3 w-3" /> Paid Out
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50">
                          <IconAlertCircle className="h-3 w-3" /> Pending Owed
                        </span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3 text-right font-black text-sm text-text-primary whitespace-nowrap">
                      ₹{p.amount.toLocaleString("en-IN")}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isCompleted && onMarkPaid && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => onMarkPaid(p.id)}
                            className="h-7 text-[11px] font-bold px-2 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                            title="Mark payout as COMPLETED"
                          >
                            Mark Paid
                          </Button>
                        )}
                        {onDelete && (
                          <button
                            disabled={isPending}
                            onClick={() => onDelete(p.id)}
                            className="p-1 hover:bg-rose-50 text-stone-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                            title="Delete payout record"
                          >
                            <IconTrash className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

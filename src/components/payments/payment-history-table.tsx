"use client";

import { useState } from "react";
import { IconDownload, IconCheck, IconClock, IconAlertCircle, IconArrowDownLeft, IconLoader2 } from "@tabler/icons-react";
import { PaymentMethod, PaymentStatus } from "@/lib/enums";

export type PaymentRow = {
  id: string;
  amount: number | any;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt: Date | string;
  reference: string | null;
  receiptNumber: string | null;
  notes?: string | null;
  client?: {
    id: string;
    name: string;
  };
  project?: {
    id: string;
    name: string;
  };
};

type PaymentHistoryTableProps = {
  payments: PaymentRow[];
  showClientColumn?: boolean;
  showProjectColumn?: boolean;
};

export function PaymentHistoryTable({
  payments,
  showClientColumn = true,
  showProjectColumn = true,
}: PaymentHistoryTableProps) {
  
  const formatCurrency = (amount: number | any) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(Number(amount));
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.COMPLETED:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/30">
            <IconCheck className="h-3 w-3" />
            Paid
          </span>
        );
      case PaymentStatus.PENDING:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 px-2 py-0.5 rounded border border-amber-100 dark:border-amber-900/30">
            <IconClock className="h-3 w-3" />
            Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 px-2 py-0.5 rounded border border-rose-100 dark:border-rose-900/30">
            <IconAlertCircle className="h-3 w-3" />
            {status.toLowerCase()}
          </span>
        );
    }
  };

  return (
    <div className="space-y-3 font-sans text-left">
      <div className="flex items-baseline justify-between">
        <div>
          <h3 className="text-sm md:text-xl font-bold text-stone-900">Payment records</h3>
          <p className="text-[10px] md:text-sm text-stone-400 mt-0.5">
            Newest first · tap a receipt to download
          </p>
        </div>
        <span className="text-[10px] md:text-xs font-bold text-stone-400 uppercase tracking-wider">
          {payments.length} total
        </span>
      </div>

      <div className="space-y-2.5">
        {payments.length === 0 ? (
          <div className="p-10 text-center text-text-secondary bg-surface-white border border-border rounded-xl font-semibold text-sm">
            No payments found.
          </div>
        ) : (
          payments.map((p) => {
            const isCompleted = p.status === PaymentStatus.COMPLETED;
            return (
              <PaymentCard
                key={p.id}
                payment={p}
                isCompleted={isCompleted}
                showClientColumn={showClientColumn}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

/* ─── Individual Payment Card with its own download state ─── */

function PaymentCard({
  payment: p,
  isCompleted,
  showClientColumn,
  formatCurrency,
  formatDate,
}: {
  payment: PaymentRow;
  isCompleted: boolean;
  showClientColumn: boolean;
  formatCurrency: (amount: number | any) => string;
  formatDate: (date: Date | string) => string;
}) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);

  const handleDownload = (e: React.MouseEvent) => {
    if (downloading) return;
    setDownloading(true);
    setDownloadError(false);

    try {
      // Bypass Next.js App Router global <a> interceptors by using window.open
      // Next.js intercepts same-origin <a> clicks and converts them to fetch() requests,
      // which strips the filename and downloads as a UUID Blob.
      // window.open forces the browser to natively handle the HTTP attachment headers.
      window.open(`/api/receipts/${p.id}/download`, '_blank', 'noopener,noreferrer');
      
      setTimeout(() => {
        setDownloading(false);
      }, 4000);
    } catch (err) {
      console.error("[Download Receipt]", err);
      setDownloadError(true);
      setDownloading(false);
      setTimeout(() => setDownloadError(false), 4000);
    }
  };

  return (
    <div className="bg-surface-white border border-border rounded-xl shadow-sm hover:shadow-md hover:border-brand-orange/20 transition-all duration-200 overflow-hidden">
      {/* Main content area */}
      <div className="p-3.5 md:p-4">
        {/* Top row: icon + project name + amount */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {/* Status dot — small on mobile, circle on desktop */}
            <div className={`h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center shrink-0 ${
              isCompleted 
                ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                : "bg-amber-50 text-amber-600 border border-amber-100"
            }`}>
              {isCompleted ? (
                <IconArrowDownLeft className="h-4 w-4 md:h-5 md:w-5" />
              ) : (
                <IconClock className="h-4 w-4 md:h-5 md:w-5" />
              )}
            </div>

            <div className="min-w-0">
              <span className="font-bold text-stone-900 text-[13px] md:text-[15.5px] block truncate">
                {p.project?.name || "Payment"}
              </span>
              {showClientColumn && p.client?.name && (
                <span className="text-[11px] md:text-[13.5px] text-stone-500 font-medium block truncate">
                  {p.client.name}
                </span>
              )}
            </div>
          </div>

          {/* Amount — always visible top-right */}
          <div className="text-right shrink-0">
            <span className={`text-sm md:text-lg font-black block whitespace-nowrap ${
              isCompleted ? "text-emerald-600" : "text-amber-600"
            }`}>
              {isCompleted ? "+" : ""}{formatCurrency(p.amount)}
            </span>
          </div>
        </div>

        {/* Meta row: badges + date */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2 ml-11 md:ml-[52px]">
          {/* Method badge */}
          <span className="capitalize text-[9px] md:text-[11px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-500">
            {p.method.replace(/_/g, " ").toLowerCase()}
          </span>

          {/* Status badge */}
          {!isCompleted && (
            <span className="text-[9px] md:text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 uppercase">
              Pending
            </span>
          )}

          <span className="text-[10px] md:text-[13px] text-stone-400 font-medium">
            · {formatDate(p.paidAt)}
          </span>
        </div>

        {/* Reference + notes — compact */}
        {(p.reference || p.notes) && (
          <div className="mt-1.5 ml-11 md:ml-[52px] space-y-0.5">
            {p.reference && (
              <span className="text-[10px] md:text-[11.5px] text-stone-400 block font-mono truncate">
                Ref: <span className="text-stone-600 font-semibold">{p.reference}</span>
                {p.receiptNumber && <span className="text-stone-400"> · {p.receiptNumber}</span>}
              </span>
            )}
            {p.notes && (
              <p className="text-[10px] md:text-[11.5px] text-stone-400 italic truncate">
                {p.notes}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Action strip — only for completed payments */}
      {isCompleted && (
        <div className="flex border-t border-border no-print">
          {/* View Receipt: Opens instantly in a new browser tab */}
          <a
            href={`/receipts/${p.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-3 border-r border-border bg-stone-50/50 hover:bg-brand-orange-tint/70 text-stone-500 hover:text-brand-orange active:scale-[0.98] transition-all duration-150 text-xs md:text-sm font-semibold cursor-pointer min-h-[44px]"
          >
            {/* Using IconCheck/IconEye helper equivalent or direct SVG */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
              <path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" />
            </svg>
            View Receipt
          </a>

          {/* Download Receipt: triggers direct download with loader indicator */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 bg-stone-50/50 hover:bg-brand-orange-tint/70 active:scale-[0.98] transition-all duration-150 text-xs md:text-sm font-semibold cursor-pointer disabled:opacity-60 disabled:pointer-events-none min-h-[44px] ${
              downloadError ? "text-red-600" : "text-stone-500 hover:text-brand-orange"
            }`}
          >
            {downloading ? (
              <>
                <IconLoader2 className="h-4 w-4 animate-spin" />
                Downloading…
              </>
            ) : downloadError ? (
              <>
                <IconAlertCircle className="h-4 w-4" />
                Failed — tap to retry
              </>
            ) : (
              <>
                <IconDownload className="h-4 w-4" />
                Download PDF
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

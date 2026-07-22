"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { IconLoader, IconAlertCircle, IconCurrencyRupee, IconCalendar, IconCreditCard } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

const teamPaymentSchema = z.object({
  amount: z.number().min(1, "Amount must be greater than 0"),
  status: z.enum(["PENDING", "COMPLETED", "FAILED", "REFUNDED"]),
  method: z.enum(["BANK_TRANSFER", "UPI", "CASH", "CHEQUE", "CARD", "OTHER"]).optional().or(z.literal("")),
  paidAt: z.string().optional().or(z.literal("")),
  projectId: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type TeamPaymentFormValues = z.infer<typeof teamPaymentSchema>;

type ProjectOption = {
  id: string;
  name: string;
  clientName?: string;
};

type TeamPaymentFormProps = {
  onSubmit: (data: TeamPaymentFormValues) => void;
  projects?: ProjectOption[];
  defaultValues?: Partial<TeamPaymentFormValues>;
  isPending?: boolean;
  errorMsg?: string;
  onCancel: () => void;
  submitLabel?: string;
};

export function TeamPaymentForm({
  onSubmit,
  projects = [],
  defaultValues,
  isPending = false,
  errorMsg = "",
  onCancel,
  submitLabel = "Log Payout",
}: TeamPaymentFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TeamPaymentFormValues>({
    resolver: zodResolver(teamPaymentSchema),
    defaultValues: {
      amount: defaultValues?.amount || 0,
      status: defaultValues?.status || "COMPLETED",
      method: defaultValues?.method || "UPI",
      paidAt: defaultValues?.paidAt || new Date().toISOString().split("T")[0],
      projectId: defaultValues?.projectId || "",
      notes: defaultValues?.notes || "",
    },
  });

  const selectedStatus = watch("status");

  const handleLocalSubmit = (values: TeamPaymentFormValues) => {
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit(handleLocalSubmit)} className="space-y-4 font-sans text-left">
      {errorMsg && (
        <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 p-3 rounded-lg text-xs border border-rose-200 dark:border-rose-900/50 flex items-center gap-2">
          <IconAlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Amount & Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Amount */}
        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider flex items-center gap-1">
            <IconCurrencyRupee className="h-3.5 w-3.5 text-brand-orange" /> Amount (₹) <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            disabled={isPending}
            {...register("amount", { valueAsNumber: true })}
            placeholder="e.g. 25000"
            className="flex h-9 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-bold text-text-primary"
          />
          {errors.amount && (
            <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">{errors.amount.message}</p>
          )}
        </div>

        {/* Status */}
        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider">
            Payout Status <span className="text-rose-500">*</span>
          </label>
          <select
            disabled={isPending}
            {...register("status")}
            className="flex h-9 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-bold cursor-pointer"
          >
            <option value="COMPLETED">COMPLETED (Paid Out)</option>
            <option value="PENDING">PENDING (Owed Amount)</option>
          </select>
        </div>
      </div>

      {/* Payment Method & Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Method */}
        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider flex items-center gap-1">
            <IconCreditCard className="h-3.5 w-3.5 text-text-secondary" /> Payment Method
          </label>
          <select
            disabled={isPending}
            {...register("method")}
            className="flex h-9 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold cursor-pointer"
          >
            <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
            <option value="BANK_TRANSFER">Bank Transfer (NEFT / IMPS)</option>
            <option value="CASH">Cash</option>
            <option value="CHEQUE">Cheque</option>
            <option value="CARD">Card</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        {/* Date */}
        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider flex items-center gap-1">
            <IconCalendar className="h-3.5 w-3.5 text-text-secondary" /> Date
          </label>
          <input
            type="date"
            disabled={isPending}
            {...register("paidAt")}
            className="flex h-9 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold cursor-pointer"
          />
        </div>
      </div>

      {/* Linked Project (Optional) */}
      {projects.length > 0 && (
        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider">
            Link to Project (Optional)
          </label>
          <select
            disabled={isPending}
            {...register("projectId")}
            className="flex h-9 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold cursor-pointer"
          >
            <option value="">-- General / Unlinked Payout --</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.clientName ? `(${p.clientName})` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Notes */}
      <div className="space-y-1">
        <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider">
          Payout Notes / Reference
        </label>
        <textarea
          disabled={isPending}
          {...register("notes")}
          placeholder="Add UTR, month, share details, or payout breakdown notes..."
          rows={2.5}
          className="flex w-full rounded-lg border border-border bg-surface-page px-3 py-2 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-3 border-t border-border">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={onCancel}
          className="flex-1 h-9 rounded-lg font-medium text-xs cursor-pointer bg-surface-white border border-border hover:bg-surface-page"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="flex-1 h-9 bg-brand-orange text-white hover:bg-brand-orange-hover rounded-lg font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
        >
          {isPending ? (
            <>
              <IconLoader className="h-4 w-4 animate-spin" /> Logging...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}

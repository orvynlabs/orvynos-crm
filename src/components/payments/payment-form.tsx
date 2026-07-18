"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { IconLoader, IconAlertCircle } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { PaymentMethod } from "@/generated/prisma/client";

const paymentSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  amount: z.number().positive("Amount must be greater than 0"),
  method: z.nativeEnum(PaymentMethod, { message: "Select a valid payment method" }),
  reference: z.string().optional().or(z.literal("")),
  paidAt: z.string().min(1, "Payment date is required"),
  notes: z.string().optional().or(z.literal("")),
});

export type PaymentFormValues = z.infer<typeof paymentSchema>;

export type ProjectSelectOption = {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
};

type PaymentFormProps = {
  onSubmit: (data: PaymentFormValues & { clientId: string }) => void;
  projects: ProjectSelectOption[];
  fixedProjectId?: string;
  fixedClientId?: string;
  isPending?: boolean;
  errorMsg?: string;
  onCancel: () => void;
};

export function PaymentForm({
  onSubmit,
  projects,
  fixedProjectId,
  fixedClientId,
  isPending = false,
  errorMsg = "",
  onCancel,
}: PaymentFormProps) {
  
  const defaultDate = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      projectId: fixedProjectId || "",
      amount: undefined as any,
      method: PaymentMethod.BANK_TRANSFER,
      reference: "",
      paidAt: defaultDate,
      notes: "",
    },
  });

  const handleLocalSubmit = (values: PaymentFormValues) => {
    let finalClientId = fixedClientId || "";

    if (!finalClientId && projects.length > 0) {
      const proj = projects.find((p) => p.id === values.projectId);
      if (proj) {
        finalClientId = proj.clientId;
      }
    }

    if (!finalClientId) {
      alert("Error: Client could not be resolved for the selected project.");
      return;
    }

    onSubmit({
      ...values,
      clientId: finalClientId,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleLocalSubmit)} className="space-y-5 font-sans text-left">
      {errorMsg && (
        <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 p-3 rounded-lg text-xs border border-rose-200 dark:border-rose-900/50 flex items-center gap-2">
          <IconAlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {!fixedProjectId ? (
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider">
            Project <span className="text-rose-500">*</span>
          </label>
          <select
            disabled={isPending}
            {...register("projectId")}
            className="flex h-10 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
          >
            <option value="">Select a project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.clientName})
              </option>
            ))}
          </select>
          {errors.projectId && (
            <p className="text-[10px] font-bold text-rose-500">{errors.projectId.message}</p>
          )}
        </div>
      ) : (
        <input type="hidden" {...register("projectId")} />
      )}

      <div className="space-y-1.5">
        <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider">
          Amount (INR) <span className="text-rose-500">*</span>
        </label>
        <input
          type="number"
          step="0.01"
          disabled={isPending}
          {...register("amount", { valueAsNumber: true })}
          placeholder="e.g. 50000"
          className="flex h-10 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
        />
        {errors.amount && (
          <p className="text-[10px] font-bold text-rose-500">{errors.amount.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider">
          Payment Method <span className="text-rose-500">*</span>
        </label>
        <select
          disabled={isPending}
          {...register("method")}
          className="flex h-10 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
        >
          <option value={PaymentMethod.BANK_TRANSFER}>Bank Transfer (NEFT/IMPS/RTGS)</option>
          <option value={PaymentMethod.UPI}>UPI (GPay/PhonePe/etc)</option>
          <option value={PaymentMethod.CASH}>Cash</option>
          <option value={PaymentMethod.CHEQUE}>Cheque</option>
          <option value={PaymentMethod.CARD}>Card</option>
          <option value={PaymentMethod.OTHER}>Other</option>
        </select>
        {errors.method && (
          <p className="text-[10px] font-bold text-rose-500">{errors.method.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider">
          Reference Number (UTR / Txn ID / Cheque No)
        </label>
        <input
          type="text"
          disabled={isPending}
          {...register("reference")}
          placeholder="e.g. UTR1234567890"
          className="flex h-10 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider">
          Payment Date <span className="text-rose-500">*</span>
        </label>
        <input
          type="date"
          disabled={isPending}
          {...register("paidAt")}
          className="flex h-10 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
        />
        {errors.paidAt && (
          <p className="text-[10px] font-bold text-rose-500">{errors.paidAt.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider">
          Notes / Remarks
        </label>
        <textarea
          disabled={isPending}
          {...register("notes")}
          rows={3}
          placeholder="Add any internal remarks or details..."
          className="flex w-full rounded-lg border border-border bg-surface-page px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold resize-none"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
          className="font-semibold text-xs py-2.5 px-4 rounded-lg bg-transparent border-border text-text-secondary hover:bg-stone-50 min-h-[40px]"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="font-bold text-xs py-2.5 px-4 rounded-lg bg-brand-orange hover:bg-brand-orange-hover text-white flex items-center gap-1.5 min-h-[40px]"
        >
          {isPending ? (
            <>
              <IconLoader className="h-3.5 w-3.5 animate-spin" />
              Recording...
            </>
          ) : (
            "Record Payment"
          )}
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { IconLoader, IconAlertCircle } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { ExpenseCategory } from "@/generated/prisma/client";

const expenseSchema = z.object({
  title: z.string().min(1, "Title/Description is required"),
  amount: z.number().positive("Amount must be greater than 0"),
  category: z.nativeEnum(ExpenseCategory, { message: "Select a valid category" }),
  date: z.string().min(1, "Expense date is required"),
  projectId: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;

export type ProjectOption = {
  id: string;
  name: string;
};

type ExpenseFormProps = {
  onSubmit: (data: ExpenseFormValues) => void;
  projects: ProjectOption[];
  isPending?: boolean;
  errorMsg?: string;
  onCancel: () => void;
};

export function ExpenseForm({
  onSubmit,
  projects,
  isPending = false,
  errorMsg = "",
  onCancel,
}: ExpenseFormProps) {
  
  const defaultDate = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      title: "",
      amount: undefined as any,
      category: ExpenseCategory.SOFTWARE,
      date: defaultDate,
      projectId: "",
      notes: "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 font-sans text-left">
      {errorMsg && (
        <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 p-3 rounded-lg text-xs border border-rose-200 dark:border-rose-900/50 flex items-center gap-2">
          <IconAlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider">
          Title / Description <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          disabled={isPending}
          {...register("title")}
          placeholder="e.g. Vercel Hosting or Adobe Suite License"
          className="flex h-10 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
        />
        {errors.title && (
          <p className="text-[10px] font-bold text-rose-500">{errors.title.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider">
            Amount (INR) <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            disabled={isPending}
            {...register("amount", { valueAsNumber: true })}
            placeholder="e.g. 1500"
            className="flex h-10 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
          />
          {errors.amount && (
            <p className="text-[10px] font-bold text-rose-500">{errors.amount.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider">
            Date <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            disabled={isPending}
            {...register("date")}
            className="flex h-10 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
          />
          {errors.date && (
            <p className="text-[10px] font-bold text-rose-500">{errors.date.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider">
          Category <span className="text-rose-500">*</span>
        </label>
        <select
          disabled={isPending}
          {...register("category")}
          className="flex h-10 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
        >
          <option value={ExpenseCategory.SOFTWARE}>Software / Subscriptions</option>
          <option value={ExpenseCategory.HOSTING}>Server Hosting</option>
          <option value={ExpenseCategory.DOMAINS}>Domain Names</option>
          <option value={ExpenseCategory.MARKETING}>Marketing & Sales</option>
          <option value={ExpenseCategory.OFFICE}>Office Rent & Supplies</option>
          <option value={ExpenseCategory.TRAVEL}>Travel & Client Meetings</option>
          <option value={ExpenseCategory.TEAM_PAYMENTS}>Team Payments / Payouts</option>
          <option value={ExpenseCategory.OTHER}>Other Business Expense</option>
        </select>
        {errors.category && (
          <p className="text-[10px] font-bold text-rose-500">{errors.category.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider">
          Link to Project (Optional)
        </label>
        <select
          disabled={isPending}
          {...register("projectId")}
          className="flex h-10 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
        >
          <option value="">None (General Overhead)</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider">
          Notes / Remarks
        </label>
        <textarea
          disabled={isPending}
          {...register("notes")}
          rows={3}
          placeholder="Add any internal context or billing references..."
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
              Saving...
            </>
          ) : (
            "Log Expense"
          )}
        </Button>
      </div>
    </form>
  );
}

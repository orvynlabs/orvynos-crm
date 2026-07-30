"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { IconLoader, IconAlertCircle, IconBuildingStore, IconBriefcase, IconInfoCircle } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { ExpenseCategory } from "@/lib/enums";
import { parseExpenseCategory } from "@/lib/expenses";

const expenseSchema = z.object({
  title: z.string().min(1, "Title/Description is required"),
  amount: z.number().positive("Amount must be greater than 0"),
  category: z.string().min(1, "Category is required"),
  customCategory: z.string().optional(),
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
  onSubmit: (data: {
    title: string;
    amount: number;
    category: ExpenseCategory;
    date: string;
    projectId?: string;
    notes?: string;
  }) => void;
  projects: ProjectOption[];
  existingCustomCategories?: string[];
  initialData?: {
    title: string;
    amount: number;
    category: ExpenseCategory | string;
    date: string | Date;
    projectId?: string | null;
    notes?: string | null;
  };
  isPending?: boolean;
  errorMsg?: string;
  onCancel: () => void;
};

export function ExpenseForm({
  onSubmit,
  projects,
  existingCustomCategories = [],
  initialData,
  isPending = false,
  errorMsg = "",
  onCancel,
}: ExpenseFormProps) {
  const defaultDate = initialData?.date
    ? typeof initialData.date === "string"
      ? initialData.date.split("T")[0]
      : new Date(initialData.date).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  const parsedInitial = initialData ? parseExpenseCategory({ category: initialData.category, notes: initialData.notes }) : null;

  const [customCategoryInput, setCustomCategoryInput] = useState(
    parsedInitial?.isCustom ? parsedInitial.displayCategory : ""
  );
  const [customCatError, setCustomCatError] = useState("");

  const initialCatValue = parsedInitial?.isCustom
    ? "CUSTOM"
    : (initialData?.category as string) || ExpenseCategory.SOFTWARE;

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      title: initialData?.title || "",
      amount: initialData?.amount ?? (undefined as any),
      category: initialCatValue,
      customCategory: parsedInitial?.isCustom ? parsedInitial.displayCategory : "",
      date: defaultDate,
      projectId: initialData?.projectId || "",
      notes: parsedInitial?.isCustom ? parsedInitial.cleanNotes : initialData?.notes || "",
    },
  });

  const selectedProjectId = useWatch({ control, name: "projectId" });
  const selectedCategory = useWatch({ control, name: "category" });

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const isProjectExpense = Boolean(selectedProjectId);

  const handleLocalSubmit = (values: ExpenseFormValues) => {
    setCustomCatError("");
    let finalCategoryEnum: ExpenseCategory = ExpenseCategory.OTHER;
    let finalNotes = values.notes ? values.notes.trim() : "";

    if (values.category === "CUSTOM") {
      const customName = customCategoryInput.trim();
      if (!customName) {
        setCustomCatError("Please enter your custom category name.");
        return;
      }
      finalCategoryEnum = ExpenseCategory.OTHER;
      finalNotes = `[Category: ${customName}]${finalNotes ? `\n${finalNotes}` : ""}`;
    } else if (Object.values(ExpenseCategory).includes(values.category as any)) {
      finalCategoryEnum = values.category as ExpenseCategory;
    } else {
      // It's a previously saved custom category name selected from dropdown
      finalCategoryEnum = ExpenseCategory.OTHER;
      finalNotes = `[Category: ${values.category.trim()}]${finalNotes ? `\n${finalNotes}` : ""}`;
    }

    onSubmit({
      title: values.title,
      amount: values.amount,
      category: finalCategoryEnum,
      date: values.date,
      projectId: values.projectId || undefined,
      notes: finalNotes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleLocalSubmit)} className="space-y-4 font-sans text-left">
      {errorMsg && (
        <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 p-3 rounded-lg text-xs border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 font-medium">
          <IconAlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Expense Type Selector (Company vs Client Project) */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider block">
          Expense Type / Scope <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setValue("projectId", "")}
            className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
              !isProjectExpense
                ? "bg-blue-50/80 border-blue-300 dark:bg-blue-950/40 dark:border-blue-700 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500/30"
                : "bg-surface-page border-border text-text-secondary hover:border-stone-400"
            }`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${!isProjectExpense ? "bg-blue-500 text-white" : "bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300"}`}>
              <IconBuildingStore className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-black block leading-tight">Company Expense</span>
              <span className="text-[9.5px] opacity-80 font-medium block">Agency Overhead</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              if (projects.length > 0 && !selectedProjectId) {
                setValue("projectId", projects[0].id);
              }
            }}
            className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
              isProjectExpense
                ? "bg-emerald-50/80 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30"
                : "bg-surface-page border-border text-text-secondary hover:border-stone-400"
            }`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isProjectExpense ? "bg-emerald-500 text-white" : "bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300"}`}>
              <IconBriefcase className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-black block leading-tight">Client Project Cost</span>
              <span className="text-[9.5px] opacity-80 font-medium block">Linked to Project</span>
            </div>
          </button>
        </div>
      </div>

      {/* Project Selector (Visible if Client Project Cost selected) */}
      {isProjectExpense && (
        <div className="space-y-1.5 p-2.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-xl">
          <label className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
            Select Linked Client Project <span className="text-rose-500">*</span>
          </label>
          <select
            disabled={isPending}
            {...register("projectId")}
            className="flex h-9 w-full rounded-lg border border-emerald-300 dark:border-emerald-800 bg-surface-white px-3 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 font-semibold"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Title / Description */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider block">
          Title / Description <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          disabled={isPending}
          {...register("title")}
          placeholder={isProjectExpense ? "e.g. Server hosting or Domain registration for client" : "e.g. Vercel Pro Plan or Office Wifi"}
          className="flex h-9 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-xs shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
        />
        {errors.title && (
          <p className="text-[10px] font-bold text-rose-500">{errors.title.message}</p>
        )}
      </div>

      {/* Amount & Date */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider block">
            Amount (INR) <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            disabled={isPending}
            {...register("amount", { valueAsNumber: true })}
            placeholder="e.g. 1500"
            className="flex h-9 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-xs shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
          />
          {errors.amount && (
            <p className="text-[10px] font-bold text-rose-500">{errors.amount.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider block">
            Expense Date <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            disabled={isPending}
            {...register("date")}
            className="flex h-9 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-xs shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold cursor-pointer"
          />
          {errors.date && (
            <p className="text-[10px] font-bold text-rose-500">{errors.date.message}</p>
          )}
        </div>
      </div>

      {/* Category Dropdown */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider block">
          Category <span className="text-rose-500">*</span>
        </label>
        <select
          disabled={isPending}
          {...register("category")}
          className="flex h-9 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-xs shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-bold cursor-pointer"
        >
          <option value={ExpenseCategory.SOFTWARE}>Software &amp; Tools — Company Expense</option>
          <option value={ExpenseCategory.HOSTING}>Server Hosting — Project / Company</option>
          <option value={ExpenseCategory.DOMAINS}>Domain Names — Project / Company</option>
          <option value={ExpenseCategory.MARKETING}>Marketing &amp; Ads — Company Expense</option>
          <option value={ExpenseCategory.OFFICE}>Office &amp; Supplies — Company Expense</option>
          <option value={ExpenseCategory.TRAVEL}>Travel &amp; Meetings — Company Expense</option>
          <option value={ExpenseCategory.TEAM_PAYMENTS}>Team Payments &amp; Payouts — Company Expense</option>
          <option value={ExpenseCategory.OTHER}>Other Business Expense — Company Expense</option>
          
          {/* Previously saved custom categories */}
          {existingCustomCategories.map((c) => (
            <option key={c} value={c}>
              🏷️ {c} (Custom Category)
            </option>
          ))}

          <option value="CUSTOM">✏️ Write Custom Category...</option>
        </select>
        {errors.category && (
          <p className="text-[10px] font-bold text-rose-500">{errors.category.message}</p>
        )}
      </div>

      {/* Custom Category Input (Visible when Write Custom Category is selected) */}
      {selectedCategory === "CUSTOM" && (
        <div className="space-y-1.5 p-3 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-900/40 rounded-xl animate-in fade-in slide-in-from-top-1 duration-150">
          <label className="text-[10px] font-extrabold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
            Custom Category Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            disabled={isPending}
            value={customCategoryInput}
            onChange={(e) => {
              setCustomCategoryInput(e.target.value);
              if (customCatError) setCustomCatError("");
            }}
            placeholder="e.g. Legal Fees, Hardware Equipment, Client Refreshments..."
            className="flex h-9 w-full rounded-lg border border-amber-300 dark:border-amber-700 bg-surface-white px-3 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 font-bold"
          />
          {customCatError && (
            <p className="text-[10px] font-bold text-rose-500 mt-1">{customCatError}</p>
          )}
        </div>
      )}

      {/* Live Classification Summary Preview */}
      <div className="p-2.5 bg-surface-page border border-border/70 rounded-xl flex items-start gap-2 text-xs">
        <IconInfoCircle className="h-4 w-4 text-brand-orange shrink-0 mt-0.5" />
        <div className="space-y-0.5 text-[11px]">
          <span className="font-bold text-text-primary block">
            Classification Summary:
          </span>
          {isProjectExpense ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-bold block">
              📁 Assigned directly as cost for <span className="underline">{selectedProject?.name || "Client Project"}</span>
            </span>
          ) : (
            <span className="text-blue-600 dark:text-blue-400 font-bold block">
              🏢 Logged as general agency company overhead
            </span>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider block">
          Notes / Remarks
        </label>
        <textarea
          disabled={isPending}
          {...register("notes")}
          rows={2.5}
          placeholder="Add any internal context or billing references..."
          className="flex w-full rounded-lg border border-border bg-surface-page px-3 py-2 text-xs shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold resize-none"
        />
      </div>

      {/* Form Buttons */}
      <div className="flex justify-end gap-2.5 pt-3 border-t border-border mt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
          className="font-bold text-xs py-2 px-3.5 h-8 rounded-lg bg-transparent border-border text-text-secondary hover:bg-stone-50 cursor-pointer"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="font-bold text-xs py-2 px-4 h-8 rounded-lg bg-brand-orange hover:bg-brand-orange-hover text-white flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-[0.98]"
        >
          {isPending ? (
            <>
              <IconLoader className="h-3.5 w-3.5 animate-spin" />
              {initialData ? "Saving..." : "Logging..."}
            </>
          ) : (
            initialData ? "Save Changes" : "Log Expense"
          )}
        </Button>
      </div>
    </form>
  );
}

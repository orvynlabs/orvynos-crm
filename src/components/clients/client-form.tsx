"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { IconLoader, IconAlertCircle } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

// Schema validation using Zod
const clientSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  contactName: z.string().optional().or(z.literal("")),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  website: z.string().optional().or(z.literal("")),
  gstin: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type ClientFormValues = z.infer<typeof clientSchema>;

type ClientFormProps = {
  onSubmit: (data: ClientFormValues) => void;
  defaultValues?: Partial<ClientFormValues>;
  isPending?: boolean;
  errorMsg?: string;
  onCancel: () => void;
  submitLabel?: string;
};

export function ClientForm({
  onSubmit,
  defaultValues,
  isPending = false,
  errorMsg = "",
  onCancel,
  submitLabel = "Save Client",
}: ClientFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      contactName: "",
      email: "",
      phone: "",
      website: "",
      gstin: "",
      address: "",
      city: "",
      state: "",
      notes: "",
      ...defaultValues,
    },
  });

  const handleLocalSubmit = (values: ClientFormValues) => {
    const cleaned = { ...values };
    
    // Auto-format website link
    if (cleaned.website) {
      const site = cleaned.website.trim();
      if (site) {
        cleaned.website = site.startsWith("http://") || site.startsWith("https://") 
          ? site 
          : `https://${site}`;
      }
    }
    
    onSubmit(cleaned);
  };

  return (
    <form onSubmit={handleSubmit(handleLocalSubmit)} className="space-y-4 font-sans text-left">
      {errorMsg && (
        <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 p-3 rounded-lg text-xs border border-rose-200 dark:border-rose-900/50 flex items-center gap-2">
          <IconAlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Company Name */}
      <div className="space-y-1">
        <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider">
          Company Name <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          disabled={isPending}
          {...register("name")}
          placeholder="e.g. Acme Corporation"
          className="flex h-9 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
        />
        {errors.name && (
          <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">{errors.name.message}</p>
        )}
      </div>

      {/* Contact Person */}
      <div className="space-y-1">
        <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider">
          Contact Person
        </label>
        <input
          type="text"
          disabled={isPending}
          {...register("contactName")}
          placeholder="e.g. John Doe"
          className="flex h-9 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Email */}
        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider">
            Email Address
          </label>
          <input
            type="text"
            disabled={isPending}
            {...register("email")}
            placeholder="client@acme.com"
            className="flex h-9 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
          />
          {errors.email && (
            <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">{errors.email.message}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider">
            Phone Number
          </label>
          <input
            type="tel"
            disabled={isPending}
            {...register("phone")}
            placeholder="e.g. +91 9999999999"
            className="flex h-9 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Website */}
        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider">
            Website URL
          </label>
          <input
            type="text"
            disabled={isPending}
            {...register("website")}
            placeholder="acme.com"
            className="flex h-9 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
          />
          {errors.website && (
            <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">{errors.website.message}</p>
          )}
        </div>

        {/* GSTIN */}
        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider">
            GSTIN (Optional)
          </label>
          <input
            type="text"
            disabled={isPending}
            {...register("gstin")}
            placeholder="e.g. 27AAACA0000A1Z1"
            className="flex h-9 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
          />
        </div>
      </div>

      {/* Address */}
      <div className="space-y-1">
        <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider">
          Office Address
        </label>
        <input
          type="text"
          disabled={isPending}
          {...register("address")}
          placeholder="Suite 101, Business Center"
          className="flex h-9 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* City */}
        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider">
            City
          </label>
          <input
            type="text"
            disabled={isPending}
            {...register("city")}
            placeholder="e.g. Mumbai"
            className="flex h-9 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
          />
        </div>

        {/* State */}
        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider">
            State
          </label>
          <input
            type="text"
            disabled={isPending}
            {...register("state")}
            placeholder="e.g. Maharashtra"
            className="flex h-9 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider">
          Client Notes
        </label>
        <textarea
          disabled={isPending}
          {...register("notes")}
          placeholder="Add comments, client details, or specific onboarding notes..."
          rows={3}
          className="flex w-full rounded-lg border border-border bg-surface-page px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
        />
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-border/60">
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
              <IconLoader className="h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}

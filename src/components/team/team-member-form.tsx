"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { IconLoader, IconAlertCircle, IconPlus, IconX } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

const teamMemberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  title: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  bio: z.string().optional().or(z.literal("")),
});

export type TeamMemberFormValues = z.infer<typeof teamMemberSchema> & {
  skills: string[];
};

type TeamMemberFormProps = {
  onSubmit: (data: TeamMemberFormValues) => void;
  defaultValues?: Partial<TeamMemberFormValues>;
  isPending?: boolean;
  errorMsg?: string;
  onCancel: () => void;
  submitLabel?: string;
};

export function TeamMemberForm({
  onSubmit,
  defaultValues,
  isPending = false,
  errorMsg = "",
  onCancel,
  submitLabel = "Save Changes",
}: TeamMemberFormProps) {
  const [skills, setSkills] = useState<string[]>(defaultValues?.skills || []);
  const [skillInput, setSkillInput] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof teamMemberSchema>>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      email: defaultValues?.email || "",
      title: defaultValues?.title || "",
      phone: defaultValues?.phone || "",
      bio: defaultValues?.bio || "",
    },
  });

  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleKeyDownSkill = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleLocalSubmit = (values: z.infer<typeof teamMemberSchema>) => {
    onSubmit({
      ...values,
      skills,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleLocalSubmit)} className="space-y-4 font-sans text-left">
      {errorMsg && (
        <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 p-3 rounded-lg text-xs border border-rose-200 dark:border-rose-900/50 flex items-center gap-2">
          <IconAlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Name */}
      <div className="space-y-1">
        <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider">
          Full Name <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          disabled={isPending}
          {...register("name")}
          placeholder="e.g. Rahul V."
          className="flex h-9 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
        />
        {errors.name && (
          <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">{errors.name.message}</p>
        )}
      </div>

      {/* Email & Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider">
            Email <span className="text-rose-500">*</span>
          </label>
          <input
            type="email"
            disabled={isPending}
            {...register("email")}
            placeholder="rahul@orvynlabs.com"
            className="flex h-9 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
          />
          {errors.email && (
            <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider">
            Phone Number
          </label>
          <input
            type="tel"
            disabled={isPending}
            {...register("phone")}
            placeholder="+91 9876543210"
            className="flex h-9 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
          />
        </div>
      </div>

      {/* Title / Role */}
      <div className="space-y-1">
        <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider">
          Role / Job Title
        </label>
        <input
          type="text"
          disabled={isPending}
          {...register("title")}
          placeholder="e.g. Co-founder / Lead Full-stack Dev"
          className="flex h-9 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
        />
      </div>

      {/* Skills Tags */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider">
          Skills & Tech Stack Tags
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            disabled={isPending}
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={handleKeyDownSkill}
            placeholder="Type skill (e.g. Next.js) and press Enter"
            className="flex h-9 flex-1 rounded-lg border border-border bg-surface-page px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
          />
          <Button
            type="button"
            variant="outline"
            disabled={isPending || !skillInput.trim()}
            onClick={handleAddSkill}
            className="h-9 px-3 rounded-lg border border-border bg-surface-white hover:bg-surface-page cursor-pointer font-bold text-xs flex items-center gap-1"
          >
            <IconPlus className="h-4 w-4" /> Add
          </Button>
        </div>

        {/* Skill Badges */}
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 bg-brand-orange-tint text-brand-orange dark:bg-brand-orange/20 text-xs font-bold px-2.5 py-0.5 rounded-full border border-brand-orange/20"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="hover:text-rose-600 rounded-full p-0.5 transition-colors cursor-pointer"
                >
                  <IconX className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bio */}
      <div className="space-y-1">
        <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider">
          Short Bio / Notes
        </label>
        <textarea
          disabled={isPending}
          {...register("bio")}
          placeholder="Brief description of primary responsibilities or background..."
          rows={3}
          className="flex w-full rounded-lg border border-border bg-surface-page px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
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

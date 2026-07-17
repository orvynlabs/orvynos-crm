"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  IconLoader,
  IconAlertCircle,
  IconPlus,
  IconX,
  IconCalendar,
  IconWorld,
  IconUsers,
} from "@tabler/icons-react";

// Zod validation schema
const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  clientId: z.string().min(1, "Client is required"),
  description: z.string().optional().or(z.literal("")),
  budget: z.number().min(0, "Budget must be a positive number"),
  status: z.enum(["NEW", "ONGOING", "REVIEW", "COMPLETED", "ON_HOLD", "CANCELLED"]),
  progress: z.number().min(0).max(100),
  startDate: z.string().optional().or(z.literal("")),
  deadline: z.string().optional().or(z.literal("")),
  techStack: z.array(z.string()),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;

type ClientOption = {
  id: string;
  name: string;
};

type TeamMemberOption = {
  id: string;
  user: {
    id: string;
    name: string;
  };
};

type ProjectFormProps = {
  onSubmit: (data: ProjectFormValues & {
    projectType?: "one-off" | "retainer";
    domain?: string;
    domainExpiry?: string;
    teamMemberAssignments?: { teamMemberId: string; roleOnProject?: string }[];
  }) => void;
  clients: ClientOption[];
  teamMembers: TeamMemberOption[];
  defaultValues?: Partial<ProjectFormValues> & {
    projectType?: "one-off" | "retainer";
    domain?: string;
    domainExpiry?: string;
    teamMemberAssignments?: { teamMemberId: string; roleOnProject?: string }[];
  };
  isPending?: boolean;
  errorMsg?: string;
  onCancel: () => void;
  submitLabel?: string;
};

export function ProjectForm({
  onSubmit,
  clients,
  teamMembers,
  defaultValues,
  isPending = false,
  errorMsg = "",
  onCancel,
  submitLabel = "Save Project",
}: ProjectFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      clientId: "",
      description: "",
      budget: 0,
      status: "NEW",
      progress: 0,
      startDate: "",
      deadline: "",
      techStack: [],
      ...defaultValues,
    },
  });

  const selectedClientId = watch("clientId");
  const techStack = watch("techStack") || [];

  // Searchable Select Client state
  const [clientSearch, setClientSearch] = useState("");
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);

  // Custom states matching the reference design layout
  const [projectType, setProjectType] = useState<"one-off" | "retainer">(
    defaultValues?.projectType || 
    (defaultValues?.description?.toLowerCase().includes("retainer") ? "retainer" : "one-off")
  );
  
  // Storing team members assignments with their project roles
  const [selectedMembers, setSelectedMembers] = useState<{ teamMemberId: string; roleOnProject: string }[]>(
    defaultValues?.teamMemberAssignments
      ? defaultValues.teamMemberAssignments.map((m) => ({
          teamMemberId: m.teamMemberId,
          roleOnProject: m.roleOnProject || "",
        }))
      : []
  );

  const [domain, setDomain] = useState(defaultValues?.domain || "");
  const [domainExpiry, setDomainExpiry] = useState(defaultValues?.domainExpiry || "");

  // Tag inputs state
  const [newTag, setNewTag] = useState("");

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    if (!techStack.includes(newTag.trim())) {
      setValue("techStack", [...techStack, newTag.trim()]);
    }
    setNewTag("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setValue("techStack", techStack.filter((t) => t !== tagToRemove));
  };

  // Toggle assigned team member
  const handleToggleMember = (memberId: string) => {
    setSelectedMembers((prev) => {
      const exists = prev.some((m) => m.teamMemberId === memberId);
      if (exists) {
        return prev.filter((m) => m.teamMemberId !== memberId);
      } else {
        return [...prev, { teamMemberId: memberId, roleOnProject: "" }];
      }
    });
  };

  // Set the specific role description on an assigned team member
  const handleRoleChange = (memberId: string, role: string) => {
    setSelectedMembers((prev) =>
      prev.map((m) =>
        m.teamMemberId === memberId ? { ...m, roleOnProject: role } : m
      )
    );
  };

  // Handle final submission combining custom UI fields
  const onFormSubmit = (values: ProjectFormValues) => {
    // If it's a retainer, we can automatically append "[Retainer]" to description for MRR counter tracking
    let finalDesc = values.description || "";
    if (projectType === "retainer" && !finalDesc.toLowerCase().includes("retainer")) {
      finalDesc = `[Retainer] ${finalDesc}`;
    }

    onSubmit({
      ...values,
      description: finalDesc,
      projectType,
      domain: domain.trim() || undefined,
      domainExpiry: domainExpiry || undefined,
      teamMemberAssignments: selectedMembers.map((m) => ({
        teamMemberId: m.teamMemberId,
        roleOnProject: m.roleOnProject.trim() || undefined,
      })),
    });
  };

  // Filter clients dynamically as search input changes
  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const selectedClientName = clients.find((c) => c.id === selectedClientId)?.name || "Select a client...";

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6.5 text-left font-sans">
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg flex items-center gap-2 select-none">
          <IconAlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. Project Name */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider">
          Project Name <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          disabled={isPending}
          {...register("name")}
          placeholder="e.g., Website Redesign"
          className="flex h-9 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
        />
        {errors.name && (
          <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">{errors.name.message}</p>
        )}
      </div>

      {/* 2. Project Description */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider">
          Description
        </label>
        <textarea
          disabled={isPending}
          {...register("description")}
          placeholder="Brief description of the project..."
          rows={2}
          className="flex w-full rounded-lg border border-border bg-surface-page px-3 py-1.5 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
        />
      </div>

      {/* 3. Project Type Selector Segment (Orange card highlight) */}
      <div className="space-y-2 select-none">
        <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider">
          Project Type
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: One-off Project */}
          <button
            type="button"
            onClick={() => setProjectType("one-off")}
            className={`
              p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col gap-1
              ${projectType === "one-off"
                ? "border-brand-orange bg-brand-orange-tint/5 shadow-sm"
                : "border-border hover:border-text-secondary bg-surface-page/55"
              }
            `}
          >
            <span className="text-xs font-black text-text-primary">One-off Project</span>
            <span className="text-[10px] text-text-secondary font-medium">Fixed scope & budget</span>
          </button>

          {/* Card 2: Monthly Retainer */}
          <button
            type="button"
            onClick={() => setProjectType("retainer")}
            className={`
              p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col gap-1
              ${projectType === "retainer"
                ? "border-brand-orange bg-brand-orange-tint/5 shadow-sm"
                : "border-border hover:border-text-secondary bg-surface-page/55"
              }
            `}
          >
            <span className="text-xs font-black text-text-primary">Monthly Retainer</span>
            <span className="text-[10px] text-text-secondary font-medium">Recurring monthly fee</span>
          </button>
        </div>
      </div>

      {/* 4. Client and Status side-by-side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Client Selector */}
        <div className="space-y-1.5 relative">
          <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider">
            Client <span className="text-rose-500">*</span>
          </label>
          <div>
            <button
              type="button"
              onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
              disabled={isPending}
              className="flex h-9 w-full items-center justify-between rounded-lg border border-border bg-surface-page px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-brand-orange font-semibold cursor-pointer text-left"
            >
              <span className="truncate">{selectedClientName}</span>
              <IconPlus className="h-4 w-4 shrink-0 opacity-60" />
            </button>

            {isClientDropdownOpen && (
              <div className="absolute left-0 right-0 z-50 mt-1 max-h-56 overflow-y-auto rounded-lg border border-border bg-surface-white p-1 shadow-lg animate-in fade-in duration-100">
                <div className="sticky top-0 bg-surface-white pb-1.5">
                  <input
                    type="text"
                    placeholder="Search clients..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="h-8 w-full rounded-md border border-border bg-surface-page px-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-orange"
                  />
                </div>
                {filteredClients.length > 0 ? (
                  filteredClients.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setValue("clientId", c.id);
                        setIsClientDropdownOpen(false);
                      }}
                      className="w-full text-left rounded-md px-2.5 py-1.5 text-xs text-text-primary hover:bg-brand-orange-tint/10 hover:text-brand-orange transition-colors font-semibold cursor-pointer"
                    >
                      {c.name}
                    </button>
                  ))
                ) : (
                  <p className="p-2.5 text-center text-[10px] font-bold text-text-secondary">No clients found</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Status select */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider">
            Status
          </label>
          <select
            disabled={isPending}
            {...register("status")}
            className="flex h-9 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold cursor-pointer"
          >
            <option value="NEW">New</option>
            <option value="ONGOING">Ongoing</option>
            <option value="COMPLETED">Completed</option>
            <option value="ON_HOLD">On Hold</option>
          </select>
        </div>
      </div>

      {/* 5. Budget (Full width) */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider">
          Budget Amount (₹) <span className="text-rose-500">*</span>
        </label>
        <input
          type="number"
          disabled={isPending}
          {...register("budget", { valueAsNumber: true })}
          placeholder="e.g., 75000"
          className="flex h-9 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
        />
        {errors.budget && (
          <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">{errors.budget.message}</p>
        )}
      </div>

      {/* 6. Start date and Target Deadline side-by-side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Start Date */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider flex items-center gap-1.5 select-none">
            <IconCalendar className="h-3.5 w-3.5" /> Start Date
          </label>
          <input
            type="date"
            disabled={isPending}
            {...register("startDate")}
            className="flex h-9 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold cursor-pointer"
          />
        </div>

        {/* Target Deadline */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider flex items-center gap-1.5 select-none">
            <IconCalendar className="h-3.5 w-3.5" /> Target Deadline
          </label>
          <input
            type="date"
            disabled={isPending}
            {...register("deadline")}
            className="flex h-9 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold cursor-pointer"
          />
        </div>
      </div>

      {/* 7. Domain & Hosting (Optional section) */}
      <div className="border border-border/60 rounded-xl p-4 bg-surface-page/35 space-y-3.5">
        <div className="flex items-center gap-2 select-none border-b border-border/40 pb-2">
          <IconWorld className="h-4.5 w-4.5 text-text-secondary" />
          <span className="text-xs font-black text-text-primary uppercase tracking-wider">Domain & Hosting (Optional)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-extrabold text-text-secondary uppercase">Domain Name</label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g. orvynlabs.com"
              className="flex h-9 w-full rounded-lg border border-border bg-surface-white px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-extrabold text-text-secondary uppercase">Domain Expiry</label>
            <input
              type="date"
              value={domainExpiry}
              onChange={(e) => setDomainExpiry(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-border bg-surface-white px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 8. Assign Team Members */}
      <div className="space-y-3.5 select-none">
        <div className="flex items-center gap-2 select-none">
          <IconUsers className="h-4.5 w-4.5 text-text-secondary" />
          <span className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider">Assign Team Members</span>
        </div>

        {/* Member tags buttons */}
        <div className="flex flex-wrap gap-2 p-3.5 border border-border/85 rounded-xl bg-surface-page/20 min-h-[50px]">
          {teamMembers.length > 0 ? (
            teamMembers.map((member) => {
              const isSelected = selectedMembers.some((m) => m.teamMemberId === member.id);
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => handleToggleMember(member.id)}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 border
                    ${isSelected
                      ? "bg-brand-orange border-brand-orange text-white"
                      : "bg-surface-white border-border text-text-secondary hover:border-text-secondary"
                    }
                  `}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white animate-ping" : "bg-text-secondary"}`} />
                  {member.user.name}
                </button>
              );
            })
          ) : (
            <span className="text-[10px] text-text-secondary/70 italic font-medium p-1">No team members registered yet.</span>
          )}
        </div>

        {/* Dynamic role fields list for assigned members */}
        {selectedMembers.length > 0 && (
          <div className="mt-3 p-3.5 border border-border/60 rounded-xl bg-surface-page/35 space-y-2.5">
            <span className="text-[9px] font-extrabold text-text-secondary uppercase tracking-wider block">
              Set Roles for Assigned Members
            </span>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {selectedMembers.map((assigned) => {
                const member = teamMembers.find((m) => m.id === assigned.teamMemberId);
                if (!member) return null;
                return (
                  <div
                    key={assigned.teamMemberId}
                    className="flex items-center justify-between gap-3 p-2 bg-surface-white border border-border rounded-lg shadow-sm"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-6 h-6 rounded-full bg-brand-orange-tint/15 text-brand-orange text-xs font-black flex items-center justify-center shrink-0">
                        {member.user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-black text-text-primary truncate">
                        {member.user.name}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={assigned.roleOnProject}
                      onChange={(e) => handleRoleChange(assigned.teamMemberId, e.target.value)}
                      placeholder="e.g. Developer"
                      disabled={isPending}
                      className="h-8 w-36 rounded-md border border-border bg-surface-page px-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-orange"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 9. Technologies Used Tag Input */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-extrabold text-text-primary uppercase tracking-wider">
          Technologies Used (Tags)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                handleAddTag();
              }
            }}
            placeholder="Add tech tag (press enter or comma)..."
            className="flex h-9 flex-1 rounded-lg border border-border bg-surface-page px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-page hover:bg-border text-text-primary transition-colors cursor-pointer"
          >
            <IconPlus className="h-4.5 w-4.5" />
          </button>
        </div>
        {techStack.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-1.5">
            {techStack.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-md bg-brand-orange-tint/15 border border-brand-orange-tint/20 px-2 py-0.5 text-xs font-bold text-brand-orange select-none"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="rounded-sm hover:bg-brand-orange/20 text-brand-orange transition-colors cursor-pointer"
                >
                  <IconX className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-text-secondary/70 italic font-bold select-none">No tech stack added yet.</p>
        )}
      </div>

      {/* Action Footer Buttons (Cancel & Create) */}
      <div className="flex items-center justify-end gap-3 pt-5 border-t border-border select-none">
        <button
          type="button"
          onClick={onCancel}
          className="px-4.5 h-9 text-xs font-bold text-text-secondary border border-border rounded-lg bg-surface-white hover:bg-surface-page transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-5 h-9 text-xs font-bold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
        >
          {isPending ? <IconLoader className="h-4 w-4 animate-spin" /> : null}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

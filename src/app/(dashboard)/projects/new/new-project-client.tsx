"use client";

import { useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  IconArrowLeft,
  IconCalendar,
  IconPlus,
  IconTrash,
  IconAlertCircle,
  IconLoader,
  IconChevronDown,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { createProject, type ProjectInput } from "../actions";

type Client = {
  id: string;
  name: string;
};

type TeamMember = {
  id: string;
  user: {
    name: string;
    email: string;
  };
};

type NewProjectClientProps = {
  clients: Client[];
  teamMembers: TeamMember[];
};

function NewProjectForm({ clients, teamMembers }: NewProjectClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientIdParam = searchParams.get("clientId") || "";

  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");

  // Basic info states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [projectType, setProjectType] = useState<"one-off" | "retainer">("one-off");
  const [selectedClientId, setSelectedClientId] = useState(clientIdParam);
  const [status, setStatus] = useState<ProjectInput["status"]>("NEW");
  const [budget, setBudget] = useState("");
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");

  // Domain & Hosting state
  const [showDomain, setShowDomain] = useState(false);
  const [domainName, setDomainName] = useState("");
  const [domainExpiry, setDomainExpiry] = useState("");

  // Team Member Assignments state
  const [assignedMembers, setAssignedMembers] = useState<{
    teamMemberId: string;
    name: string;
    roleOnProject: string;
  }[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [tempMemberId, setTempMemberId] = useState("");
  const [tempRole, setTempRole] = useState("");

  // Add a team member
  const handleAddMember = () => {
    if (!tempMemberId) return;
    const memberObj = teamMembers.find((m) => m.id === tempMemberId);
    if (!memberObj) return;

    // Check if already assigned
    if (assignedMembers.some((m) => m.teamMemberId === tempMemberId)) {
      setErrorMsg("Founder already assigned to this project.");
      return;
    }

    setAssignedMembers([
      ...assignedMembers,
      {
        teamMemberId: tempMemberId,
        name: memberObj.user.name,
        roleOnProject: tempRole || "Co-founder",
      },
    ]);
    setTempMemberId("");
    setTempRole("");
    setShowAddMember(false);
  };

  // Remove a team member
  const handleRemoveMember = (id: string) => {
    setAssignedMembers(assignedMembers.filter((m) => m.teamMemberId !== id));
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name) {
      setErrorMsg("Project name is required.");
      return;
    }
    if (!selectedClientId) {
      setErrorMsg("Please select a client.");
      return;
    }
    if (!budget || isNaN(Number(budget)) || Number(budget) < 0) {
      setErrorMsg("Please enter a valid budget amount.");
      return;
    }

    const payload: ProjectInput = {
      name,
      description,
      status,
      budget: Number(budget),
      clientId: selectedClientId,
      startDate: startDate || undefined,
      deadline: deadline || undefined,
      domain: showDomain && domainName ? domainName : undefined,
      domainExpiry: showDomain && domainExpiry ? domainExpiry : undefined,
      teamMemberAssignments: assignedMembers.map((m) => ({
        teamMemberId: m.teamMemberId,
        roleOnProject: m.roleOnProject,
      })),
    };

    startTransition(async () => {
      const res = await createProject(payload);
      if (res.success) {
        // Redirect back to clients (or clients detailed list page)
        router.push("/clients");
      } else {
        setErrorMsg(res.error || "Failed to create project.");
      }
    });
  };

  return (
    <div className="max-w-[760px] mx-auto space-y-6 font-sans pb-12">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-brand-orange transition-colors cursor-pointer select-none"
      >
        <IconArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Header text */}
      <div className="space-y-1.5">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-text-primary">
          Create New Project
        </h1>
        <p className="text-sm text-text-secondary">
          Set up a new project for your client
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errorMsg && (
          <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 p-4 rounded-xl text-xs border border-rose-200 dark:border-rose-900/50 flex items-center gap-2">
            <IconAlertCircle className="h-4.5 w-4.5 shrink-0" />
            <span className="font-bold">{errorMsg}</span>
          </div>
        )}

        {/* CARD 1: Basic Information */}
        <div className="bg-surface-white border border-border rounded-xl p-4 sm:p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-extrabold text-text-primary border-b border-border/60 pb-2">
            Basic Information
          </h3>

          {/* Project Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Project Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Website Redesign"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
              className="flex h-9 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Description
            </label>
            <textarea
              placeholder="Provide a brief outline of project requirements..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isPending}
              className="flex w-full rounded-lg border border-border bg-surface-page px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
            />
          </div>

          {/* Project Type */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-primary uppercase tracking-wider block">
              Project Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* One-off Project */}
              <div
                onClick={() => !isPending && setProjectType("one-off")}
                className={`border rounded-xl p-4 cursor-pointer select-none transition-all ${
                  projectType === "one-off"
                    ? "border-brand-orange bg-[#FFEDE5]/15 dark:bg-[#4C1A0E]/10 ring-1 ring-brand-orange"
                    : "border-border bg-surface-white hover:border-brand-orange/60"
                }`}
              >
                <span className="font-extrabold text-xs text-text-primary block">
                  One-off Project
                </span>
                <span className="text-[10px] text-text-secondary mt-0.5 block">
                  Fixed scope & budget
                </span>
              </div>

              {/* Monthly Retainer */}
              <div
                onClick={() => !isPending && setProjectType("retainer")}
                className={`border rounded-xl p-4 cursor-pointer select-none transition-all ${
                  projectType === "retainer"
                    ? "border-brand-orange bg-[#FFEDE5]/15 dark:bg-[#4C1A0E]/10 ring-1 ring-brand-orange"
                    : "border-border bg-surface-white hover:border-brand-orange/60"
                }`}
              >
                <span className="font-extrabold text-xs text-text-primary block">
                  Monthly Retainer
                </span>
                <span className="text-[10px] text-text-secondary mt-0.5 block">
                  Recurring monthly fee
                </span>
              </div>
            </div>
          </div>

          {/* Client & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 relative">
              <label className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Client <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  required
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  disabled={isPending}
                  className="flex h-9 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold appearance-none cursor-pointer"
                >
                  <option value="">Select a Client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <IconChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5 relative">
              <label className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Status
              </label>
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProjectInput["status"])}
                  disabled={isPending}
                  className="flex h-9 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold appearance-none cursor-pointer"
                >
                  <option value="NEW">New</option>
                  <option value="ONGOING">Ongoing</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ON_HOLD">On Hold</option>
                </select>
                <IconChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Budget */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Budget <span className="text-rose-500">*</span> (INR)
            </label>
            <input
              type="text"
              required
              placeholder="0.00"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              disabled={isPending}
              className="flex h-9 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
            />
          </div>

          {/* Start Date & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Start Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={isPending}
                  className="flex h-9 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold select-none pr-8 cursor-pointer"
                />
                <IconCalendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-text-secondary pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Deadline
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  disabled={isPending}
                  className="flex h-9 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold select-none pr-8 cursor-pointer"
                />
                <IconCalendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-text-secondary pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: Domain & Hosting */}
        <div className="bg-surface-white border border-border rounded-xl p-4 sm:p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <div>
              <h3 className="text-sm font-extrabold text-text-primary">
                Domain & Hosting
              </h3>
              <p className="text-[10px] text-text-secondary mt-0.5">
                Optional — track renewal dates to get expiry warnings.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDomain(!showDomain)}
              className="text-xs font-bold text-brand-orange hover:text-brand-orange-hover hover:underline cursor-pointer select-none"
            >
              {showDomain ? "Remove" : "Add"}
            </button>
          </div>

          {showDomain && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Domain Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. greenfieldventures.com"
                  value={domainName}
                  onChange={(e) => setDomainName(e.target.value)}
                  disabled={isPending}
                  className="flex h-9 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Renewal Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={domainExpiry}
                    onChange={(e) => setDomainExpiry(e.target.value)}
                    disabled={isPending}
                    className="flex h-9 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-sm pr-8 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange font-semibold cursor-pointer"
                  />
                  <IconCalendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-text-secondary pointer-events-none" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CARD 3: Assign Team Members */}
        <div className="bg-surface-white border border-border rounded-xl p-4 sm:p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <h3 className="text-sm font-extrabold text-text-primary">
              Assign Team Members
            </h3>
            <button
              type="button"
              onClick={() => setShowAddMember(!showAddMember)}
              className="h-8 border border-border bg-surface-page hover:bg-surface-white text-xs font-bold px-3 rounded-lg flex items-center gap-1 cursor-pointer select-none shadow-sm"
            >
              <IconPlus className="h-4 w-4" stroke={2.5} /> Add Member
            </button>
          </div>

          {/* Add member inline editor */}
          {showAddMember && (
            <div className="bg-surface-page border border-border/80 rounded-xl p-4 gap-4 flex flex-col sm:flex-row sm:items-end justify-between">
              <div className="space-y-1.5 flex-1 relative">
                <label className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Co-founder
                </label>
                <div className="relative">
                  <select
                    value={tempMemberId}
                    onChange={(e) => setTempMemberId(e.target.value)}
                    className="flex h-9 w-full rounded-lg border border-border bg-surface-white px-3 py-1 text-sm appearance-none font-semibold cursor-pointer"
                  >
                    <option value="">Select Member</option>
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.user.name}
                      </option>
                    ))}
                  </select>
                  <IconChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5 flex-1">
                <label className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Role on Project
                </label>
                <input
                  type="text"
                  placeholder="e.g. Full-stack Developer"
                  value={tempRole}
                  onChange={(e) => setTempRole(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-border bg-surface-white px-3 py-1 text-sm font-semibold"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleAddMember}
                  className="h-9 bg-brand-orange text-white hover:bg-brand-orange-hover px-4 rounded-lg font-bold text-xs cursor-pointer"
                >
                  Confirm
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddMember(false)}
                  className="h-9 bg-surface-white border border-border text-xs rounded-lg font-medium cursor-pointer"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Assigned Members list */}
          {assignedMembers.length > 0 ? (
            <div className="divide-y divide-border/60">
              {assignedMembers.map((member) => (
                <div
                  key={member.teamMemberId}
                  className="py-3 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-extrabold text-text-primary block">
                      {member.name}
                    </span>
                    <span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider block">
                      {member.roleOnProject}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(member.teamMemberId)}
                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-full transition-colors cursor-pointer select-none"
                  >
                    <IconTrash className="h-4.5 w-4.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-text-secondary text-xs select-none">
              No team members assigned yet. Click &quot;Add Member&quot; to assign team members.
            </div>
          )}
        </div>

        {/* BOTTOM FORM BUTTONS */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => router.back()}
            className="w-full sm:w-auto h-9 bg-surface-white border border-border text-xs rounded-lg font-medium px-4 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="w-full sm:w-auto h-9 bg-brand-orange text-white hover:bg-brand-orange-hover rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 px-4 cursor-pointer shadow-sm"
          >
            {isPending ? (
              <>
                <IconLoader className="h-4.5 w-4.5 animate-spin" /> Saving...
              </>
            ) : (
              "Create Project"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function NewProjectClient({ clients, teamMembers }: NewProjectClientProps) {
  return (
    <Suspense fallback={
      <div className="h-96 flex items-center justify-center">
        <IconLoader className="h-8 w-8 animate-spin text-brand-orange" />
      </div>
    }>
      <NewProjectForm clients={clients} teamMembers={teamMembers} />
    </Suspense>
  );
}

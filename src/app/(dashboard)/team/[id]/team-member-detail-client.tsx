"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconArrowLeft,
  IconEdit,
  IconCurrencyRupee,
  IconBriefcase,
  IconPlus,
  IconPhone,
  IconMail,
  IconCalendar,
  IconCheck,
  IconAlertCircle,
  IconUsers,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { TeamMemberForm, type TeamMemberFormValues } from "@/components/team/team-member-form";
import { TeamPaymentForm, type TeamPaymentFormValues } from "@/components/team/team-payment-form";
import { TeamPaymentHistoryTable, type TeamPaymentItem } from "@/components/team/team-payment-history-table";
import { updateTeamMember, createTeamPayment, updateTeamPaymentStatus, deleteTeamPayment } from "../actions";
import { PaymentStatus } from "@/lib/enums";
import { DeliveryBadge } from "@/components/projects/delivery-badge";

type MemberDetail = {
  id: string;
  userId: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  title: string | null;
  skills: string[];
  phone: string | null;
  bio: string | null;
  createdAt: string;
  totalPaid: number;
  pendingAmount: number;
  assignments: {
    id: string;
    projectId: string;
    projectName: string;
    clientName: string;
    projectStatus: string;
    projectBudget: number;
    projectProgress: number;
    roleOnProject: string | null;
    deadline?: string | null;
    completedAt?: string | null;
  }[];
  payments: TeamPaymentItem[];
  allProjects: {
    id: string;
    name: string;
    clientName?: string;
  }[];
};

type TeamMemberDetailClientProps = {
  member: MemberDetail;
};

const getAvatarGradient = (name: string) => {
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradients = [
    "from-orange-500 to-amber-500 text-white shadow-orange-500/20",
    "from-blue-600 to-cyan-500 text-white shadow-blue-500/20",
    "from-emerald-600 to-teal-500 text-white shadow-emerald-500/20",
    "from-purple-600 to-indigo-500 text-white shadow-purple-500/20",
  ];
  return gradients[hash % gradients.length];
};

const getInitials = (name: string) => {
  if (!name) return "TM";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export function TeamMemberDetailClient({ member }: TeamMemberDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"projects" | "payments">("payments");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPayoutOpen, setIsPayoutOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [payoutErrorMsg, setPayoutErrorMsg] = useState("");

  const avatarGrad = getAvatarGradient(member.name);
  const initials = getInitials(member.name);

  // Edit Profile submit
  const handleEditSubmit = (values: TeamMemberFormValues) => {
    setErrorMsg("");
    startTransition(async () => {
      const res = await updateTeamMember(member.id, values);
      if (res.success) {
        setIsEditOpen(false);
        router.refresh();
      } else {
        setErrorMsg(res.error || "Failed to update team member.");
      }
    });
  };

  // Log Payout submit
  const handlePayoutSubmit = (values: TeamPaymentFormValues) => {
    setPayoutErrorMsg("");
    startTransition(async () => {
      const res = await createTeamPayment({
        teamMemberId: member.id,
        amount: values.amount,
        status: values.status as any,
        method: values.method as any,
        paidAt: values.paidAt,
        projectId: values.projectId,
        notes: values.notes,
      });

      if (res.success) {
        setIsPayoutOpen(false);
        router.refresh();
      } else {
        setPayoutErrorMsg(res.error || "Failed to log payout.");
      }
    });
  };

  // Mark pending payment as paid
  const handleMarkPaid = (paymentId: string) => {
    startTransition(async () => {
      const res = await updateTeamPaymentStatus(paymentId, PaymentStatus.COMPLETED);
      if (res.success) {
        router.refresh();
      }
    });
  };

  // Delete payment record
  const handleDeletePayment = (paymentId: string) => {
    if (!confirm("Are you sure you want to delete this payout record?")) return;
    startTransition(async () => {
      const res = await deleteTeamPayment(paymentId);
      if (res.success) {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Back button */}
      <Link
        href="/team"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-brand-orange transition-colors select-none"
      >
        <IconArrowLeft className="h-4 w-4" /> Back to Team List
      </Link>

      {/* Member Hero Header Card */}
      <div className="bg-surface-white border border-border rounded-xl p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3.5">
            {member.image ? (
              <img
                src={member.image}
                alt={member.name}
                className="w-12 h-12 rounded-full object-cover border border-border shrink-0 shadow-xs"
              />
            ) : (
              <div className={`w-12 h-12 rounded-full bg-gradient-to-tr ${avatarGrad} flex items-center justify-center font-extrabold text-base text-white select-none shadow shrink-0`}>
                {initials}
              </div>
            )}

            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-extrabold text-text-primary capitalize tracking-tight">
                  {member.name}
                </h1>
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase bg-brand-orange-tint text-brand-orange border border-brand-orange/20">
                  {member.role}
                </span>
              </div>

              <p className="text-[11px] font-semibold text-text-secondary">
                {member.title || "Co-Founder / Partner"}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-[11px] text-text-secondary font-medium pt-0.5">
                <span className="flex items-center gap-1">
                  <IconMail className="h-3.5 w-3.5 text-text-secondary/70" /> {member.email}
                </span>
                {member.phone && (
                  <span className="flex items-center gap-1">
                    <IconPhone className="h-3.5 w-3.5 text-text-secondary/70" /> {member.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Edit Profile Sheet Trigger */}
          <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
            <SheetTrigger className="h-9 px-3.5 bg-surface-page border border-border hover:bg-surface-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs rounded-lg inline-flex items-center justify-center text-text-primary">
              <IconEdit className="h-4 w-4 text-text-secondary" /> Edit Profile
            </SheetTrigger>
            <SheetContent className="sm:max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="text-lg font-bold">Edit Team Profile</SheetTitle>
                <SheetDescription className="text-xs">
                  Update contact details, role title, and skills tags for {member.name}.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4">
                <TeamMemberForm
                  defaultValues={{
                    name: member.name,
                    email: member.email,
                    title: member.title || "",
                    phone: member.phone || "",
                    bio: member.bio || "",
                    skills: member.skills,
                  }}
                  onSubmit={handleEditSubmit}
                  onCancel={() => setIsEditOpen(false)}
                  isPending={isPending}
                  errorMsg={errorMsg}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Skills & Bio */}
        {(member.skills.length > 0 || member.bio) && (
          <div className="mt-5 pt-4 border-t border-border/60 space-y-3">
            {member.skills.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary mr-1">
                  Skills:
                </span>
                {member.skills.map((skill) => (
                  <span
                    key={skill}
                    className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-200 border border-stone-200/60"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
            {member.bio && (
              <p className="text-xs text-text-secondary font-medium italic">
                "{member.bio}"
              </p>
            )}
          </div>
        )}
      </div>

      {/* KPI Financial Cards */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        {/* Total Paid Out */}
        <div className="p-4 bg-surface-white border border-border rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold uppercase text-text-secondary tracking-wider block">
              Total Paid Out
            </span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-tight mt-0.5 block">
              ₹{member.totalPaid.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <IconCurrencyRupee className="h-5 w-5" />
          </div>
        </div>

        {/* Pending Amount Owed */}
        <div className="p-4 bg-surface-white border border-border rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold uppercase text-text-secondary tracking-wider block">
              Pending Owed
            </span>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400 leading-tight mt-0.5 block">
              ₹{member.pendingAmount.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <IconAlertCircle className="h-5 w-5" />
          </div>
        </div>

        {/* Assigned Projects Count */}
        <div className="p-4 bg-surface-white border border-border rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold uppercase text-text-secondary tracking-wider block">
              Assigned Projects
            </span>
            <span className="text-2xl font-black text-stone-900 dark:text-stone-100 leading-tight mt-0.5 block">
              {member.assignments.length}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-orange-50 text-brand-orange flex items-center justify-center border border-orange-100">
            <IconBriefcase className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Tabs & Action Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2 select-none">
          <button
            onClick={() => setActiveTab("payments")}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "payments"
                ? "bg-brand-orange text-white shadow-xs"
                : "bg-surface-white text-text-secondary hover:text-text-primary border border-border"
            }`}
          >
            <IconCurrencyRupee className="h-4 w-4" /> Team Payout Log ({member.payments.length})
          </button>
          <button
            onClick={() => setActiveTab("projects")}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "projects"
                ? "bg-brand-orange text-white shadow-xs"
                : "bg-surface-white text-text-secondary hover:text-text-primary border border-border"
            }`}
          >
            <IconBriefcase className="h-4 w-4" /> Assigned Projects ({member.assignments.length})
          </button>
        </div>

        {activeTab === "payments" && (
          <Sheet open={isPayoutOpen} onOpenChange={setIsPayoutOpen}>
            <SheetTrigger className="h-9 px-4 bg-brand-orange text-white hover:bg-brand-orange-hover font-bold text-xs flex items-center gap-1.5 cursor-pointer rounded-lg shadow-xs inline-flex items-center justify-center">
              <IconPlus className="h-4 w-4" /> Log Payout
            </SheetTrigger>
            <SheetContent className="sm:max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="text-lg font-bold">Log Internal Payout</SheetTitle>
                <SheetDescription className="text-xs">
                  Record money paid or owed to {member.name}.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4">
                <TeamPaymentForm
                  projects={member.allProjects}
                  onSubmit={handlePayoutSubmit}
                  onCancel={() => setIsPayoutOpen(false)}
                  isPending={isPending}
                  errorMsg={payoutErrorMsg}
                />
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === "payments" ? (
        <TeamPaymentHistoryTable
          payments={member.payments}
          onMarkPaid={handleMarkPaid}
          onDelete={handleDeletePayment}
          isPending={isPending}
        />
      ) : (
        <div className="space-y-4">
          {member.assignments.length > 0 ? (
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
              {member.assignments.map((ass) => (
                <div
                  key={ass.id}
                  className="bg-surface-white border border-border rounded-xl p-4 shadow-xs hover:border-brand-orange/30 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/projects/${ass.projectId}`}
                        className="font-bold text-text-primary text-sm hover:text-brand-orange transition-colors capitalize"
                      >
                        {ass.projectName}
                      </Link>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase bg-stone-100 text-stone-700">
                        {ass.projectStatus.toLowerCase()}
                      </span>
                    </div>

                    <p className="text-xs text-text-secondary font-medium">
                      Client: <span className="font-bold text-text-primary capitalize">{ass.clientName}</span>
                    </p>

                    {ass.roleOnProject && (
                      <p className="text-[11px] text-brand-orange font-bold">
                        Role: {ass.roleOnProject}
                      </p>
                    )}
                  </div>

                  {/* Progress & Delivery Badge */}
                  <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs font-semibold">
                    <span className="text-text-secondary">
                      Budget: ₹{ass.projectBudget.toLocaleString("en-IN")}
                    </span>
                    <DeliveryBadge
                      deadline={ass.deadline}
                      completedAt={ass.completedAt}
                      status={ass.projectStatus}
                      size="sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface-white border border-border rounded-xl p-8 text-center space-y-2">
              <p className="text-sm font-bold text-text-primary">No assigned projects</p>
              <p className="text-xs text-text-secondary">
                This team member is not currently assigned to any active project contracts.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

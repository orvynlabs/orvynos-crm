"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { PaymentMethod, PaymentStatus } from "@/lib/enums";
import { getTeamMemberTotalPaid, getTeamMemberPendingAmount } from "@/lib/finance";

export type UpdateTeamMemberInput = {
  name?: string;
  email?: string;
  title?: string;
  skills: string[];
  phone?: string;
  bio?: string;
};

export type TeamPaymentInput = {
  teamMemberId: string;
  projectId?: string;
  amount: number;
  status?: PaymentStatus;
  method?: PaymentMethod;
  paidAt?: string;
  notes?: string;
};

// Ultra-fast dedicated query for sidebar live team status (< 2ms)
export async function getSidebarTeamStatus() {
  try {
    const members = await prisma.teamMember.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        user: {
          select: {
            name: true,
            image: true,
          },
        },
        dailyUpdates: {
          take: 1,
          orderBy: { date: "desc" },
          select: {
            workingOnNext: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    });

    return {
      success: true,
      data: members.map((m) => ({
        id: m.id,
        name: m.user.name,
        image: m.user.image,
        title: m.title,
        status: m.status,
        dailyUpdates: m.dailyUpdates,
      })),
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getTeamMembers() {
  try {
    const hasDailyUpdatesModel = Boolean((prisma as any).dailyUpdate);

    const members = await prisma.teamMember.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
        assignments: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
          },
        },
        ...(hasDailyUpdatesModel && {
          dailyUpdates: {
            take: 5,
            orderBy: {
              createdAt: "desc" as const,
            },
          },
        }),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const enrichedMembers = await Promise.all(
      members.map(async (m: any) => {
        const totalPaid = await getTeamMemberTotalPaid(m.id);
        const pendingAmount = await getTeamMemberPendingAmount(m.id);

        return {
          id: m.id,
          userId: m.userId,
          name: m.user.name,
          email: m.user.email,
          image: m.user.image,
          role: m.user.role,
          title: m.title,
          skills: m.skills,
          phone: m.phone,
          bio: m.bio,
          status: m.status || "AVAILABLE",
          assignedProjectsCount: m.assignments.length,
          assignments: m.assignments.map((a: any) => ({
            id: a.id,
            projectId: a.projectId,
            projectName: a.project.name,
            projectStatus: a.project.status,
            roleOnProject: a.roleOnProject,
          })),
          dailyUpdates: m.dailyUpdates ? m.dailyUpdates.map((u: any) => ({
            id: u.id,
            completedToday: u.completedToday,
            workingOnNext: u.workingOnNext,
            blockers: u.blockers,
            date: u.date.toISOString(),
            createdAt: u.createdAt.toISOString(),
          })) : [],
          totalPaid,
          pendingAmount,
          createdAt: m.createdAt.toISOString(),
        };
      })
    );

    return { success: true, data: enrichedMembers };
  } catch (error: any) {
    console.error("Failed to fetch team members:", error);
    return { success: false, error: error?.message || "Failed to fetch team members", data: [] };
  }
}

export async function updateTeamMemberStatus(id: string, status: "AVAILABLE" | "BUSY" | "ON_LEAVE") {
  try {
    await prisma.teamMember.update({
      where: { id },
      data: { status },
    });

    revalidatePath("/team");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update status:", error);
    return { success: false, error: error?.message || "Failed to update status" };
  }
}

export async function createDailyUpdate(data: {
  teamMemberId: string;
  completedToday: string;
  workingOnNext: string;
  blockers?: string;
}) {
  try {
    if (!data.teamMemberId) throw new Error("Team member is required");
    if (!data.completedToday.trim()) throw new Error("Completed today is required");
    if (!data.workingOnNext.trim()) throw new Error("Working on next is required");

    // Resolve valid teamMemberId to prevent foreign key constraint violations
    let member = await prisma.teamMember.findFirst({
      where: {
        OR: [{ id: data.teamMemberId }, { userId: data.teamMemberId }],
      },
      select: { id: true },
    });

    if (!member) {
      member = await prisma.teamMember.findFirst({ select: { id: true } });
    }

    if (!member) {
      throw new Error("No team member found in database");
    }

    const update = await (prisma as any).dailyUpdate.create({
      data: {
        teamMemberId: member.id,
        completedToday: data.completedToday.trim(),
        workingOnNext: data.workingOnNext.trim(),
        blockers: data.blockers?.trim() || null,
      },
    });

    revalidatePath("/team");
    return { success: true, data: update };
  } catch (error: any) {
    console.error("Failed to create daily update:", error);
    return { success: false, error: error?.message || "Failed to post daily update" };
  }
}

export async function getRecentDailyUpdates() {
  try {
    if (!(prisma as any).dailyUpdate) {
      return { success: true, data: [] };
    }

    const updates = await (prisma as any).dailyUpdate.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        teamMember: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });

    return {
      success: true,
      data: updates.map((u: any) => ({
        id: u.id,
        teamMemberId: u.teamMemberId,
        memberName: u.teamMember.user.name,
        memberTitle: u.teamMember.title,
        memberImage: u.teamMember.user.image,
        completedToday: u.completedToday,
        workingOnNext: u.workingOnNext,
        blockers: u.blockers,
        createdAt: u.createdAt.toISOString(),
      })),
    };
  } catch (error: any) {
    console.error("Failed to fetch daily updates:", error);
    return { success: false, error: error?.message || "Failed to fetch daily updates", data: [] };
  }
}

export async function deleteDailyUpdate(id: string) {
  try {
    if (!id) throw new Error("Update ID is required");

    await (prisma as any).dailyUpdate.delete({
      where: { id },
    });

    revalidatePath("/team");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete daily update:", error);
    return { success: false, error: error?.message || "Failed to delete daily update" };
  }
}

export async function getTeamMemberDetail(id: string) {
  try {
    const [member, projects] = await Promise.all([
      prisma.teamMember.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true,
            },
          },
          assignments: {
            include: {
              project: {
                select: {
                  id: true,
                  name: true,
                  status: true,
                  budget: true,
                  progress: true,
                  client: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
          payments: {
            include: {
              project: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc" as const,
            },
          },
        },
      }),
      prisma.project.findMany({
        select: {
          id: true,
          name: true,
          client: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          name: "asc" as const,
        },
      }),
    ]);

    if (!member) {
      return { success: false, error: "Team member not found", data: null };
    }

    const [totalPaid, pendingAmount] = await Promise.all([
      getTeamMemberTotalPaid(member.id),
      getTeamMemberPendingAmount(member.id),
    ]);

    return {
      success: true,
      data: {
        id: member.id,
        userId: member.userId,
        name: member.user.name,
        email: member.user.email,
        image: member.user.image,
        role: member.user.role,
        title: member.title,
        skills: member.skills,
        phone: member.phone,
        bio: member.bio,
        createdAt: member.createdAt.toISOString(),
        totalPaid,
        pendingAmount,
        assignments: member.assignments.map((a) => ({
          id: a.id,
          projectId: a.projectId,
          projectName: a.project.name,
          clientName: a.project.client.name,
          projectStatus: a.project.status,
          projectBudget: Number(a.project.budget),
          projectProgress: a.project.progress,
          roleOnProject: a.roleOnProject,
        })),
        payments: member.payments.map((p) => ({
          id: p.id,
          teamMemberId: p.teamMemberId,
          projectId: p.projectId,
          projectName: p.project?.name || null,
          amount: Number(p.amount),
          status: p.status,
          method: p.method,
          paidAt: p.paidAt ? p.paidAt.toISOString() : null,
          notes: p.notes,
          createdAt: p.createdAt.toISOString(),
        })),
        allProjects: projects.map((pr) => ({
          id: pr.id,
          name: pr.name,
          clientName: pr.client.name,
        })),
      },
    };
  } catch (error: any) {
    console.error("Failed to fetch team member detail:", error);
    return { success: false, error: error?.message || "Failed to fetch team member detail", data: null };
  }
}

export async function updateTeamMember(id: string, data: UpdateTeamMemberInput) {
  try {
    const member = await prisma.teamMember.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!member) {
      throw new Error("Team member not found");
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: member.userId },
        data: {
          ...(data.name && { name: data.name.trim() }),
          ...(data.email && { email: data.email.trim().toLowerCase() }),
        },
      }),
      prisma.teamMember.update({
        where: { id },
        data: {
          title: data.title !== undefined ? data.title.trim() || null : undefined,
          skills: data.skills.map((s) => s.trim()).filter(Boolean),
          phone: data.phone !== undefined ? data.phone.trim() || null : undefined,
          bio: data.bio !== undefined ? data.bio.trim() || null : undefined,
        },
      }),
    ]);

    revalidatePath("/team");
    revalidatePath(`/team/${id}`);

    return { success: true };
  } catch (error: any) {
    console.error("Failed to update team member:", error);
    return { success: false, error: error?.message || "Failed to update team member" };
  }
}

export async function createTeamPayment(data: TeamPaymentInput) {
  try {
    if (!data.teamMemberId) throw new Error("Team member is required");
    if (isNaN(data.amount) || data.amount <= 0) throw new Error("Amount must be greater than 0");

    const paidAtDate = data.paidAt ? new Date(data.paidAt) : data.status === PaymentStatus.COMPLETED ? new Date() : null;

    const payment = await prisma.teamPayment.create({
      data: {
        teamMemberId: data.teamMemberId,
        projectId: data.projectId || null,
        amount: data.amount,
        status: data.status || PaymentStatus.PENDING,
        method: data.method || null,
        paidAt: paidAtDate,
        notes: data.notes || null,
      },
    });

    revalidatePath("/team");
    revalidatePath(`/team/${data.teamMemberId}`);

    return { success: true, data: payment };
  } catch (error: any) {
    console.error("Failed to create team payment:", error);
    return { success: false, error: error?.message || "Failed to log team payment" };
  }
}

export async function updateTeamPaymentStatus(
  paymentId: string,
  status: PaymentStatus,
  method?: PaymentMethod,
  paidAt?: string
) {
  try {
    const payment = await prisma.teamPayment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new Error("Team payment record not found");
    }

    const paidAtDate = paidAt ? new Date(paidAt) : status === PaymentStatus.COMPLETED ? new Date() : null;

    await prisma.teamPayment.update({
      where: { id: paymentId },
      data: {
        status,
        ...(method && { method }),
        paidAt: paidAtDate,
      },
    });

    revalidatePath("/team");
    revalidatePath(`/team/${payment.teamMemberId}`);

    return { success: true };
  } catch (error: any) {
    console.error("Failed to update team payment status:", error);
    return { success: false, error: error?.message || "Failed to update payment status" };
  }
}

export async function deleteTeamPayment(paymentId: string) {
  try {
    const payment = await prisma.teamPayment.findUnique({
      where: { id: paymentId },
      select: { teamMemberId: true },
    });

    if (!payment) {
      throw new Error("Team payment record not found");
    }

    await prisma.teamPayment.delete({
      where: { id: paymentId },
    });

    revalidatePath("/team");
    revalidatePath(`/team/${payment.teamMemberId}`);

    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete team payment:", error);
    return { success: false, error: error?.message || "Failed to delete payment" };
  }
}

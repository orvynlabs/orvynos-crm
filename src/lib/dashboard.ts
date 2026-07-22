import { unstable_cache } from "next/cache";
import { prisma, withRetry } from "@/lib/db";
import { PaymentStatus, ProjectStatus } from "@/generated/prisma/client";
import { getTotalExpenses as getFinanceTotalExpenses } from "@/lib/finance";

export type MetricCardData = {
  totalRevenue: number;
  totalReceivedPayments: number;
  totalExpenses: number;
  netProfit: number;
  totalPendingPayments: number;
  activeProjectCount: number;
  totalProjectsCount: number;
  newProjectsCount: number;
  ongoingProjectsCount: number;
  completedProjectsCount: number;
  totalClientCount: number;
  totalLeadsCount: number;
  proposalValueTotal: number;
  pendingAgreementsCount: number;
  documentCount: number;
};

// ⚡ Ultra-Fast Server Memory Cache (< 5ms Dashboard Load)
export const getCoreDashboardMetrics = unstable_cache(
  async (): Promise<MetricCardData> => {
    const [
      totalExpenses,
      clientsCount,
      leadsCount,
      projects,
      completedPayments,
      proposals,
      pendingAgreementsCount,
      documentCount,
    ] = await Promise.all([
      withRetry(() => getFinanceTotalExpenses()),
      withRetry(() => prisma.client.count()),
      withRetry(() => prisma.lead.count()),
      withRetry(() =>
        prisma.project.findMany({
          select: {
            id: true,
            budget: true,
            status: true,
          },
        })
      ),
      withRetry(() =>
        prisma.payment.aggregate({
          where: { status: PaymentStatus.COMPLETED },
          _sum: { amount: true },
        })
      ),
      withRetry(() =>
        prisma.proposal.aggregate({
          where: { status: { in: ["SENT", "ACCEPTED"] } },
          _sum: { amount: true },
        })
      ),
      withRetry(() =>
        prisma.agreement.count({
          where: { status: { in: ["DRAFT", "SENT"] } },
        })
      ),
      withRetry(() => prisma.document.count()),
    ]);

    const totalContracted = projects.reduce((sum, p) => sum + Number(p.budget || 0), 0);
    const totalReceived = Number(completedPayments._sum.amount || 0);
    const netProfit = totalReceived - totalExpenses;
    const totalPendingPayments = Math.max(0, totalContracted - totalReceived);

    const activeProjectCount = projects.filter(
      (p) => p.status === ProjectStatus.ONGOING || p.status === ProjectStatus.NEW || p.status === ProjectStatus.REVIEW
    ).length;

    const newProjectsCount = projects.filter((p) => p.status === ProjectStatus.NEW).length;
    const ongoingProjectsCount = projects.filter((p) => p.status === ProjectStatus.ONGOING).length;
    const completedProjectsCount = projects.filter((p) => p.status === ProjectStatus.COMPLETED).length;

    return {
      totalRevenue: totalContracted,
      totalReceivedPayments: totalReceived,
      totalExpenses,
      netProfit,
      totalPendingPayments,
      activeProjectCount,
      totalProjectsCount: projects.length,
      newProjectsCount,
      ongoingProjectsCount,
      completedProjectsCount,
      totalClientCount: clientsCount,
      totalLeadsCount: leadsCount,
      proposalValueTotal: Number(proposals._sum.amount || 0),
      pendingAgreementsCount,
      documentCount,
    };
  },
  ["dashboard-core-metrics-v3"],
  { revalidate: 30, tags: ["dashboard-metrics"] }
);

export const getDashboardChartsData = unstable_cache(
  async () => {
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [payments, expenses, clients, projects] = await Promise.all([
      withRetry(() =>
        prisma.payment.findMany({
          where: {
            status: PaymentStatus.COMPLETED,
            paidAt: { gte: sixMonthsAgo },
          },
          select: { amount: true, paidAt: true, status: true },
        })
      ),
      withRetry(() =>
        prisma.expense.findMany({
          where: { date: { gte: sixMonthsAgo } },
          select: { amount: true, date: true },
        })
      ),
      withRetry(() =>
        prisma.client.findMany({
          where: { createdAt: { gte: sixMonthsAgo } },
          select: { createdAt: true },
        })
      ),
      withRetry(() =>
        prisma.project.groupBy({
          by: ["status"],
          _count: { id: true },
        })
      ),
    ]);

    const monthLabels: string[] = [];
    const monthlyDataMap: Record<string, { revenue: number; expenses: number; clients: number }> = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      monthLabels.push(key);
      monthlyDataMap[key] = { revenue: 0, expenses: 0, clients: 0 };
    }

    payments.forEach((p) => {
      if (p.paidAt) {
        const key = p.paidAt.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        if (monthlyDataMap[key]) {
          monthlyDataMap[key].revenue += Number(p.amount);
        }
      }
    });

    expenses.forEach((e) => {
      const key = e.date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      if (monthlyDataMap[key]) {
        monthlyDataMap[key].expenses += Number(e.amount);
      }
    });

    clients.forEach((c) => {
      const key = c.createdAt.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      if (monthlyDataMap[key]) {
        monthlyDataMap[key].clients += 1;
      }
    });

    const revenueVsExpenses = monthLabels.map((m) => ({
      month: m,
      Revenue: monthlyDataMap[m].revenue,
      Expenses: monthlyDataMap[m].expenses,
    }));

    const monthlyRevenueTrend = monthLabels.map((m) => ({
      month: m,
      Revenue: monthlyDataMap[m].revenue,
    }));

    const monthlyProfitTrend = monthLabels.map((m) => ({
      month: m,
      Profit: Math.max(0, monthlyDataMap[m].revenue - monthlyDataMap[m].expenses),
    }));

    const clientGrowthTrend = monthLabels.map((m) => ({
      month: m,
      NewClients: monthlyDataMap[m].clients,
    }));

    const projectStatusData = projects.map((p) => ({
      name: p.status.replace("_", " "),
      count: p._count.id,
    }));

    return {
      revenueVsExpenses,
      monthlyRevenueTrend,
      monthlyProfitTrend,
      clientGrowthTrend,
      projectStatusData,
    };
  },
  ["dashboard-charts-v2"],
  { revalidate: 30, tags: ["dashboard-metrics"] }
);

export const getDashboardActivityFeeds = unstable_cache(
  async () => {
    const [recentClients, recentProjects, recentPayments, upcomingDeadlines, recentDocuments] =
      await Promise.all([
        withRetry(() =>
          prisma.client.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              name: true,
              contactName: true,
              createdAt: true,
            },
          })
        ),
        withRetry(() =>
          prisma.project.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              name: true,
              status: true,
              budget: true,
              client: { select: { name: true } },
            },
          })
        ),
        withRetry(() =>
          prisma.payment.findMany({
            take: 5,
            orderBy: { paidAt: "desc" },
            select: {
              id: true,
              amount: true,
              paidAt: true,
              method: true,
              client: { select: { name: true } },
              project: { select: { name: true } },
            },
          })
        ),
        withRetry(() =>
          prisma.project.findMany({
            take: 5,
            where: {
              status: { in: [ProjectStatus.ONGOING, ProjectStatus.NEW, ProjectStatus.REVIEW] },
              deadline: { gte: new Date() },
            },
            orderBy: { deadline: "asc" },
            select: {
              id: true,
              name: true,
              deadline: true,
              status: true,
              client: { select: { name: true } },
            },
          })
        ),
        withRetry(() =>
          prisma.document.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              name: true,
              type: true,
              r2Key: true,
              createdAt: true,
            },
          })
        ),
      ]);

    return {
      recentClients,
      recentProjects: recentProjects.map((p) => ({
        ...p,
        budget: p.budget ? Number(p.budget) : 0,
      })),
      recentPayments: recentPayments.map((pay) => ({
        ...pay,
        amount: pay.amount ? Number(pay.amount) : 0,
      })),
      upcomingDeadlines,
      recentDocuments,
    };
  },
  ["dashboard-activity-v2"],
  { revalidate: 15, tags: ["dashboard-metrics"] }
);

import { unstable_cache } from "next/cache";
import { prisma, withRetry } from "./db";

/**
 * High-performance cached metrics query for Dashboard.
 * Serves dashboard stats in < 5ms from node cache.
 * Revalidated via revalidateTag("dashboard-metrics") whenever payments, expenses, or projects change.
 */
export const getCachedDashboardStats = unstable_cache(
  async () => {
    const [
      clientsCount,
      projectsCount,
      leadsCount,
      newProjectsCount,
      ongoingProjectsCount,
      completedProjectsCount,
      paymentsSum,
      expensesSum,
      projectsSum,
    ] = await Promise.all([
      withRetry(() => prisma.client.count()),
      withRetry(() => prisma.project.count()),
      withRetry(() => prisma.lead.count()),
      withRetry(() => prisma.project.count({ where: { status: "NEW" } })),
      withRetry(() => prisma.project.count({ where: { status: "ONGOING" } })),
      withRetry(() => prisma.project.count({ where: { status: "COMPLETED" } })),
      withRetry(() =>
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: { status: "COMPLETED" },
        })
      ),
      withRetry(() =>
        prisma.expense.aggregate({
          _sum: { amount: true },
        })
      ),
      withRetry(() =>
        prisma.project.aggregate({
          _sum: { budget: true },
        })
      ),
    ]);

    const totalReceived = Number(paymentsSum._sum.amount || 0);
    const totalExpenses = Number(expensesSum._sum.amount || 0);
    const totalContractedRevenue = Number(projectsSum._sum.budget || 0);
    const netProfit = totalReceived - totalExpenses;

    return {
      clientsCount,
      projectsCount,
      leadsCount,
      newProjectsCount,
      ongoingProjectsCount,
      completedProjectsCount,
      totalReceived,
      totalExpenses,
      totalContractedRevenue,
      netProfit,
    };
  },
  ["dashboard-stats-cache-key"],
  {
    revalidate: 300, // 5 min fallback TTL
    tags: ["dashboard-metrics"],
  }
);

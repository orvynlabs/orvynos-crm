import { unstable_cache } from "next/cache";
import { prisma, withRetry } from "@/lib/db";
import { PaymentsClient } from "./payments-client";

// ⚡ Sub-10ms Cached Server Loader for Payments Page
const getCachedPaymentsPageData = unstable_cache(
  async () => {
    const [paymentsRaw, projectsRaw, expensesRaw] = await Promise.all([
      withRetry(() =>
        prisma.payment.findMany({
          include: {
            client: { select: { id: true, name: true } },
            project: { select: { id: true, name: true, budget: true } },
          },
          orderBy: {
            paidAt: "desc",
          },
        })
      ),
      withRetry(() =>
        prisma.project.findMany({
          select: {
            id: true,
            name: true,
            clientId: true,
            budget: true,
            client: { select: { name: true } },
          },
          orderBy: {
            name: "asc",
          },
        })
      ),
      withRetry(() =>
        prisma.expense.findMany({
          select: {
            amount: true,
            date: true,
          },
        })
      ),
    ]);

    const projectOptions = projectsRaw.map((p) => ({
      id: p.id,
      name: p.name,
      clientId: p.clientId,
      clientName: p.client.name,
    }));

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const completedPayments = paymentsRaw.filter((p) => p.status === "COMPLETED");

    const overallRevenue = completedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const overallExpenses = expensesRaw.reduce((sum, e) => sum + Number(e.amount), 0);

    const thisMonthPayments = completedPayments.filter((p) => {
      const d = new Date(p.paidAt);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });
    const thisMonthRevenue = thisMonthPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    const thisMonthExpenses = expensesRaw.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });
    const thisMonthExpensesSum = thisMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    const formattedPayments = paymentsRaw.map((p) => ({
      ...p,
      amount: Number(p.amount),
      paidAt: p.paidAt ? p.paidAt.toISOString() : new Date().toISOString(),
      createdAt: p.createdAt ? p.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: p.updatedAt ? p.updatedAt.toISOString() : new Date().toISOString(),
      project: p.project
        ? {
            ...p.project,
            budget: p.project.budget ? Number(p.project.budget) : 0,
          }
        : null,
    }));

    return {
      initialPayments: formattedPayments,
      projects: projectOptions,
      metrics: {
        thisMonthRevenue,
        thisMonthExpenses: thisMonthExpensesSum,
        overallRevenue,
        overallExpenses,
      },
    };
  },
  ["payments-page-data-v1"],
  { revalidate: 30, tags: ["payments"] }
);

export default async function PaymentsPage() {
  const { initialPayments, projects, metrics } = await getCachedPaymentsPageData();

  return (
    <PaymentsClient
      initialPayments={initialPayments as any}
      projects={projects}
      metrics={metrics}
    />
  );
}

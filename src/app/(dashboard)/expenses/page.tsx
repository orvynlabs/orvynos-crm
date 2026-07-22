import { unstable_cache } from "next/cache";
import { prisma, withRetry } from "@/lib/db";
import { ExpensesClient } from "./expenses-client";

// ⚡ Sub-10ms Cached Server Loader for Expenses Page
const getCachedExpensesPageData = unstable_cache(
  async () => {
    const [expensesRaw, projects] = await Promise.all([
      withRetry(() =>
        prisma.expense.findMany({
          include: {
            project: { select: { id: true, name: true } },
          },
          orderBy: {
            date: "desc",
          },
        })
      ),
      withRetry(() =>
        prisma.project.findMany({
          select: {
            id: true,
            name: true,
          },
          orderBy: {
            name: "asc",
          },
        })
      ),
    ]);

    const totalExpenses = expensesRaw.reduce((sum, e) => sum + Number(e.amount), 0);
    const categoryTotals = expensesRaw.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
      return acc;
    }, {} as Record<string, number>);

    const formattedExpenses = expensesRaw.map((e) => ({
      ...e,
      amount: Number(e.amount),
      date: e.date.toISOString(),
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    }));

    return {
      initialExpenses: formattedExpenses,
      projects,
      metrics: {
        totalExpenses,
        categoryTotals,
      },
    };
  },
  ["expenses-page-data-v2"],
  { revalidate: 30, tags: ["expenses"] }
);

export default async function ExpensesPage() {
  const { initialExpenses, projects, metrics } = await getCachedExpensesPageData();

  return (
    <ExpensesClient
      initialExpenses={initialExpenses as any}
      projects={projects}
      metrics={metrics}
    />
  );
}

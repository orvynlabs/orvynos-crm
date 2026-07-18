import { prisma } from "@/lib/db";
import { getTotalExpenses } from "@/lib/finance";
import { ExpensesClient } from "./expenses-client";

export const revalidate = 0;

export default async function ExpensesPage() {
  const [expenses, projects, totalExpensesResult, categoryAggregations] = await Promise.all([
    prisma.expense.findMany({
      include: {
        project: { select: { id: true, name: true } },
      },
      orderBy: {
        date: "desc",
      },
    }),
    prisma.project.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    getTotalExpenses(),
    prisma.expense.groupBy({
      by: ["category"],
      _sum: {
        amount: true,
      },
    }),
  ]);

  const categoryTotals = categoryAggregations.reduce((acc, curr) => {
    acc[curr.category] = Number(curr._sum.amount || 0);
    return acc;
  }, {} as Record<string, number>);

  return (
    <ExpensesClient
      initialExpenses={JSON.parse(JSON.stringify(expenses))}
      projects={projects}
      metrics={{
        totalExpenses: totalExpensesResult,
        categoryTotals,
      }}
    />
  );
}

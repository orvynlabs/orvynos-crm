"use server";

import { unstable_cache } from "next/cache";
import { prisma, withRetry } from "@/lib/db";
import { getTotalRevenue, getTotalExpenses, getNetProfit } from "@/lib/finance";
import { PaymentStatus, ProjectStatus } from "@/generated/prisma/client";
import { parseExpenseCategory } from "@/lib/expenses";

export type ReportDateFilter = "THIS_MONTH" | "LAST_MONTH" | "THIS_QUARTER" | "YTD" | "ALL";

function getDateRange(preset: ReportDateFilter): { start?: Date; end?: Date } {
  const now = new Date();
  if (preset === "THIS_MONTH") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start, end: now };
  }
  if (preset === "LAST_MONTH") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    return { start, end };
  }
  if (preset === "THIS_QUARTER") {
    const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
    const start = new Date(now.getFullYear(), quarterMonth, 1);
    return { start, end: now };
  }
  if (preset === "YTD") {
    const start = new Date(now.getFullYear(), 0, 1);
    return { start, end: now };
  }
  return {};
}

export async function getReportsData(preset: ReportDateFilter = "ALL") {
  return unstable_cache(
    async () => {
      try {
        const range = getDateRange(preset);

        // Call finance.ts single source of truth functions
        const [revenue, expenses, netProfit] = await Promise.all([
          getTotalRevenue(range),
          getTotalExpenses(range),
          getNetProfit(range),
        ]);

    // Build Prisma filters based on date range
    const paymentWhere: any = { status: PaymentStatus.COMPLETED };
    const expenseWhere: any = {};
    if (range.start || range.end) {
      paymentWhere.paidAt = {};
      expenseWhere.date = {};
      if (range.start) {
        paymentWhere.paidAt.gte = range.start;
        expenseWhere.date.gte = range.start;
      }
      if (range.end) {
        paymentWhere.paidAt.lte = range.end;
        expenseWhere.date.lte = range.end;
      }
    }

    const [payments, expenseItems, projects, clients] = await Promise.all([
      withRetry(() =>
        prisma.payment.findMany({
          where: paymentWhere,
          include: {
            client: { select: { name: true } },
            project: { select: { name: true } },
          },
          orderBy: { paidAt: "desc" },
        })
      ),
      withRetry(() =>
        prisma.expense.findMany({
          where: expenseWhere,
          include: {
            project: { select: { name: true } },
          },
          orderBy: { date: "desc" },
        })
      ),
      withRetry(() =>
        prisma.project.findMany({
          include: {
            client: { select: { name: true } },
            payments: { where: { status: PaymentStatus.COMPLETED }, select: { amount: true } },
            expenses: { select: { amount: true } },
          },
          orderBy: { createdAt: "desc" },
        })
      ),
      withRetry(() =>
        prisma.client.findMany({
          include: {
            projects: { select: { id: true, budget: true, status: true } },
            payments: { where: { status: PaymentStatus.COMPLETED }, select: { amount: true } },
          },
          orderBy: { name: "asc" },
        })
      ),
    ]);

    // Category breakdown for expenses
    const expenseByCategoryMap: Record<string, number> = {};
    expenseItems.forEach((exp) => {
      const parsed = parseExpenseCategory(exp);
      const cat = parsed.displayCategory;
      expenseByCategoryMap[cat] = (expenseByCategoryMap[cat] || 0) + Number(exp.amount);
    });

    const expenseCategories = Object.entries(expenseByCategoryMap).map(([category, amount]) => ({
      category,
      amount,
    }));

    return {
      success: true,
      data: {
        preset,
        summary: {
          revenue,
          expenses,
          netProfit,
          profitMargin: revenue > 0 ? Math.round((netProfit / revenue) * 100) : 0,
        },
        revenueItems: payments.map((p) => ({
          id: p.id,
          date: p.paidAt ? p.paidAt.toISOString() : p.createdAt.toISOString(),
          clientName: p.client.name,
          projectName: p.project?.name || "Direct Client Payment",
          amount: Number(p.amount),
          method: p.method,
          reference: p.reference || "N/A",
          receiptNumber: p.receiptNumber || "N/A",
        })),
        expenseItems: expenseItems.map((e) => {
          const parsed = parseExpenseCategory(e);
          return {
            id: e.id,
            title: e.title,
            category: parsed.displayCategory,
            amount: Number(e.amount),
            date: e.date.toISOString(),
            projectName: e.project?.name || "General Business Expense",
          };
        }),
        expenseCategories,
        projectsReport: projects.map((p) => {
          const budget = Number(p.budget || 0);
          const totalCollected = p.payments.reduce((sum, pay) => sum + Number(pay.amount), 0);
          const totalSpent = p.expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
          return {
            id: p.id,
            name: p.name,
            clientName: p.client.name,
            status: p.status,
            budget,
            totalCollected,
            totalSpent,
            profit: totalCollected - totalSpent,
            progress: p.progress,
          };
        }),
        clientsReport: clients.map((c) => {
          const totalPaid = c.payments.reduce((sum, pay) => sum + Number(pay.amount), 0);
          const totalContracted = c.projects.reduce((sum, proj) => sum + Number(proj.budget), 0);
          return {
            id: c.id,
            name: c.name,
            totalProjects: c.projects.length,
            activeProjects: c.projects.filter((p) => p.status === ProjectStatus.ONGOING).length,
            totalContracted,
            totalPaid,
            pending: Math.max(0, totalContracted - totalPaid),
          };
        }),
      },
    };
  } catch (error: any) {
    console.error("Failed to generate reports data:", error);
    return { success: false, error: error?.message || "Failed to load reports" };
  }
    },
    [`reports-data-${preset}`],
    { revalidate: 60, tags: ["reports", "finance", "payments", "expenses"] }
  )();
}

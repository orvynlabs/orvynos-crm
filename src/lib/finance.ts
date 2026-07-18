import { prisma } from './db';
import { PaymentStatus } from '../generated/prisma/client';

export async function getProjectPendingAmount(projectId: string): Promise<number> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { budget: true },
  });

  if (!project) {
    throw new Error(`Project with ID ${projectId} not found`);
  }

  const paymentsSum = await prisma.payment.aggregate({
    where: {
      projectId,
      status: PaymentStatus.COMPLETED,
    },
    _sum: {
      amount: true,
    },
  });

  const budget = Number(project.budget);
  const paid = Number(paymentsSum._sum.amount || 0);

  return Math.max(0, budget - paid);
}

export async function getClientTotalPaid(clientId: string): Promise<number> {
  const paymentsSum = await prisma.payment.aggregate({
    where: {
      clientId,
      status: PaymentStatus.COMPLETED,
    },
    _sum: {
      amount: true,
    },
  });

  return Number(paymentsSum._sum.amount || 0);
}

export async function getTotalRevenue(dateRange?: { start?: Date; end?: Date }): Promise<number> {
  const whereClause: any = {
    status: PaymentStatus.COMPLETED,
  };

  if (dateRange) {
    whereClause.paidAt = {};
    if (dateRange.start) {
      whereClause.paidAt.gte = dateRange.start;
    }
    if (dateRange.end) {
      whereClause.paidAt.lte = dateRange.end;
    }
  }

  const paymentsSum = await prisma.payment.aggregate({
    where: whereClause,
    _sum: {
      amount: true,
    },
  });

  return Number(paymentsSum._sum.amount || 0);
}

export async function getTotalExpenses(dateRange?: { start?: Date; end?: Date }): Promise<number> {
  const whereClause: any = {};

  if (dateRange) {
    whereClause.date = {};
    if (dateRange.start) {
      whereClause.date.gte = dateRange.start;
    }
    if (dateRange.end) {
      whereClause.date.lte = dateRange.end;
    }
  }

  const expensesSum = await prisma.expense.aggregate({
    where: whereClause,
    _sum: {
      amount: true,
    },
  });

  return Number(expensesSum._sum.amount || 0);
}

export async function getNetProfit(dateRange?: { start?: Date; end?: Date }): Promise<number> {
  const revenue = await getTotalRevenue(dateRange);
  const expenses = await getTotalExpenses(dateRange);
  return revenue - expenses;
}

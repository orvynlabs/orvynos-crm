"use server";

import { prisma, withRetry } from "@/lib/db";
import { revalidatePath, revalidateTag } from "next/cache";
import { ExpenseCategory } from "@/lib/enums";
import { broadcastWsEvent } from "@/lib/ws/broadcaster";

export type ExpenseInput = {
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  notes?: string;
  projectId?: string;
};

export async function createExpense(data: ExpenseInput) {
  try {
    if (!data.title) throw new Error("Title/Description is required");
    if (isNaN(data.amount) || data.amount <= 0) throw new Error("Amount must be greater than 0");
    if (!data.category) throw new Error("Category is required");

    const expenseDate = data.date ? new Date(data.date) : new Date();

    const newExpense = await withRetry(() =>
      prisma.expense.create({
        data: {
          title: data.title,
          category: data.category,
          amount: data.amount,
          date: expenseDate,
          notes: data.notes || null,
          projectId: data.projectId || null,
        },
      })
    );

    await broadcastWsEvent({
      type: "entity:update",
      entity: "expense",
      action: "create",
      data: newExpense,
    });

    revalidateTag("expenses");
    revalidateTag("dashboard-metrics");
    revalidatePath("/expenses");
    if (data.projectId) {
      revalidatePath(`/projects/${data.projectId}`);
      revalidateTag(`project-${data.projectId}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Failed to create expense:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create expense" };
  }
}

export type UpdateExpenseInput = {
  id: string;
  title?: string;
  amount?: number;
  category?: ExpenseCategory;
  date?: string;
  notes?: string;
  projectId?: string | null;
};

export async function updateExpense(data: UpdateExpenseInput) {
  try {
    if (!data.id) throw new Error("Expense ID is required");
    if (data.amount !== undefined && (isNaN(data.amount) || data.amount <= 0)) {
      throw new Error("Amount must be greater than 0");
    }

    const existing = await prisma.expense.findUnique({
      where: { id: data.id },
      select: { projectId: true },
    });

    if (!existing) throw new Error("Expense record not found");

    const expenseDate = data.date ? new Date(data.date) : undefined;
    const targetProjectId = data.projectId !== undefined ? (data.projectId || null) : existing.projectId;

    await withRetry(() =>
      prisma.expense.update({
        where: { id: data.id },
        data: {
          ...(data.title ? { title: data.title } : {}),
          ...(data.category ? { category: data.category } : {}),
          ...(data.amount !== undefined ? { amount: data.amount } : {}),
          ...(expenseDate ? { date: expenseDate } : {}),
          ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
          ...(data.projectId !== undefined ? { projectId: data.projectId || null } : {}),
        },
      })
    );

    await broadcastWsEvent({
      type: "entity:update",
      entity: "expense",
      action: "update",
      data: { id: data.id, title: data.title, amount: data.amount },
    });

    revalidateTag("expenses");
    revalidateTag("dashboard-metrics");
    revalidatePath("/expenses");
    if (targetProjectId) {
      revalidatePath(`/projects/${targetProjectId}`);
      revalidateTag(`project-${targetProjectId}`);
    }
    if (existing.projectId && existing.projectId !== targetProjectId) {
      revalidatePath(`/projects/${existing.projectId}`);
      revalidateTag(`project-${existing.projectId}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Failed to update expense:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to update expense" };
  }
}

export async function deleteExpense(id: string) {
  try {
    if (!id) throw new Error("Expense ID is required");

    const existing = await prisma.expense.findUnique({
      where: { id },
      select: { projectId: true },
    });

    if (!existing) throw new Error("Expense record not found");

    await withRetry(() => prisma.expense.delete({ where: { id } }));

    await broadcastWsEvent({
      type: "entity:update",
      entity: "expense",
      action: "delete",
      data: { id },
    });

    revalidateTag("expenses");
    revalidateTag("dashboard-metrics");
    revalidatePath("/expenses");
    if (existing.projectId) {
      revalidatePath(`/projects/${existing.projectId}`);
      revalidateTag(`project-${existing.projectId}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete expense:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete expense" };
  }
}


"use server";

import { prisma, withRetry } from "@/lib/db";
import { revalidatePath, revalidateTag } from "next/cache";
import { ExpenseCategory } from "@/lib/enums";

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

    await withRetry(() =>
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

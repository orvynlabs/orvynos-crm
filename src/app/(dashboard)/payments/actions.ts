"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { PaymentMethod, PaymentStatus } from "@/lib/enums";

export type PaymentInput = {
  projectId: string;
  clientId: string;
  amount: number;
  method: PaymentMethod;
  status?: PaymentStatus;
  paidAt?: string;
  reference?: string;
  notes?: string;
};

export async function createPayment(data: PaymentInput) {
  try {
    if (!data.projectId) throw new Error("Project is required");
    if (!data.clientId) throw new Error("Client is required");
    if (isNaN(data.amount) || data.amount <= 0) throw new Error("Amount must be greater than 0");

    const paidAtDate = data.paidAt ? new Date(data.paidAt) : new Date();

    const year = paidAtDate.getFullYear();
    const prefix = `RCPT-${year}-`;
    
    const latestPayment = await prisma.payment.findFirst({
      where: {
        receiptNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        receiptNumber: 'desc',
      },
      select: {
        receiptNumber: true,
      },
    });

    let nextNum = 1;
    if (latestPayment?.receiptNumber) {
      const parts = latestPayment.receiptNumber.split('-');
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        nextNum = lastSeq + 1;
      }
    }
    const receiptNumber = `${prefix}${String(nextNum).padStart(4, '0')}`;

    const newPayment = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: {
          projectId: data.projectId,
          clientId: data.clientId,
          amount: data.amount,
          method: data.method,
          status: data.status || PaymentStatus.COMPLETED,
          paidAt: paidAtDate,
          reference: data.reference || null,
          notes: data.notes || null,
          receiptNumber,
        },
      });

      await tx.projectActivity.create({
        data: {
          projectId: data.projectId,
          action: "payment_received",
          detail: `Payment of ₹${data.amount.toLocaleString('en-IN')} received via ${data.method.replace(/_/g, ' ')}`,
        },
      });

      return p;
    });

    // Fire-and-forget background PDF generation to pre-warm local and B2 caches
    const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    fetch(`${appUrl}/api/receipts/${newPayment.id}/download`)
      .catch((err) => console.warn("[Receipt Pre-warm] Failed in background:", err.message));

    revalidatePath("/payments");
    revalidatePath(`/projects/${data.projectId}`);
    revalidatePath(`/clients/${data.clientId}`);
    
    return { success: true };
  } catch (error: any) {
    console.error("Failed to create payment:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create payment" };
  }
}

export type UpdatePaymentInput = {
  id: string;
  projectId?: string;
  clientId?: string;
  amount?: number;
  method?: PaymentMethod;
  status?: PaymentStatus;
  paidAt?: string;
  reference?: string;
  notes?: string;
};

export async function updatePayment(data: UpdatePaymentInput) {
  try {
    if (!data.id) throw new Error("Payment ID is required");
    if (data.amount !== undefined && (isNaN(data.amount) || data.amount <= 0)) {
      throw new Error("Amount must be greater than 0");
    }

    const existingPayment = await prisma.payment.findUnique({
      where: { id: data.id },
      select: { projectId: true, clientId: true, amount: true, method: true, status: true, paidAt: true },
    });

    if (!existingPayment) throw new Error("Payment record not found");

    const paidAtDate = data.paidAt ? new Date(data.paidAt) : undefined;
    const targetProjectId = data.projectId || existingPayment.projectId;
    const targetClientId = data.clientId || existingPayment.clientId;

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.update({
        where: { id: data.id },
        data: {
          ...(data.projectId ? { projectId: data.projectId } : {}),
          ...(data.clientId ? { clientId: data.clientId } : {}),
          ...(data.amount !== undefined ? { amount: data.amount } : {}),
          ...(data.method ? { method: data.method } : {}),
          ...(data.status ? { status: data.status } : {}),
          ...(paidAtDate ? { paidAt: paidAtDate } : {}),
          reference: data.reference !== undefined ? (data.reference || null) : undefined,
          notes: data.notes !== undefined ? (data.notes || null) : undefined,
        },
      });

      await tx.projectActivity.create({
        data: {
          projectId: targetProjectId,
          action: "payment_updated",
          detail: `Payment ${p.receiptNumber ? `#${p.receiptNumber}` : ''} updated to ₹${Number(p.amount).toLocaleString('en-IN')}`,
        },
      });

      return p;
    });

    if (updated.status === PaymentStatus.COMPLETED) {
      const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      fetch(`${appUrl}/api/receipts/${updated.id}/download`)
        .catch((err) => console.warn("[Receipt Pre-warm] Failed in background:", err.message));
    }

    revalidatePath("/payments");
    revalidatePath(`/projects/${targetProjectId}`);
    revalidatePath(`/clients/${targetClientId}`);

    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Failed to update payment:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to update payment" };
  }
}

export async function deletePayment(id: string) {
  try {
    if (!id) throw new Error("Payment ID is required");

    const existing = await prisma.payment.findUnique({
      where: { id },
      select: { projectId: true, clientId: true, amount: true, receiptNumber: true },
    });

    if (!existing) throw new Error("Payment record not found");

    await prisma.$transaction(async (tx) => {
      await tx.payment.delete({ where: { id } });
      await tx.projectActivity.create({
        data: {
          projectId: existing.projectId,
          action: "payment_deleted",
          detail: `Payment ${existing.receiptNumber ? `#${existing.receiptNumber}` : ''} (₹${Number(existing.amount).toLocaleString('en-IN')}) was deleted`,
        },
      });
    });

    revalidatePath("/payments");
    revalidatePath(`/projects/${existing.projectId}`);
    revalidatePath(`/clients/${existing.clientId}`);

    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete payment:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete payment" };
  }
}


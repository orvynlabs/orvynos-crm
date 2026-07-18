"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { PaymentMethod, PaymentStatus } from "@/generated/prisma/client";

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

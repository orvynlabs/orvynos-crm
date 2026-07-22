"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { LeadStage } from "@/lib/enums";

export type CreateLeadInput = {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  source?: string;
  stage?: LeadStage;
  estimatedValue?: number;
  notes?: string;
  followUpAt?: string;
};

export type UpdateLeadInput = Partial<CreateLeadInput> & {
  sortOrder?: number;
};

export async function getLeads() {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: [
        { stage: "asc" },
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
      include: {
        convertedClient: {
          select: { id: true, name: true },
        },
      },
    });

    return {
      success: true,
      data: leads.map((l) => ({
        id: l.id,
        name: l.name,
        company: l.company,
        email: l.email,
        phone: l.phone,
        source: l.source,
        stage: l.stage as LeadStage,
        sortOrder: l.sortOrder,
        estimatedValue: l.estimatedValue ? Number(l.estimatedValue) : 0,
        notes: l.notes,
        followUpAt: l.followUpAt ? l.followUpAt.toISOString() : null,
        convertedClientId: l.convertedClientId,
        convertedClient: l.convertedClient ? { id: l.convertedClient.id, name: l.convertedClient.name } : null,
        createdAt: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString(),
      })),
    };
  } catch (error: any) {
    console.error("Failed to fetch leads:", error);
    return { success: false, error: error.message };
  }
}

export async function createLead(input: CreateLeadInput) {
  try {
    if (!input.name || !input.name.trim()) {
      return { success: false, error: "Lead contact name is required" };
    }

    const newLead = await prisma.lead.create({
      data: {
        name: input.name.trim(),
        company: input.company?.trim() || null,
        email: input.email?.trim() || null,
        phone: input.phone?.trim() || null,
        source: input.source?.trim() || "Direct",
        stage: input.stage || LeadStage.NEW,
        estimatedValue: input.estimatedValue ? input.estimatedValue : null,
        notes: input.notes?.trim() || null,
        followUpAt: input.followUpAt ? new Date(input.followUpAt) : null,
      },
    });

    revalidatePath("/leads");
    revalidatePath("/");
    return { success: true, data: newLead };
  } catch (error: any) {
    console.error("Failed to create lead:", error);
    return { success: false, error: error.message };
  }
}

export async function updateLead(id: string, input: UpdateLeadInput) {
  try {
    const dataToUpdate: any = {};
    if (input.name !== undefined) dataToUpdate.name = input.name.trim();
    if (input.company !== undefined) dataToUpdate.company = input.company.trim() || null;
    if (input.email !== undefined) dataToUpdate.email = input.email.trim() || null;
    if (input.phone !== undefined) dataToUpdate.phone = input.phone.trim() || null;
    if (input.source !== undefined) dataToUpdate.source = input.source.trim() || null;
    if (input.stage !== undefined) dataToUpdate.stage = input.stage;
    if (input.estimatedValue !== undefined) dataToUpdate.estimatedValue = input.estimatedValue;
    if (input.notes !== undefined) dataToUpdate.notes = input.notes.trim() || null;
    if (input.followUpAt !== undefined) {
      dataToUpdate.followUpAt = input.followUpAt ? new Date(input.followUpAt) : null;
    }
    if (input.sortOrder !== undefined) dataToUpdate.sortOrder = input.sortOrder;

    const updated = await prisma.lead.update({
      where: { id },
      data: dataToUpdate,
    });

    revalidatePath("/leads");
    revalidatePath("/");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Failed to update lead:", error);
    return { success: false, error: error.message };
  }
}

export async function updateLeadStage(id: string, stage: LeadStage, sortOrder?: number) {
  try {
    const updated = await prisma.lead.update({
      where: { id },
      data: {
        stage,
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    revalidatePath("/leads");
    revalidatePath("/");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Failed to update lead stage:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteLead(id: string) {
  try {
    await prisma.lead.delete({
      where: { id },
    });

    revalidatePath("/leads");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete lead:", error);
    return { success: false, error: error.message };
  }
}

export type ConvertLeadInput = {
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  gstin?: string | null;
  notes?: string | null;
};

/**
 * 🏆 Section 7.3: Convert Lead to Client
 * Creates a new Client record prefilled from Lead details & marks original Lead as converted.
 */
export async function convertLeadToClient(id: string, input?: ConvertLeadInput) {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      return { success: false, error: "Lead not found" };
    }

    if (lead.convertedClientId) {
      return {
        success: true,
        alreadyConverted: true,
        clientId: lead.convertedClientId,
      };
    }

    // 1. Create new Client prefilled from Lead details or manual fields
    const clientName = input?.name?.trim() || lead.company?.trim() || lead.name.trim() || "New Client";
    const contactPerson = input?.contactName?.trim() || (lead.company?.trim() ? lead.name.trim() : null);

    const newClient = await prisma.client.create({
      data: {
        name: clientName,
        contactName: contactPerson,
        email: input?.email?.trim() !== undefined ? (input.email?.trim() || null) : (lead.email || null),
        phone: input?.phone?.trim() !== undefined ? (input.phone?.trim() || null) : (lead.phone || null),
        website: input?.website?.trim() || null,
        address: input?.address?.trim() || null,
        city: input?.city?.trim() || null,
        state: input?.state?.trim() || null,
        gstin: input?.gstin?.trim() || null,
      },
    });

    const noteContent = input?.notes?.trim() || (lead.notes ? `Converted from Lead: ${lead.notes}` : "Converted from Lead Pipeline");
    if (noteContent) {
      await prisma.clientNote.create({
        data: {
          clientId: newClient.id,
          content: noteContent,
        },
      });
    }

    // 2. Mark original Lead as WON & link convertedClientId
    await prisma.lead.update({
      where: { id },
      data: {
        stage: LeadStage.WON,
        convertedClientId: newClient.id,
      },
    });

    revalidatePath("/leads");
    revalidatePath("/clients");
    revalidatePath("/");

    return {
      success: true,
      clientId: newClient.id,
      clientName: newClient.name,
    };
  } catch (error: any) {
    console.error("Failed to convert lead to client:", error);
    return { success: false, error: error.message };
  }
}

export async function updateLeadStageFast(id: string, stage: LeadStage) {
  try {
    await prisma.lead.update({
      where: { id },
      data: {
        stage,
      },
    });
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update lead stage fast:", error);
    return { success: false, error: error.message };
  }
}

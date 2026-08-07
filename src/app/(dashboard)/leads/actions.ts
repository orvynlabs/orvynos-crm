"use server";

import { prisma } from "@/lib/db";
import { revalidatePath, unstable_cache } from "next/cache";
import { LeadStage } from "@/lib/enums";
import { auth } from "@/auth";
import { broadcastWsEvent } from "@/lib/ws/broadcaster";

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
  assignedToId?: string;
  createdById?: string;
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
        assignedTo: {
          select: { id: true, name: true, email: true, image: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true, image: true },
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
        assignedToId: l.assignedToId || null,
        assignedTo: l.assignedTo ? { id: l.assignedTo.id, name: l.assignedTo.name, email: l.assignedTo.email, image: l.assignedTo.image } : null,
        createdById: l.createdById || null,
        createdBy: l.createdBy ? { id: l.createdBy.id, name: l.createdBy.name, email: l.createdBy.email, image: l.createdBy.image } : null,
        convertedClientId: l.convertedClientId,
        convertedClient: l.convertedClient ? { id: l.convertedClient.id, name: l.convertedClient.name } : null,
        createdAt: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString(),
      })),
    };
  } catch (error: any) {
    console.error("Failed to fetch leads:", error);
    return { success: false, error: error?.message || "Failed to fetch leads", data: [] };
  }
}

export async function getLeadAssignees() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
      orderBy: { name: "asc" },
    });
    return { success: true, data: users };
  } catch (error: any) {
    console.error("Failed to fetch lead assignees:", error);
    return { success: false, error: error?.message || "Failed to fetch assignees", data: [] };
  }
}

export async function createLead(input: CreateLeadInput) {
  try {
    if (!input.name || !input.name.trim()) {
      return { success: false, error: "Lead contact name is required" };
    }

    const session = await auth();
    const currentUserId = session?.user?.id;

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
        assignedToId: input.assignedToId || null,
        createdById: input.createdById || currentUserId || null,
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, image: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    await broadcastWsEvent({
      type: "entity:update",
      entity: "lead",
      action: "create",
      data: newLead,
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
    if (input.assignedToId !== undefined) dataToUpdate.assignedToId = input.assignedToId || null;
    if (input.createdById !== undefined) dataToUpdate.createdById = input.createdById || null;
    if (input.sortOrder !== undefined) dataToUpdate.sortOrder = input.sortOrder;

    const updated = await prisma.lead.update({
      where: { id },
      data: dataToUpdate,
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, image: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    await broadcastWsEvent({
      type: "entity:update",
      entity: "lead",
      action: "update",
      data: updated,
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

    await broadcastWsEvent({
      type: "entity:update",
      entity: "lead",
      action: "stage_change",
      data: updated,
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

    await broadcastWsEvent({
      type: "entity:update",
      entity: "lead",
      action: "delete",
      data: { id },
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

    await broadcastWsEvent({
      type: "entity:update",
      entity: "lead",
      action: "convert",
      data: { leadId: id, clientId: newClient.id, clientName: newClient.name },
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
    const updated = await prisma.lead.update({
      where: { id },
      data: {
        stage,
      },
    });

    await broadcastWsEvent({
      type: "entity:update",
      entity: "lead",
      action: "stage_change",
      data: updated,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Failed to update lead stage fast:", error);
    return { success: false, error: error.message };
  }
}

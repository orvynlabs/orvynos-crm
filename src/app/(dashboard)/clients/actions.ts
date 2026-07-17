"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type CreateClientInput = {
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  gstin?: string;
};

export async function createClient(data: CreateClientInput) {
  try {
    if (!data.name) {
      throw new Error("Company name is required");
    }

    await prisma.client.create({
      data: {
        name: data.name,
        contactName: data.contactName || null,
        email: data.email || null,
        phone: data.phone || null,
        website: data.website || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        gstin: data.gstin || null,
      },
    });

    revalidatePath("/clients");
    return { success: true };
  } catch (error) {
    console.error("Failed to create client:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create client" };
  }
}

export async function updateClient(id: string, data: CreateClientInput & { notes?: string }) {
  try {
    if (!data.name) {
      throw new Error("Company name is required");
    }

    await prisma.client.update({
      where: { id },
      data: {
        name: data.name,
        contactName: data.contactName || null,
        email: data.email || null,
        phone: data.phone || null,
        website: data.website || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        gstin: data.gstin || null,
      },
    });

    // If client notes are provided during edit, create a note
    if (data.notes) {
      await prisma.clientNote.create({
        data: {
          clientId: id,
          content: data.notes,
        },
      });
    }

    revalidatePath("/clients");
    revalidatePath(`/clients/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update client:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to update client" };
  }
}

"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { DocumentType } from "@/lib/enums";

export async function getDocuments() {
  try {
    const docs = await prisma.document.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        uploadedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      success: true,
      data: docs.map((d) => ({
        id: d.id,
        name: d.name,
        type: d.type,
        r2Key: d.r2Key,
        mimeType: d.mimeType || "application/octet-stream",
        size: d.size || 0,
        projectId: d.projectId,
        projectName: d.project?.name || null,
        clientId: d.clientId,
        clientName: d.client?.name || null,
        uploadedBy: d.uploadedBy?.name || "System",
        createdAt: d.createdAt.toISOString(),
      })),
    };
  } catch (error: any) {
    console.error("Failed to fetch documents:", error);
    return { success: false, error: error?.message || "Failed to fetch documents", data: [] };
  }
}

export async function getProjectsAndClients() {
  try {
    const [projects, clients] = await Promise.all([
      prisma.project.findMany({
        select: {
          id: true,
          name: true,
          clientId: true,
        },
        orderBy: {
          name: "asc",
        },
      }),
      prisma.client.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
      }),
    ]);

    return {
      success: true,
      data: {
        projects,
        clients,
      },
    };
  } catch (error: any) {
    console.error("Failed to fetch projects/clients for documents:", error);
    return { success: false, error: error?.message || "Failed to fetch dependencies" };
  }
}

export async function createDocument(data: {
  name: string;
  type: string;
  r2Key: string;
  mimeType?: string;
  size?: number;
  projectId?: string;
  clientId?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    let finalClientId = data.clientId;
    if (data.projectId && !finalClientId) {
      const proj = await prisma.project.findUnique({
        where: { id: data.projectId },
        select: { clientId: true },
      });
      if (proj) {
        finalClientId = proj.clientId;
      }
    }

    const doc = await prisma.document.create({
      data: {
        name: data.name,
        type: data.type as DocumentType,
        r2Key: data.r2Key,
        mimeType: data.mimeType || "application/octet-stream",
        size: data.size || 0,
        projectId: data.projectId || null,
        clientId: finalClientId || null,
        uploadedById: session.user.id || null,
      },
    });

    revalidatePath("/documents");
    return { success: true, data: doc };
  } catch (error: any) {
    console.error("Failed to create document:", error);
    return { success: false, error: error?.message || "Failed to upload document" };
  }
}

export async function deleteDocument(id: string) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    await prisma.document.delete({
      where: { id },
    });

    revalidatePath("/documents");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete document:", error);
    return { success: false, error: error?.message || "Failed to delete document" };
  }
}

"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type ProjectInput = {
  name: string;
  description?: string;
  status: "NEW" | "ONGOING" | "REVIEW" | "COMPLETED" | "ON_HOLD" | "CANCELLED";
  budget: number;
  clientId: string;
  progress?: number;
  startDate?: string;
  deadline?: string;
  techStack?: string[];
  domain?: string;
  domainExpiry?: string;
  teamMemberAssignments?: {
    teamMemberId: string;
    roleOnProject?: string;
  }[];
};

export async function createProject(data: ProjectInput) {
  try {
    if (!data.name) {
      throw new Error("Project Name is required");
    }
    if (!data.clientId) {
      throw new Error("Client is required");
    }
    if (isNaN(data.budget) || data.budget < 0) {
      throw new Error("Budget must be a positive number");
    }

    // Process domain & hosting details into description if provided
    let finalDescription = data.description || "";
    if (data.domain) {
      const domainSection = `[Domain: ${data.domain}${data.domainExpiry ? ` | Expires: ${data.domainExpiry}` : ""}]`;
      finalDescription = `${domainSection}\n${finalDescription}`;
    }

    // Create project and assignments inside a transaction
    await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          clientId: data.clientId,
          name: data.name,
          description: finalDescription || null,
          status: data.status,
          budget: data.budget,
          startDate: data.startDate ? new Date(data.startDate) : null,
          deadline: data.deadline ? new Date(data.deadline) : null,
          progress: data.progress || 0,
          techStack: data.techStack || [],
        },
      });

      // Create activity record
      await tx.projectActivity.create({
        data: {
          projectId: project.id,
          action: "status_changed",
          detail: `Project created with status ${data.status.toLowerCase()}`,
        },
      });

      // Create assignments
      if (data.teamMemberAssignments && data.teamMemberAssignments.length > 0) {
        await tx.projectMember.createMany({
          data: data.teamMemberAssignments.map((a) => ({
            projectId: project.id,
            teamMemberId: a.teamMemberId,
            roleOnProject: a.roleOnProject || null,
          })),
        });
      }
    });

    revalidatePath("/clients");
    revalidatePath("/projects");
    return { success: true };
  } catch (error) {
    console.error("Failed to create project:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create project" };
  }
}

export async function updateProject(id: string, data: ProjectInput) {
  try {
    if (!id) {
      throw new Error("Project ID is required");
    }
    if (!data.name) {
      throw new Error("Project Name is required");
    }
    if (!data.clientId) {
      throw new Error("Client is required");
    }
    if (isNaN(data.budget) || data.budget < 0) {
      throw new Error("Budget must be a positive number");
    }

    // Fetch the current project state to check for status/progress changes to log activity
    const current = await prisma.project.findUnique({
      where: { id },
      select: { status: true, progress: true },
    });

    if (!current) {
      throw new Error("Project not found");
    }

    // Process domain & hosting details into description if provided
    let finalDescription = data.description || "";
    if (data.domain) {
      const domainSection = `[Domain: ${data.domain}${data.domainExpiry ? ` | Expires: ${data.domainExpiry}` : ""}]`;
      if (!finalDescription.includes("[Domain:")) {
        finalDescription = `${domainSection}\n${finalDescription}`;
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id },
        data: {
          clientId: data.clientId,
          name: data.name,
          description: finalDescription || null,
          status: data.status,
          budget: data.budget,
          startDate: data.startDate ? new Date(data.startDate) : null,
          deadline: data.deadline ? new Date(data.deadline) : null,
          progress: data.progress ?? 0,
          techStack: data.techStack || [],
        },
      });

      // Update assignments if provided
      if (data.teamMemberAssignments) {
        await tx.projectMember.deleteMany({
          where: { projectId: id },
        });
        if (data.teamMemberAssignments.length > 0) {
          await tx.projectMember.createMany({
            data: data.teamMemberAssignments.map((a) => ({
              projectId: id,
              teamMemberId: a.teamMemberId,
              roleOnProject: a.roleOnProject || null,
            })),
          });
        }
      }

      // Log status change activity
      if (current.status !== data.status) {
        await tx.projectActivity.create({
          data: {
            projectId: id,
            action: "status_changed",
            detail: `Status updated from ${current.status.toLowerCase()} to ${data.status.toLowerCase()}`,
          },
        });
      }

      // Log progress change activity
      if (current.progress !== data.progress && data.progress !== undefined) {
        await tx.projectActivity.create({
          data: {
            projectId: id,
            action: "progress_updated",
            detail: `Progress updated from ${current.progress}% to ${data.progress}%`,
          },
        });
      }
    });

    revalidatePath("/clients");
    revalidatePath("/projects");
    return { success: true };
  } catch (error) {
    console.error("Failed to update project:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to update project" };
  }
}

export async function updateProjectStatus(
  id: string,
  status: "NEW" | "ONGOING" | "REVIEW" | "COMPLETED" | "ON_HOLD" | "CANCELLED"
) {
  try {
    if (!id) throw new Error("Project ID is required");

    const current = await prisma.project.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!current) throw new Error("Project not found");

    await prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id },
        data: { status },
      });

      if (current.status !== status) {
        await tx.projectActivity.create({
          data: {
            projectId: id,
            action: "status_changed",
            detail: `Status updated from ${current.status.toLowerCase()} to ${status.toLowerCase()} via Kanban Board`,
          },
        });
      }
    });

    revalidatePath("/clients");
    revalidatePath("/projects");
    return { success: true };
  } catch (error) {
    console.error("Failed to update project status:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to update project status" };
  }
}

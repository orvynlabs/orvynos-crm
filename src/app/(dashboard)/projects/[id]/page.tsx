import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProjectDetailClient } from "./project-detail-client";

export const revalidate = 0;

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [project, clients, teamMembers] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        payments: {
          orderBy: { paidAt: "desc" },
          select: {
            id: true,
            amount: true,
            method: true,
            status: true,
            paidAt: true,
            reference: true,
            notes: true,
          },
        },
        members: {
          include: {
            teamMember: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                  },
                },
              },
            },
          },
          orderBy: { assignedAt: "asc" },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        notes: {
          orderBy: { createdAt: "desc" },
          include: {
            createdBy: {
              select: { name: true },
            },
          },
        },
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
    prisma.teamMember.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        user: {
          name: "asc",
        },
      },
    }),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <ProjectDetailClient
      project={JSON.parse(JSON.stringify(project))}
      clients={clients}
      teamMembers={teamMembers}
    />
  );
}

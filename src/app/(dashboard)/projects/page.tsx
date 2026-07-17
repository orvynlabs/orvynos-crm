import { prisma } from "@/lib/db";
import { ProjectsClient } from "./projects-client";

export const revalidate = 0; // Disable cache for real-time listing updates

export default async function ProjectsPage() {
  // Query projects, clients, metrics, and team members concurrently to optimize database latency
  const [projects, clients, totalCount, ongoingCount, completedCount, onHoldCount, teamMembers] = await Promise.all([
    prisma.project.findMany({
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
          },
        },
        members: {
          select: {
            id: true,
            teamMember: {
              select: {
                id: true,
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
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
    prisma.project.count(),
    prisma.project.count({
      where: {
        status: { in: ["NEW", "ONGOING"] },
      },
    }),
    prisma.project.count({
      where: { status: "COMPLETED" },
    }),
    prisma.project.count({
      where: {
        status: "ON_HOLD",
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

  return (
    <ProjectsClient
      initialProjects={JSON.parse(JSON.stringify(projects))}
      clients={clients}
      teamMembers={teamMembers}
      metrics={{
        totalProjects: totalCount,
        activeProjects: ongoingCount,
        completedProjects: completedCount,
        onHoldProjects: onHoldCount,
      }}
    />
  );
}

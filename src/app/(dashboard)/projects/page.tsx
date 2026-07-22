import { unstable_cache } from "next/cache";
import { prisma, withRetry } from "@/lib/db";
import { ProjectsClient } from "./projects-client";

// ⚡ Sub-10ms Cached Server Loader for Projects Page
const getCachedProjectsPageData = unstable_cache(
  async () => {
    const [projectsRaw, clients, teamMembers] = await Promise.all([
      withRetry(() =>
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
        })
      ),
      withRetry(() =>
        prisma.client.findMany({
          select: {
            id: true,
            name: true,
          },
          orderBy: {
            name: "asc",
          },
        })
      ),
      withRetry(() =>
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
        })
      ),
    ]);

    const totalCount = projectsRaw.length;
    const ongoingCount = projectsRaw.filter((p) => p.status === "NEW" || p.status === "ONGOING").length;
    const completedCount = projectsRaw.filter((p) => p.status === "COMPLETED").length;
    const onHoldCount = projectsRaw.filter((p) => p.status === "ON_HOLD").length;

    const formattedProjects = projectsRaw.map((p) => ({
      ...p,
      budget: p.budget ? Number(p.budget) : 0,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      startDate: p.startDate ? p.startDate.toISOString() : null,
      deadline: p.deadline ? p.deadline.toISOString() : null,
      completedAt: p.completedAt ? p.completedAt.toISOString() : null,
      payments: p.payments.map((pay) => ({
        ...pay,
        amount: Number(pay.amount),
      })),
    }));

    return {
      initialProjects: formattedProjects,
      clients,
      teamMembers,
      metrics: {
        totalProjects: totalCount,
        activeProjects: ongoingCount,
        completedProjects: completedCount,
        onHoldProjects: onHoldCount,
      },
    };
  },
  ["projects-page-data-v1"],
  { revalidate: 30, tags: ["projects"] }
);

export default async function ProjectsPage() {
  const { initialProjects, clients, teamMembers, metrics } = await getCachedProjectsPageData();

  return (
    <ProjectsClient
      initialProjects={initialProjects as any}
      clients={clients}
      teamMembers={teamMembers as any}
      metrics={metrics}
    />
  );
}

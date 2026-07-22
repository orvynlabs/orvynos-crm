import { unstable_cache } from "next/cache";
import { prisma, withRetry } from "@/lib/db";
import { ClientsClient } from "./clients-client";

// ⚡ Sub-10ms Cached Server Loader for Clients Page
const getCachedClientsPageData = unstable_cache(
  async () => {
    const [clientsRaw, projectsRaw] = await Promise.all([
      withRetry(() =>
        prisma.client.findMany({
          include: {
            projects: {
              orderBy: {
                createdAt: "desc",
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        })
      ),
      withRetry(() =>
        prisma.project.findMany({
          select: {
            id: true,
            status: true,
          },
        })
      ),
    ]);

    const totalClients = clientsRaw.length;
    const totalProjects = projectsRaw.length;
    const ongoingProjects = projectsRaw.filter((p) => p.status === "ONGOING").length;
    const completedProjects = projectsRaw.filter((p) => p.status === "COMPLETED").length;

    const formattedClients = clientsRaw.map((c) => ({
      id: c.id,
      name: c.name,
      logo: c.logo,
      contactName: c.contactName,
      email: c.email,
      phone: c.phone,
      secondaryPhone: c.secondaryPhone,
      website: c.website,
      address: c.address,
      city: c.city,
      state: c.state,
      gstin: c.gstin,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      projects: c.projects.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
        budget: p.budget ? Number(p.budget) : 0,
        progress: p.progress,
        techStack: p.techStack,
        startDate: p.startDate ? p.startDate.toISOString() : null,
        deadline: p.deadline ? p.deadline.toISOString() : null,
        completedAt: p.completedAt ? p.completedAt.toISOString() : null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    }));

    return {
      initialClients: formattedClients,
      metrics: {
        totalClients,
        totalProjects,
        ongoingProjects,
        completedProjects,
      },
    };
  },
  ["clients-page-data-v1"],
  { revalidate: 30, tags: ["clients"] }
);

export default async function ClientsPage() {
  const { initialClients, metrics } = await getCachedClientsPageData();

  return <ClientsClient initialClients={initialClients as any} metrics={metrics} />;
}

import { prisma } from "@/lib/db";
import { ClientsClient } from "./clients-client";

export const revalidate = 0; // Disable caching to fetch real-time updates

export default async function ClientsPage() {

  // Fetch clients and pipeline metrics concurrently to minimize Neon database latency
  const [clients, totalProjects, ongoingProjects, completedProjects] = await Promise.all([
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
    }),
    prisma.project.count(),
    prisma.project.count({
      where: { status: "ONGOING" },
    }),
    prisma.project.count({
      where: { status: "COMPLETED" },
    }),
  ]);

  const totalClients = clients.length;

  return (
    <ClientsClient
      initialClients={JSON.parse(JSON.stringify(clients))}
      metrics={{
        totalClients,
        totalProjects,
        ongoingProjects,
        completedProjects,
      }}
    />
  );
}

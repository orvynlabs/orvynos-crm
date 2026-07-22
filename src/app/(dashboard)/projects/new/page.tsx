import { prisma } from "@/lib/db";
import { NewProjectClient } from "./new-project-client";

export default async function NewProjectPage() {

  // Fetch clients and team members concurrently to optimize database latency
  const [clients, teamMembers] = await Promise.all([
    prisma.client.findMany({
      orderBy: {
        name: "asc",
      },
    }),
    prisma.teamMember.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
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
    <NewProjectClient
      clients={JSON.parse(JSON.stringify(clients))}
      teamMembers={JSON.parse(JSON.stringify(teamMembers))}
    />
  );
}

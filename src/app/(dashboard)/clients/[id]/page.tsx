import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ClientDetailClient } from "./client-detail-client";

export const revalidate = 0; // Disable cache for instant updates

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {

  // Next.js 15: params must be awaited before extracting parameters
  const { id } = await params;

  // Query the client, projects, payments, and notes in one call
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      projects: {
        orderBy: { createdAt: "desc" },
        include: {
          activities: {
            orderBy: { createdAt: "desc" },
          },
        },
      },
      payments: {
        orderBy: { paidAt: "desc" },
        include: {
          project: {
            select: { name: true },
          },
        },
      },
      notes: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!client) {
    notFound();
  }

  return <ClientDetailClient client={JSON.parse(JSON.stringify(client))} />;
}

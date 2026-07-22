import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ClientDetailClient } from "./client-detail-client";

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
      documents: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!client) {
    notFound();
  }

  const formattedClient = {
    id: client.id,
    name: client.name,
    logo: client.logo,
    contactName: client.contactName,
    email: client.email,
    phone: client.phone,
    secondaryPhone: client.secondaryPhone,
    website: client.website,
    address: client.address,
    city: client.city,
    state: client.state,
    gstin: client.gstin,
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString(),
    projects: client.projects.map((p) => ({
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
      activities: p.activities.map((act) => ({
        id: act.id,
        projectId: act.projectId,
        action: act.action,
        detail: act.detail,
        createdAt: act.createdAt.toISOString(),
      })),
    })),
    payments: client.payments.map((pmt) => ({
      id: pmt.id,
      amount: pmt.amount ? Number(pmt.amount) : 0,
      status: pmt.status,
      method: pmt.method,
      reference: pmt.reference,
      notes: pmt.notes,
      paidAt: pmt.paidAt.toISOString(),
      createdAt: pmt.createdAt.toISOString(),
      updatedAt: pmt.updatedAt.toISOString(),
      project: pmt.project ? { name: pmt.project.name } : null,
    })),
    notes: client.notes.map((n) => ({
      id: n.id,
      content: n.content,
      createdAt: n.createdAt.toISOString(),
    })),
    documents: client.documents.map((d) => ({
      id: d.id,
      name: d.name,
      type: d.type,
      r2Key: d.r2Key,
      mimeType: d.mimeType || "application/octet-stream",
      size: d.size || 0,
      createdAt: d.createdAt.toISOString(),
    })),
  };

  return <ClientDetailClient client={formattedClient} />;
}

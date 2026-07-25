import { notFound } from "next/navigation";
import { prisma, withRetry } from "@/lib/db";
import { ProjectDetailClient } from "./project-detail-client";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [project, clients, teamMembers] = await Promise.all([
    withRetry(() =>
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
              receiptNumber: true,
              receiptKey: true,
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
            take: 20,
          },
          notes: {
            orderBy: { createdAt: "desc" },
            include: {
              createdBy: {
                select: { name: true },
              },
            },
          },
          documents: {
            orderBy: { createdAt: "desc" },
            include: {
              uploadedBy: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          invoices: {
            orderBy: { createdAt: "desc" },
          },
          proposals: {
            orderBy: { createdAt: "desc" },
          },
          agreements: {
            orderBy: { createdAt: "desc" },
          },
          quotations: {
            orderBy: { createdAt: "desc" },
          },
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
        select: {
          id: true,
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

  if (!project) {
    notFound();
  }

  const rawFormatted = JSON.parse(JSON.stringify(project));
  const formattedProject = {
    ...rawFormatted,
    budget: Number(project.budget || 0),
    startDate: project.startDate ? project.startDate.toISOString() : null,
    deadline: project.deadline ? project.deadline.toISOString() : null,
    completedAt: project.completedAt ? project.completedAt.toISOString() : null,
    createdAt: project.createdAt ? project.createdAt.toISOString() : null,
    updatedAt: project.updatedAt ? project.updatedAt.toISOString() : null,
    payments: project.payments.map((pay) => ({
      ...pay,
      amount: Number(pay.amount || 0),
      paidAt: pay.paidAt ? pay.paidAt.toISOString() : null,
    })),
    members: project.members.map((m) => ({
      ...m,
      assignedAt: m.assignedAt ? m.assignedAt.toISOString() : null,
    })),
    activities: project.activities.map((act) => ({
      ...act,
      createdAt: act.createdAt ? act.createdAt.toISOString() : null,
    })),
    notes: project.notes.map((n) => ({
      ...n,
      createdAt: n.createdAt ? n.createdAt.toISOString() : null,
    })),
    documents: project.documents.map((doc) => ({
      ...doc,
      createdAt: doc.createdAt ? doc.createdAt.toISOString() : null,
      updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : null,
    })),
    invoices: project.invoices.map((inv) => ({
      ...inv,
      subtotal: Number(inv.subtotal || 0),
      taxRate: Number(inv.taxRate || 0),
      taxAmount: Number(inv.taxAmount || 0),
      total: Number(inv.total || 0),
      issueDate: inv.issueDate ? inv.issueDate.toISOString() : null,
      dueDate: inv.dueDate ? inv.dueDate.toISOString() : null,
      createdAt: inv.createdAt ? inv.createdAt.toISOString() : null,
      updatedAt: inv.updatedAt ? inv.updatedAt.toISOString() : null,
    })),
    proposals: project.proposals.map((prop) => ({
      ...prop,
      amount: prop.amount ? Number(prop.amount) : null,
      validUntil: prop.validUntil ? prop.validUntil.toISOString() : null,
      createdAt: prop.createdAt ? prop.createdAt.toISOString() : null,
      updatedAt: prop.updatedAt ? prop.updatedAt.toISOString() : null,
    })),
    agreements: project.agreements.map((agr) => ({
      ...agr,
      effectiveDate: agr.effectiveDate ? agr.effectiveDate.toISOString() : null,
      expiresAt: agr.expiresAt ? agr.expiresAt.toISOString() : null,
      createdAt: agr.createdAt ? agr.createdAt.toISOString() : null,
      updatedAt: agr.updatedAt ? agr.updatedAt.toISOString() : null,
    })),
    quotations: project.quotations.map((q) => ({
      ...q,
      subtotal: Number(q.subtotal || 0),
      taxRate: Number(q.taxRate || 0),
      taxAmount: Number(q.taxAmount || 0),
      total: Number(q.total || 0),
      issueDate: q.issueDate ? q.issueDate.toISOString() : null,
      validUntil: q.validUntil ? q.validUntil.toISOString() : null,
      createdAt: q.createdAt ? q.createdAt.toISOString() : null,
      updatedAt: q.updatedAt ? q.updatedAt.toISOString() : null,
    })),
  };

  return (
    <ProjectDetailClient
      project={formattedProject as any}
      clients={clients}
      teamMembers={teamMembers as any}
    />
  );
}

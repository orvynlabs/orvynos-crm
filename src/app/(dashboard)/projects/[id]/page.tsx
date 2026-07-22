import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import { prisma, withRetry } from "@/lib/db";
import { ProjectDetailClient } from "./project-detail-client";

const getCachedProjectDetailData = (id: string) =>
  unstable_cache(
    async () => {
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

      if (!project) return null;

      const formattedProject = {
        ...project,
        budget: project.budget ? Number(project.budget) : 0,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        startDate: project.startDate ? project.startDate.toISOString() : null,
        deadline: project.deadline ? project.deadline.toISOString() : null,
        completedAt: project.completedAt ? project.completedAt.toISOString() : null,
        payments: project.payments.map((pay) => ({
          ...pay,
          amount: Number(pay.amount),
          paidAt: pay.paidAt ? pay.paidAt.toISOString() : null,
        })),
        members: project.members.map((m) => ({
          ...m,
          assignedAt: m.assignedAt.toISOString(),
        })),
        activities: project.activities.map((act) => ({
          ...act,
          createdAt: act.createdAt.toISOString(),
        })),
        notes: project.notes.map((n) => ({
          ...n,
          createdAt: n.createdAt.toISOString(),
        })),
        documents: project.documents.map((doc) => ({
          ...doc,
          createdAt: doc.createdAt.toISOString(),
        })),
        invoices: project.invoices.map((inv) => ({
          ...inv,
          subtotal: Number(inv.subtotal),
          taxAmount: Number(inv.taxAmount),
          total: Number(inv.total),
          createdAt: inv.createdAt.toISOString(),
          dueDate: inv.dueDate ? inv.dueDate.toISOString() : null,
        })),
        proposals: project.proposals.map((prop) => ({
          ...prop,
          amount: Number(prop.amount),
          createdAt: prop.createdAt.toISOString(),
        })),
        agreements: project.agreements.map((agr) => ({
          ...agr,
          createdAt: agr.createdAt.toISOString(),
        })),
        quotations: project.quotations.map((q) => ({
          ...q,
          subtotal: Number(q.subtotal),
          taxAmount: Number(q.taxAmount),
          total: Number(q.total),
          createdAt: q.createdAt.toISOString(),
        })),
      };

      return {
        project: formattedProject,
        clients,
        teamMembers,
      };
    },
    [`project-detail-${id}`],
    { revalidate: 30, tags: [`project-${id}`, "projects"] }
  )();

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getCachedProjectDetailData(id);

  if (!data || !data.project) {
    notFound();
  }

  return (
    <ProjectDetailClient
      project={data.project as any}
      clients={data.clients}
      teamMembers={data.teamMembers as any}
    />
  );
}

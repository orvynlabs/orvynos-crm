import { notFound } from "next/navigation";
import { prisma, withRetry } from "@/lib/db";
import { ClientDetailClient } from "./client-detail-client";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [client, clientExpensesRaw, allDocs, allProposals, allInvoices, allAgreements] = await Promise.all([
    withRetry(() =>
      prisma.client.findUnique({
        where: { id },
        include: {
          projects: {
            orderBy: { createdAt: "desc" },
            include: {
              activities: {
                orderBy: { createdAt: "desc" },
                take: 10,
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
      })
    ),
    withRetry(() =>
      prisma.expense.findMany({
        where: {
          project: {
            clientId: id,
          },
        },
        select: { amount: true },
      })
    ),
    withRetry(() =>
      prisma.document.findMany({
        where: { OR: [{ clientId: id }, { project: { clientId: id } }] },
        orderBy: { createdAt: "desc" },
      })
    ),
    withRetry(() =>
      prisma.proposal.findMany({
        where: { OR: [{ clientId: id }, { project: { clientId: id } }] },
        orderBy: { createdAt: "desc" },
      })
    ),
    withRetry(() =>
      prisma.invoice.findMany({
        where: { OR: [{ clientId: id }, { project: { clientId: id } }] },
        orderBy: { createdAt: "desc" },
      })
    ),
    withRetry(() =>
      prisma.agreement.findMany({
        where: { OR: [{ clientId: id }, { project: { clientId: id } }] },
        orderBy: { createdAt: "desc" },
      })
    ),
  ]);

  if (!client) {
    notFound();
  }

  const totalClientExpenses = (clientExpensesRaw || []).reduce((sum, e) => sum + Number(e.amount), 0);
  const totalCollected = client.payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const clientNetProfit = totalCollected - totalClientExpenses;
  const clientProfitMargin = totalCollected > 0 ? Math.round((clientNetProfit / totalCollected) * 100) : 0;

  const formattedClient = {
    id: client.id,
    name: client.name,
    logo: client.logo,
    contactName: client.contactName,
    email: client.email,
    totalExpenses: totalClientExpenses,
    netProfit: clientNetProfit,
    profitMargin: clientProfitMargin,
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
    documents: (allDocs || []).map((d) => ({
      id: d.id,
      name: d.name,
      type: d.type,
      r2Key: d.r2Key,
      mimeType: d.mimeType || "application/octet-stream",
      size: d.size || 0,
      createdAt: d.createdAt.toISOString(),
    })),
    proposals: (allProposals || []).map((p) => ({
      id: p.id,
      number: p.number,
      title: p.title,
      amount: p.amount ? Number(p.amount) : null,
      status: p.status,
      pdfKey: p.pdfKey,
      createdAt: p.createdAt.toISOString(),
    })),
    invoices: (allInvoices || []).map((inv) => ({
      id: inv.id,
      number: inv.number,
      total: Number(inv.total),
      status: inv.status,
      pdfKey: inv.pdfKey,
      createdAt: inv.createdAt.toISOString(),
    })),
    agreements: (allAgreements || []).map((a) => ({
      id: a.id,
      number: a.number,
      title: a.title,
      status: a.status,
      pdfKey: a.pdfKey,
      createdAt: a.createdAt.toISOString(),
    })),
  };

  return <ClientDetailClient client={formattedClient} />;
}

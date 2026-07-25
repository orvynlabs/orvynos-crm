"use server";

import { prisma, withRetry } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { generateAndSaveDocument } from "@/lib/pdf";
import { renderProposalHtml, type ProposalTemplateProps, type PricingItem } from "@/components/pdf-templates/ProposalTemplate";
import { renderInvoiceHtml, type InvoiceTemplateProps, type InvoiceLineItem } from "@/components/pdf-templates/InvoiceTemplate";
import { renderAgreementHtml, substituteVariables, AGREEMENT_TEMPLATES, type AgreementTemplateProps, type AgreementClause } from "@/components/pdf-templates/AgreementTemplate";

const DEFAULT_TERMS_TEXT = `1. Payment is due as per the agreed milestone schedule.
2. This proposal is valid for the period specified above.
3. Any changes to the scope may result in adjustments to timeline and pricing.
4. All intellectual property will be transferred upon full payment.
5. Confidentiality of shared information is maintained by both parties.`;

// ─────────────────────────────────────────────
// Data Loading
// ─────────────────────────────────────────────

export async function getGeneratorData() {
  try {
    return await withRetry(async () => {
      let [clients, leads, projects, proposals, invoices, agreements] = await Promise.all([
        prisma.client.findMany({
          select: {
            id: true, name: true, contactName: true, email: true, phone: true,
            gstin: true, address: true, city: true, state: true,
          },
          orderBy: { name: "asc" },
        }),
        prisma.lead.findMany({
          select: {
            id: true, name: true, company: true, email: true, phone: true, stage: true, convertedClientId: true,
          },
          orderBy: { name: "asc" },
        }),
        prisma.project.findMany({
          select: { id: true, name: true, clientId: true, budget: true },
          orderBy: { name: "asc" },
        }),
        prisma.proposal.findMany({
          select: {
            id: true, number: true, title: true, clientId: true, client: { select: { name: true } },
            projectId: true, project: { select: { name: true } }, amount: true, status: true,
            validUntil: true, pdfKey: true, createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.invoice.findMany({
          select: {
            id: true, number: true, clientId: true, client: { select: { name: true } },
            projectId: true, project: { select: { name: true } }, subtotal: true, taxRate: true,
            taxAmount: true, total: true, status: true, issueDate: true, dueDate: true,
            notes: true, pdfKey: true, createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.agreement.findMany({
          select: {
            id: true, number: true, title: true, clientId: true, client: { select: { name: true } },
            projectId: true, project: { select: { name: true } }, status: true,
            effectiveDate: true, expiresAt: true, pdfKey: true, createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        }),
      ]);

      return {
        success: true,
        data: {
          clients: clients.map(c => ({
            ...c,
            address: [c.address, c.city, c.state].filter(Boolean).join(', '),
          })),
          leads: leads.map(l => ({ ...l, displayName: l.company ? `${l.name} (${l.company})` : l.name })),
          projects: projects.map(p => ({ ...p, budget: Number(p.budget) })),
          proposals: proposals.map(p => ({ ...p, clientName: p.client.name, projectName: p.project?.name || null, amount: p.amount ? Number(p.amount) : null, validUntil: p.validUntil ? p.validUntil.toISOString() : null, createdAt: p.createdAt.toISOString() })),
          invoices: invoices.map(i => ({ ...i, clientName: i.client.name, projectName: i.project?.name || null, subtotal: Number(i.subtotal), taxRate: Number(i.taxRate), taxAmount: Number(i.taxAmount), total: Number(i.total), issueDate: i.issueDate.toISOString(), dueDate: i.dueDate ? i.dueDate.toISOString() : null, createdAt: i.createdAt.toISOString() })),
          agreements: agreements.map(a => ({ ...a, clientName: a.client.name, projectName: a.project?.name || null, effectiveDate: a.effectiveDate ? a.effectiveDate.toISOString() : null, expiresAt: a.expiresAt ? a.expiresAt.toISOString() : null, createdAt: a.createdAt.toISOString() })),
        },
      };
    });
  } catch (error: any) {
    console.error("Failed to load generator data:", error);
    return { success: false, error: error?.message || "Failed to load generator data" };
  }
}

// ─────────────────────────────────────────────
// Auto-increment document numbers
// ─────────────────────────────────────────────

async function getNextNumber(prefix: string, model: 'proposal' | 'invoice' | 'agreement'): Promise<string> {
  return withRetry(async () => {
    const year = new Date().getFullYear();
    const pattern = `${prefix}-${year}-`;

    let lastNumber: string | null = null;

    if (model === 'proposal') {
      const last = await prisma.proposal.findFirst({
        where: { number: { startsWith: pattern } },
        orderBy: { number: 'desc' },
        select: { number: true },
      });
      lastNumber = last?.number || null;
    } else if (model === 'invoice') {
      const last = await prisma.invoice.findFirst({
        where: { number: { startsWith: pattern } },
        orderBy: { number: 'desc' },
        select: { number: true },
      });
      lastNumber = last?.number || null;
    } else {
      const last = await prisma.agreement.findFirst({
        where: { number: { startsWith: pattern } },
        orderBy: { number: 'desc' },
        select: { number: true },
      });
      lastNumber = last?.number || null;
    }

    if (lastNumber) {
      const parts = lastNumber.split('-');
      const seq = parseInt(parts[parts.length - 1], 10) + 1;
      return `${pattern}${seq.toString().padStart(4, '0')}`;
    }

    return `${pattern}0001`;
  });
}

// ─────────────────────────────────────────────
// Client or Lead Resolver
// ─────────────────────────────────────────────

async function resolveClientId(params: { clientId?: string; leadId?: string; sessionUserId?: string }): Promise<string> {
  if (params.clientId) return params.clientId;
  if (!params.leadId) throw new Error("Please select a Client or Lead.");

  return withRetry(async () => {
    const lead = await prisma.lead.findUnique({
      where: { id: params.leadId },
    });
    if (!lead) throw new Error("Selected Lead not found.");

    if (lead.convertedClientId) {
      return lead.convertedClientId;
    }

    // Create Client record from Lead
    const clientName = lead.company || lead.name;
    const client = await prisma.client.create({
      data: {
        name: clientName,
        contactName: lead.name,
        email: lead.email || null,
        phone: lead.phone || null,
      },
    });

    // Link lead to created client and update stage
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        convertedClientId: client.id,
        stage: 'PROPOSAL_SENT',
      },
    });

    // Record activity
    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        type: 'STAGE_CHANGE',
        content: `Document generated for lead. Linked to client "${client.name}" and updated stage to Proposal Sent.`,
        createdById: params.sessionUserId || null,
      },
    });

    return client.id;
  });
}

// ─────────────────────────────────────────────
// Proposal Generator
// ─────────────────────────────────────────────

export async function createProposal(data: {
  title: string;
  clientId?: string;
  leadId?: string;
  projectId?: string;
  executiveSummary: string;
  scope: string;
  deliverables: string[];
  timeline: string;
  pricingItems: PricingItem[];
  totalAmount: number;
  termsAndConditions: string;
  validUntil: string;
}) {
  try {
    let sessionUserId: string | undefined;
    try {
      const session = await auth();
      sessionUserId = session?.user?.id;
    } catch {}

    const targetClientId = await resolveClientId({
      clientId: data.clientId,
      leadId: data.leadId,
      sessionUserId,
    });

    const number = await getNextNumber('PROP', 'proposal');

    const client = await withRetry(() => prisma.client.findUnique({
      where: { id: targetClientId },
      select: { name: true, contactName: true, email: true, phone: true, gstin: true, address: true, city: true, state: true },
    }));
    if (!client) throw new Error("Client record not found");

    const project = data.projectId
      ? await withRetry(() => prisma.project.findUnique({ where: { id: data.projectId }, select: { name: true } }))
      : null;

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    const templateProps: ProposalTemplateProps = {
      proposalNumber: number,
      title: data.title,
      date: dateStr,
      validUntil: new Date(data.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      status: 'DRAFT',
      clientName: client.name,
      clientContactName: client.contactName || undefined,
      clientEmail: client.email || undefined,
      clientPhone: client.phone || undefined,
      clientGstin: client.gstin || undefined,
      clientAddress: [client.address, client.city, client.state].filter(Boolean).join(', ') || undefined,
      projectName: project?.name,
      executiveSummary: data.executiveSummary,
      scope: data.scope,
      deliverables: data.deliverables,
      timeline: data.timeline,
      pricingItems: data.pricingItems,
      totalAmount: data.totalAmount,
      termsAndConditions: data.termsAndConditions,
    };

    const html = renderProposalHtml(templateProps);

    const content = {
      executiveSummary: data.executiveSummary,
      scope: data.scope,
      deliverables: data.deliverables,
      timeline: data.timeline,
      pricingItems: data.pricingItems,
      termsAndConditions: data.termsAndConditions,
    };

    const { storageKey, documentId } = await generateAndSaveDocument({
      html,
      storagePrefix: 'proposals',
      fileBaseName: `proposal-${number.toLowerCase()}-${Date.now()}`,
      documentType: 'PROPOSAL',
      documentName: `Proposal ${number} — ${data.title}`,
      clientId: targetClientId,
      projectId: data.projectId,
      userId: sessionUserId || undefined,
    });

    const proposal = await withRetry(() => prisma.proposal.create({
      data: {
        number,
        title: data.title,
        clientId: targetClientId,
        projectId: data.projectId || null,
        content: content as any,
        amount: data.totalAmount,
        status: 'DRAFT',
        validUntil: new Date(data.validUntil),
        pdfKey: storageKey,
      },
    }));

    try {
      revalidatePath("/generators");
      revalidatePath("/documents");
      revalidatePath("/leads");
    } catch {}
    return { success: true, data: { id: proposal.id, number, pdfKey: storageKey, documentId } };
  } catch (error: any) {
    console.error("Failed to create proposal:", error);
    return { success: false, error: error?.message || "Failed to create proposal" };
  }
}

// ─────────────────────────────────────────────
// Invoice Generator
// ─────────────────────────────────────────────

export async function createInvoice(data: {
  clientId?: string;
  leadId?: string;
  projectId?: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  dueDate: string;
  notes?: string;
}) {
  try {
    let sessionUserId: string | undefined;
    try {
      const session = await auth();
      sessionUserId = session?.user?.id;
    } catch {}

    const targetClientId = await resolveClientId({
      clientId: data.clientId,
      leadId: data.leadId,
      sessionUserId,
    });

    const number = await getNextNumber('INV', 'invoice');

    const client = await withRetry(() => prisma.client.findUnique({
      where: { id: targetClientId },
      select: { name: true, contactName: true, email: true, phone: true, gstin: true, address: true, city: true, state: true },
    }));
    if (!client) throw new Error("Client record not found");

    const project = data.projectId
      ? await withRetry(() => prisma.project.findUnique({ where: { id: data.projectId }, select: { name: true } }))
      : null;

    const now = new Date();
    const issueDateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const dueDateStr = new Date(data.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    const templateProps: InvoiceTemplateProps = {
      invoiceNumber: number,
      issueDate: issueDateStr,
      dueDate: dueDateStr,
      status: 'DRAFT',
      clientName: client.name,
      clientContactName: client.contactName || undefined,
      clientEmail: client.email || undefined,
      clientPhone: client.phone || undefined,
      clientGstin: client.gstin || undefined,
      clientAddress: [client.address, client.city, client.state].filter(Boolean).join(', ') || undefined,
      projectName: project?.name,
      lineItems: data.lineItems,
      subtotal: data.subtotal,
      taxRate: data.taxRate,
      taxAmount: data.taxAmount,
      total: data.total,
      notes: data.notes,
    };

    const html = renderInvoiceHtml(templateProps);

    const { storageKey, documentId } = await generateAndSaveDocument({
      html,
      storagePrefix: 'invoices',
      fileBaseName: `invoice-${number.toLowerCase()}-${Date.now()}`,
      documentType: 'INVOICE',
      documentName: `Invoice ${number} — ${client.name}`,
      clientId: targetClientId,
      projectId: data.projectId,
      userId: sessionUserId || undefined,
    });

    const invoice = await withRetry(() => prisma.invoice.create({
      data: {
        number,
        clientId: targetClientId,
        projectId: data.projectId || null,
        items: data.lineItems as any,
        subtotal: data.subtotal,
        taxRate: data.taxRate,
        taxAmount: data.taxAmount,
        total: data.total,
        status: 'DRAFT',
        issueDate: now,
        dueDate: new Date(data.dueDate),
        notes: data.notes || null,
        pdfKey: storageKey,
      },
    }));

    try {
      revalidatePath("/generators");
      revalidatePath("/documents");
      revalidatePath("/leads");
    } catch {}
    return { success: true, data: { id: invoice.id, number, pdfKey: storageKey, documentId } };
  } catch (error: any) {
    console.error("Failed to create invoice:", error);
    return { success: false, error: error?.message || "Failed to create invoice" };
  }
}

// ─────────────────────────────────────────────
// Agreement Generator
// ─────────────────────────────────────────────

export async function createAgreement(data: {
  title: string;
  templateType?: string; // default MASTER
  clientId?: string;
  leadId?: string;
  projectId?: string;
  effectiveDate: string;
  expiresAt?: string;
  customClauses?: AgreementClause[];
  projectOverview?: string;
  deliverables?: { deliverable: string; description: string; status?: string }[];
  outOfScopeItems?: string[];
  techStack?: string[];
  milestones?: { milestone: string; workDescription: string; dueDate: string; paymentAmount: number }[];
  totalFee?: number;
  advanceAmount?: number;
}) {
  try {
    let sessionUserId: string | undefined;
    try {
      const session = await auth();
      sessionUserId = session?.user?.id;
    } catch {}

    const targetClientId = await resolveClientId({
      clientId: data.clientId,
      leadId: data.leadId,
      sessionUserId,
    });

    const number = await getNextNumber('AGR', 'agreement');

    const client = await withRetry(() => prisma.client.findUnique({
      where: { id: targetClientId },
      select: { name: true, contactName: true, email: true, phone: true, address: true, city: true, state: true },
    }));
    if (!client) throw new Error("Client record not found");

    const project = data.projectId
      ? await withRetry(() => prisma.project.findUnique({ where: { id: data.projectId }, select: { name: true } }))
      : null;

    const effectiveDateStr = new Date(data.effectiveDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const expiresAtStr = data.expiresAt
      ? new Date(data.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
      : undefined;

    const templateType = data.templateType || 'MASTER';
    let clauses: AgreementClause[] = data.customClauses || [];

    const vars: Record<string, string> = {
      client_name: client.name,
      company_name: 'Orvyn Labs Partnership',
      project_name: project?.name || 'Agreed Digital Services',
      effective_date: effectiveDateStr,
      expires_at: expiresAtStr || 'N/A',
    };
    clauses = clauses.map((c: AgreementClause) => ({
      title: c.title,
      content: substituteVariables(c.content, vars),
    }));

    const defaultTitle = data.title || (
      templateType === 'COMPLETION' ? 'Project Completion & Handover Certificate (PCC)' :
      templateType === 'SOW' ? 'Statement of Work (SOW)' :
      'Master Service & Confidentiality Agreement'
    );

    const templateProps: AgreementTemplateProps = {
      agreementNumber: number,
      title: defaultTitle,
      templateType: templateType,
      effectiveDate: effectiveDateStr,
      expiresAt: expiresAtStr,
      status: 'DRAFT',
      clientName: client.name,
      clientContactName: client.contactName || undefined,
      clientEmail: client.email || undefined,
      clientPhone: client.phone || undefined,
      clientAddress: [client.address, client.city, client.state].filter(Boolean).join(', ') || undefined,
      projectName: project?.name,
      projectOverview: data.projectOverview,
      deliverables: data.deliverables,
      outOfScopeItems: data.outOfScopeItems,
      techStack: data.techStack,
      milestones: data.milestones,
      totalFee: data.totalFee,
      advanceAmount: data.advanceAmount,
      clauses,
    };

    const html = renderAgreementHtml(templateProps);

    const docTypeLabel = templateType === 'COMPLETION' ? 'Handover Certificate' : templateType === 'SOW' ? 'Statement of Work' : 'Master Agreement';

    const { storageKey, documentId } = await generateAndSaveDocument({
      html,
      storagePrefix: 'agreements',
      fileBaseName: `agreement-${number.toLowerCase()}-${Date.now()}`,
      documentType: 'AGREEMENT',
      documentName: `${docTypeLabel} ${number} — ${client.name}`,
      clientId: targetClientId,
      projectId: data.projectId,
      userId: sessionUserId || undefined,
    });

    const content = {
      templateType: templateType,
      clauses,
    };

    const agreement = await withRetry(() => prisma.agreement.create({
      data: {
        number,
        title: defaultTitle,
        clientId: targetClientId,
        projectId: data.projectId || null,
        content: content as any,
        status: 'DRAFT',
        effectiveDate: new Date(data.effectiveDate),
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        pdfKey: storageKey,
      },
    }));

    try {
      revalidatePath("/generators");
      revalidatePath("/documents");
      revalidatePath("/leads");
    } catch {}
    return { success: true, data: { id: agreement.id, number, pdfKey: storageKey, documentId } };
  } catch (error: any) {
    console.error("Failed to create agreement:", error);
    return { success: false, error: error?.message || "Failed to create agreement" };
  }
}

// ─────────────────────────────────────────────
// Demo Data Seeder
// ─────────────────────────────────────────────

export async function seedDemoGeneratorsData() {
  try {
    let sessionUserId: string | undefined;
    try {
      const session = await auth();
      sessionUserId = session?.user?.id;
    } catch {}

    // Purge old demo generator records so old cached PDFs are replaced
    await prisma.invoice.deleteMany({ where: { number: { startsWith: 'INV-2026' } } }).catch(() => { });
    await prisma.proposal.deleteMany({ where: { number: { startsWith: 'PROP-2026' } } }).catch(() => { });
    await prisma.agreement.deleteMany({ where: { number: { startsWith: 'AGR-2026' } } }).catch(() => { });

    // 1. Ensure at least one client exists
    let client = await prisma.client.findFirst();
    if (!client) {
      client = await prisma.client.create({
        data: {
          name: "Acme Technologies Pvt Ltd",
          contactName: "Rahul Sharma",
          email: "rahul@acmetech.in",
          phone: "+91 98765 43210",
          gstin: "32AAACA0000A1Z5",
          address: "Infopark Campus, Kakkanad",
          city: "Kochi",
          state: "Kerala",
        },
      });
    }

    // 2. Ensure at least one project exists
    let project = await prisma.project.findFirst({ where: { clientId: client.id } });
    if (!project) {
      project = await prisma.project.create({
        data: {
          name: "Enterprise Web App & CRM System",
          clientId: client.id,
          budget: 250000,
          status: "ONGOING",
        },
      });
    }

    // 3. Seed Fresh Demo Proposal (Full 4-Page Deck)
    const propRes = await createProposal({
      title: "Enterprise Web Application & Automation Proposal",
      clientId: client.id,
      projectId: project.id,
      executiveSummary: "Orvyn Labs is pleased to present this comprehensive proposal for building a high-performance Next.js enterprise web application with automated PDF generation pipelines, cloud storage integration, and real-time dashboard analytics tailored for your business expansion.",
      scope: "Full lifecycle engineering including modern UI/UX design system, Next.js App Router architecture, PostgreSQL database design, Playwright server-side rendering PDF pipeline, and Cloudflare R2 storage integration with automated client sync.",
      deliverables: [
        "Interactive Executive Dashboard & Lead/Client CRM Management System",
        "Playwright HTML-to-PDF Rendering Pipeline with Custom Brand System (#360CAF)",
        "Cloudflare R2 Storage Sync & Automatic Document Asset Linking",
        "Role-Based Authentication, Audit Logs & Production Deployment on Vercel",
      ],
      timeline: "6 weeks total execution split into 3 two-week sprints: Sprint 1 (Design & Architecture), Sprint 2 (Core Features & Generators), Sprint 3 (Testing & Handover).",
      pricingItems: [
        { description: "UI/UX Design System & Mobile Component Architecture", quantity: 1, rate: 50000, amount: 50000 },
        { description: "Next.js App Router Core Frontend & Server Actions", quantity: 1, rate: 120000, amount: 120000 },
        { description: "Playwright PDF Generator Engine & Cloud Storage Integration", quantity: 1, rate: 50000, amount: 50000 },
        { description: "QA Testing, Security Audit & Production Handover", quantity: 1, rate: 30000, amount: 30000 },
      ],
      totalAmount: 250000,
      termsAndConditions: DEFAULT_TERMS_TEXT,
      validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    });

    if (propRes.success && propRes.data?.id) {
      await prisma.proposal.update({ where: { id: propRes.data.id }, data: { status: "SENT" } });
    }

    // 4. Seed Fresh Demo Invoice
    const invRes = await createInvoice({
      clientId: client.id,
      projectId: project.id,
      lineItems: [
        { description: "Milestone 1 — Architecture & Database Setup", quantity: 1, rate: 75000, amount: 75000 },
        { description: "Milestone 2 — UI Dashboard & Document Generators", quantity: 1, rate: 75000, amount: 75000 },
      ],
      subtotal: 150000,
      taxRate: 18,
      taxAmount: 27000,
      total: 177000,
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      notes: "Payment due within 15 days of invoice date. Thank you for your business!",
    });

    if (invRes.success && invRes.data?.id) {
      await prisma.invoice.update({ where: { id: invRes.data.id }, data: { status: "SENT" } });
    }

    // 5. Seed Fresh Demo Master Agreement (MSA)
    const agrRes = await createAgreement({
      title: "Master Services Agreement (MSA)",
      templateType: "MASTER",
      clientId: client.id,
      projectId: project.id,
      effectiveDate: new Date().toISOString().split('T')[0],
    });

    if (agrRes.success && agrRes.data?.id) {
      await prisma.agreement.update({ where: { id: agrRes.data.id }, data: { status: "SIGNED" } });
    }

    // 6. Seed Fresh Demo Statement of Work (SOW)
    const sowRes = await createAgreement({
      title: "Statement of Work (SOW) — Project Engineering Scope",
      templateType: "SOW",
      clientId: client.id,
      projectId: project.id,
      effectiveDate: new Date().toISOString().split('T')[0],
      projectOverview: "Engineering high-performance enterprise web application architecture, cloud document generators, and automated lead CRM analytics.",
      deliverables: [
        { deliverable: "Cloud & Database Architecture", description: "Next.js 14 App Router setup, Neon PostgreSQL schema design, Prisma ORM integration, and Backblaze B2 storage pipeline." },
        { deliverable: "Document Generator Engine", description: "Playwright Chromium HTML-to-PDF rendering engine for single-page print Invoices, Proposals, and Multi-page Agreements." },
        { deliverable: "CRM Analytics Dashboard", description: "Real-time client management, lead pipeline tracking, milestone billing, and enterprise digital payment suite." },
      ],
      outOfScopeItems: [
        "Third-party paid API subscription costs (Client provides API keys)",
        "Unbudgeted custom mobile app native development for iOS App Store",
      ],
      techStack: [
        "Next.js 14 App Router", "TypeScript", "TailwindCSS", "Prisma ORM", "Neon PostgreSQL", "Backblaze B2", "Playwright PDF",
      ],
      milestones: [
        { milestone: "Milestone 1", workDescription: "Architecture, DB Schema & Authentication Engine", dueDate: "30 July 2026", paymentAmount: 75000 },
        { milestone: "Milestone 2", workDescription: "Document Generators & Analytics Handover", dueDate: "15 August 2026", paymentAmount: 75000 },
      ],
      totalFee: 150000,
      advanceAmount: 30000,
    });

    if (sowRes.success && sowRes.data?.id) {
      await prisma.agreement.update({ where: { id: sowRes.data.id }, data: { status: "SIGNED" } });
    }

    // 7. Seed Fresh Demo Project Completion Certificate (PCC)
    const pccRes = await createAgreement({
      title: "Project Completion & Handover Certificate (PCC)",
      templateType: "COMPLETION",
      clientId: client.id,
      projectId: project.id,
      effectiveDate: new Date().toISOString().split('T')[0],
      projectOverview: "Official certificate confirming all software development, cloud deployment pipelines, database schema design, and document generator modules have been 100% completed, tested, and handed over.",
      deliverables: [
        { deliverable: "Cloud & Database Architecture", description: "Next.js App Router, Neon PostgreSQL schema design, Prisma ORM, and cloud storage.", status: "VERIFIED & DELIVERED" },
        { deliverable: "Document Generator Engine", description: "Playwright Chromium HTML-to-PDF rendering engine for print Invoices, Proposals, Agreements, and Certificates.", status: "VERIFIED & DELIVERED" },
        { deliverable: "CRM Analytics Dashboard", description: "Real-time client management, lead pipeline tracking, milestone billing, and payment suite.", status: "VERIFIED & DELIVERED" },
      ],
      totalFee: 250000,
    });

    if (pccRes.success && pccRes.data?.id) {
      await prisma.agreement.update({ where: { id: pccRes.data.id }, data: { status: "SIGNED" } });
    }

    try {
      revalidatePath("/generators");
      revalidatePath("/documents");
    } catch {}
    return { success: true };
  } catch (err: any) {
    console.error("Failed to seed demo generator items:", err);
    return { success: false, error: err?.message };
  }
}

// ─────────────────────────────────────────────
// Delete
// ─────────────────────────────────────────────

export async function deleteGeneratorItem(id: string, type: 'proposal' | 'invoice' | 'agreement') {
  try {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    if (type === 'proposal') {
      await prisma.proposal.delete({ where: { id } });
    } else if (type === 'invoice') {
      await prisma.invoice.delete({ where: { id } });
    } else {
      await prisma.agreement.delete({ where: { id } });
    }

    revalidatePath("/generators");
    revalidatePath("/documents");
    return { success: true };
  } catch (error: any) {
    console.error(`Failed to delete ${type}:`, error);
    return { success: false, error: error?.message || `Failed to delete ${type}` };
  }
}

// ─────────────────────────────────────────────
// Update Status (DRAFT -> SENT -> ACCEPTED / SIGNED / PAID)
// ─────────────────────────────────────────────

export async function updateGeneratorStatus(
  id: string,
  type: 'proposal' | 'invoice' | 'agreement',
  newStatus: string
) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    if (type === 'proposal') {
      await prisma.proposal.update({ where: { id }, data: { status: newStatus as any } });
    } else if (type === 'invoice') {
      await prisma.invoice.update({ where: { id }, data: { status: newStatus as any } });
    } else if (type === 'agreement') {
      await prisma.agreement.update({ where: { id }, data: { status: newStatus as any } });
    }

    revalidatePath("/generators");
    revalidatePath("/documents");
    return { success: true };
  } catch (error: any) {
    console.error(`Failed to update status for ${type}:`, error);
    return { success: false, error: error?.message || "Failed to update status" };
  }
}

// ─────────────────────────────────────────────
// Re-render PDF with fresh HTML template
// ─────────────────────────────────────────────

export async function regenerateAgreementPdf(id: string) {
  try {
    const agreement = await prisma.agreement.findUnique({
      where: { id },
      include: { client: true, project: true },
    });
    if (!agreement) return { success: false, error: "Agreement not found" };

    const content = (agreement.content as any) || {};
    const templateType = content.templateType || (
      agreement.title.includes("Completion") || agreement.title.includes("PCC") ? "COMPLETION" :
      agreement.title.includes("Statement") || agreement.title.includes("SOW") ? "SOW" : "MASTER"
    );

    const templateProps: AgreementTemplateProps = {
      agreementNumber: agreement.number,
      title: agreement.title,
      templateType: templateType,
      effectiveDate: agreement.effectiveDate ? agreement.effectiveDate.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      expiresAt: agreement.expiresAt ? agreement.expiresAt.toISOString().split("T")[0] : undefined,
      status: agreement.status,
      clientName: agreement.client.name,
      clientContactName: agreement.client.contactName || undefined,
      clientEmail: agreement.client.email || undefined,
      clientPhone: agreement.client.phone || undefined,
      clientAddress: [agreement.client.address, agreement.client.city, agreement.client.state].filter(Boolean).join(", ") || undefined,
      projectName: agreement.project?.name,
      projectOverview: content.projectOverview,
      deliverables: content.deliverables,
      outOfScopeItems: content.outOfScopeItems,
      techStack: content.techStack,
      milestones: content.milestones,
      totalFee: content.totalFee,
      advanceAmount: content.advanceAmount,
      clauses: content.clauses,
    };

    const html = renderAgreementHtml(templateProps);
    const docTypeLabel = templateType === 'COMPLETION' ? 'Handover Certificate' : templateType === 'SOW' ? 'Statement of Work' : 'Master Agreement';

    const { storageKey } = await generateAndSaveDocument({
      html,
      storagePrefix: 'agreements',
      fileBaseName: `agreement-${agreement.number.toLowerCase()}-${Date.now()}`,
      documentType: 'AGREEMENT',
      documentName: `${docTypeLabel} ${agreement.number} — ${agreement.client.name}`,
      clientId: agreement.clientId,
      projectId: agreement.projectId || undefined,
    });

    await prisma.agreement.update({
      where: { id },
      data: { pdfKey: storageKey },
    });

    revalidatePath("/generators");
    return { success: true, pdfKey: storageKey };
  } catch (err: any) {
    console.error("Failed to regenerate agreement PDF:", err);
    return { success: false, error: err?.message || "Failed to regenerate PDF" };
  }
}

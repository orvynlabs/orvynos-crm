/**
 * AgreementTemplate — Server-rendered HTML template for Agreement PDFs.
 * Supports both Master Services Agreements (MSA) and Statements of Work (SOW).
 */

import { renderMsaHtml, type MsaTemplateProps } from './MsaTemplate';
import { renderSowHtml, type SowTemplateProps } from './SowTemplate';
import { renderCompletionHtml, type CompletionTemplateProps } from './CompletionTemplate';

export interface AgreementClause {
  title: string;
  content: string;
}

export interface AgreementTemplateProps {
  agreementNumber: string;
  title: string;
  templateType?: string; // 'MASTER' | 'SOW' | 'COMPLETION'
  effectiveDate: string;
  expiresAt?: string;
  status: string;
  // Client / Lead
  clientName: string;
  clientCompanyName?: string;
  clientContactName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientGstin?: string;
  clientAddress?: string;
  // Project
  projectName?: string;
  projectId?: string;
  serviceCategory?: string;
  // SOW & Completion specific optional details
  projectOverview?: string;
  deliverables?: { deliverable: string; description: string; status?: string }[];
  outOfScopeItems?: string[];
  techStack?: string[];
  milestones?: { milestone: string; workDescription: string; dueDate: string; paymentAmount: number }[];
  totalFee?: number;
  advanceAmount?: number;
  // Content
  clauses?: AgreementClause[];
}

export const MASTER_AGREEMENT_TEMPLATE = {
  label: 'Master Services Agreement (MSA)',
  description: 'All-in-one legal agreement covering Scope of Work, Payment Terms, IP Transfer, Confidentiality (NDA), and Legal Protections.',
};

export const SOW_AGREEMENT_TEMPLATE = {
  label: 'Statement of Work (SOW)',
  description: 'Detailed project scope statement defining Deliverables, Out-of-Scope items, Tech Stack, Milestones, and Payments.',
};

export const COMPLETION_AGREEMENT_TEMPLATE = {
  label: 'Project Completion Certificate (PCC)',
  description: 'Official Handover Certificate certifying completed deliverables, asset transfers, and warranty support terms.',
};

export const AGREEMENT_TEMPLATES: Record<string, { label: string; description: string }> = {
  MASTER: MASTER_AGREEMENT_TEMPLATE,
  SOW: SOW_AGREEMENT_TEMPLATE,
  COMPLETION: COMPLETION_AGREEMENT_TEMPLATE,
};

export function substituteVariables(text: string, vars: Record<string, string>): string {
  let result = text;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

export function renderAgreementHtml(props: AgreementTemplateProps): string {
  if (props.templateType === 'COMPLETION' || (props.title && (props.title.toUpperCase().includes('COMPLETION') || props.title.toUpperCase().includes('HANDOVER')))) {
    const compProps: CompletionTemplateProps = {
      certificateNumber: props.agreementNumber.replace('AGR', 'PCC'),
      issueDate: props.effectiveDate,
      handoverDate: props.effectiveDate,
      status: props.status || 'SIGNED',
      clientName: props.clientName,
      clientCompanyName: props.clientCompanyName || props.clientName,
      clientContactName: props.clientContactName,
      clientEmail: props.clientEmail,
      clientPhone: props.clientPhone,
      clientGstin: props.clientGstin,
      clientAddress: props.clientAddress,
      projectName: props.projectName || 'Enterprise Application Engineering & Cloud Services',
      projectId: props.projectId || 'PRJ-2026-001',
      contractValue: props.totalFee || 150000,
      projectSummary: props.projectOverview,
      deliverables: props.deliverables,
    };
    return renderCompletionHtml(compProps);
  }

  const isSow = props.templateType === 'SOW' || (props.title && (props.title.toUpperCase().includes('SOW') || props.title.toUpperCase().includes('STATEMENT OF WORK')));

  if (isSow) {
    const sowProps: SowTemplateProps = {
      sowNumber: props.agreementNumber,
      sowDate: props.effectiveDate,
      linkedMsaNumber: "MSA-2026-0001",
      status: props.status || 'DRAFT',
      clientName: props.clientName,
      clientCompanyName: props.clientCompanyName || props.clientName,
      clientContactName: props.clientContactName,
      clientEmail: props.clientEmail,
      clientPhone: props.clientPhone,
      clientGstin: props.clientGstin,
      clientAddress: props.clientAddress,
      projectName: props.projectName || 'Enterprise Application Engineering & Cloud Services',
      projectId: props.projectId || 'PRJ-2026-001',
      projectOverview: props.projectOverview || 'Engineering high-performance enterprise web application architecture, cloud deployment pipelines, and digital workflows.',
      deliverables: props.deliverables && props.deliverables.length > 0 ? props.deliverables : [
        { deliverable: "Cloud & Database Architecture", description: "Next.js 14 App Router setup, Neon PostgreSQL schema design, Prisma ORM integration, and Backblaze B2 storage pipeline." },
        { deliverable: "Document Generator Engine", description: "Playwright Chromium HTML-to-PDF rendering engine for single-page print Invoices, Proposals, and Multi-page Agreements." },
        { deliverable: "CRM Analytics Dashboard", description: "Real-time client management, lead pipeline tracking, milestone billing, and enterprise digital payment suite." },
      ],
      outOfScopeItems: props.outOfScopeItems && props.outOfScopeItems.length > 0 ? props.outOfScopeItems : [
        "Third-party paid API subscription costs (Client provides API keys)",
        "Unbudgeted custom mobile app native development for iOS App Store",
      ],
      techStack: props.techStack && props.techStack.length > 0 ? props.techStack : [
        "Next.js 14 App Router", "TypeScript", "TailwindCSS", "Prisma ORM", "Neon PostgreSQL", "Backblaze B2", "Playwright PDF",
      ],
      milestones: props.milestones && props.milestones.length > 0 ? props.milestones : [
        { milestone: "Milestone 1", workDescription: "Architecture, DB Schema & Authentication Engine", dueDate: "30 July 2026", paymentAmount: 75000 },
        { milestone: "Milestone 2", workDescription: "Document Generators & Analytics Handover", dueDate: "15 August 2026", paymentAmount: 75000 },
      ],
      totalFee: props.totalFee || 150000,
      advanceAmount: props.advanceAmount || 30000,
    };

    return renderSowHtml(sowProps);
  }

  const msaProps: MsaTemplateProps = {
    agreementNumber: props.agreementNumber,
    title: props.title || 'MASTER SERVICES AGREEMENT',
    effectiveDate: props.effectiveDate,
    expiresAt: props.expiresAt || 'Until Terminated',
    status: props.status || 'DRAFT',
    clientName: props.clientName,
    clientCompanyName: props.clientCompanyName || props.clientName,
    clientContactName: props.clientContactName,
    clientEmail: props.clientEmail,
    clientPhone: props.clientPhone,
    clientGstin: props.clientGstin,
    clientAddress: props.clientAddress,
    projectName: props.projectName || 'Enterprise Software Engineering & Cloud Services',
    projectId: props.projectId || 'PRJ-2026-001',
    serviceCategory: props.serviceCategory || 'Software Engineering & IT Services',
  };

  return renderMsaHtml(msaProps);
}

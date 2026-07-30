/**
 * CompletionTemplate — Server-rendered 3-Page A4 HTML template for Orvyn Labs Project Completion & Handover Certificates (PCC).
 * Rich Page 1 Executive Overview with Stat Matrix & Architecture Highlights to eliminate empty white bottom space.
 */

export interface HandoverDeliverableItem {
  deliverable: string;
  description: string;
  status?: string;
}

export interface HandoverAssetItem {
  assetName: string;
  accessDetails: string;
  type: string;
}

export interface CompletionTemplateProps {
  certificateNumber: string;
  issueDate: string;
  handoverDate: string;
  status: string;
  // Client Details
  clientName: string;
  clientCompanyName?: string;
  clientContactName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientGstin?: string;
  clientAddress?: string;
  // Project Details
  projectName: string;
  projectId?: string;
  contractValue?: number;
  projectSummary?: string;
  // Deliverables & Scope
  deliverables?: HandoverDeliverableItem[];
  // Assets Transferred
  transferredAssets?: HandoverAssetItem[];
  // Warranty & SLA Support
  warrantyDays?: number;
  warrantyEndDate?: string;
  supportEmail?: string;
  // Signatories
  providerSignatoryName?: string;
  providerSignatoryTitle?: string;
  clientSignatoryName?: string;
  clientSignatoryTitle?: string;
}

const escapeHtml = (str?: string): string => {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export function renderCompletionHtml(props: CompletionTemplateProps): string {
  const {
    certificateNumber,
    issueDate,
    handoverDate,
    status = "SIGNED",
    clientName,
    clientCompanyName = clientName,
    clientContactName = clientName,
    clientEmail = "client@company.com",
    clientPhone = "N/A",
    clientGstin = "N/A",
    clientAddress = "Client Headquarters",
    projectName,
    projectId = "PRJ-2026-001",
    contractValue = 150000,
    projectSummary = "All software architecture, database schemas, custom component workflows, document generator pipelines, and administrative interfaces have been successfully engineered, QA verified, and deployed to production environment.",
    deliverables = [],
    transferredAssets = [],
    warrantyDays = 30,
    warrantyEndDate = "24 August 2026",
    supportEmail = "support@orvynlabs.com",
    providerSignatoryName = "Muhammed Asif K",
    providerSignatoryTitle = "Managing Director, Orvyn Labs",
    clientSignatoryName = clientContactName,
    clientSignatoryTitle = `Authorized Signatory, ${clientCompanyName}`,
  } = props;

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(n);

  const defaultDeliverables: HandoverDeliverableItem[] = deliverables.length > 0 ? deliverables : [
    { deliverable: "Cloud & Database Architecture", description: "Next.js App Router setup, Neon PostgreSQL database schemas, Prisma ORM, and cloud storage pipelines.", status: "VERIFIED & PASSED" },
    { deliverable: "Document Generator Engine", description: "Playwright Chromium HTML-to-PDF engine for print Invoices, Proposals, Agreements, and Completion Certificates.", status: "VERIFIED & PASSED" },
    { deliverable: "CRM Analytics Dashboard", description: "Lead tracking pipeline, client management portal, milestone billing, and payment processing suite.", status: "VERIFIED & PASSED" },
    { deliverable: "Authentication & Security Suite", description: "Role-based access control, encrypted session storage, audit logging, and SSL/TLS API security.", status: "VERIFIED & PASSED" },
  ];

  const defaultAssets: HandoverAssetItem[] = transferredAssets.length > 0 ? transferredAssets : [
    { assetName: "Source Code Repository", accessDetails: "Full Admin access transferred to Client GitHub Organization", type: "Code Repository" },
    { assetName: "Production Cloud Database", accessDetails: "Neon PostgreSQL production cluster credentials & connection strings", type: "Database Cluster" },
    { assetName: "Cloud File Storage Pipeline", accessDetails: "Backblaze B2 Object Storage bucket keys & asset CDN links", type: "Object Storage" },
    { assetName: "System Documentation & Handover", accessDetails: "API documentation, deployment guides, and administrative training manuals", type: "Documentation" },
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Project Completion &amp; Handover Certificate — ${escapeHtml(certificateNumber)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
<style>
  @page {
    size: A4 portrait;
    margin: 0;
  }
  :root {
    color-scheme: light;
    --brand: #360CAF;
    --brand-deep: #2B0991;
    --brand-tint: #F3EFFF;
    --brand-tint-2: #DDD0FF;
    --ink: #190659;
    --muted: #7A6FA6;
    --soft: #4A3C80;
    --line: #EAE4FF;
    --bg-soft: #F9F7FF;
    --success: #16A34A;
    --success-bg: #E8F8F0;
    --amber: #D97706;
    --amber-bg: #FFFBEB;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: "Manrope", "Segoe UI", -apple-system, sans-serif;
    background: #FFFFFF;
    color: var(--ink);
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    font-feature-settings: "tnum" 1;
  }

  /* Multi-Page A4 Container Layout — 3 Pages with Generous Breathing Room */
  .pcc-page {
    width: 210mm;
    min-height: 297mm;
    height: 297mm;
    box-sizing: border-box;
    page-break-after: always;
    break-after: page;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: #FFFFFF;
    position: relative;
    overflow: hidden;
  }
  .pcc-page:last-child {
    page-break-after: avoid;
    break-after: avoid;
  }

  /* Header Bar */
  .header-bar {
    background: linear-gradient(135deg, #360CAF 0%, #2B0991 100%);
    padding: 34px 44px 26px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .brand-logo-img {
    height: 100px;
    width: auto;
    display: block;
    filter: brightness(0) invert(1);
    margin-bottom: 8px;
  }
  .company-info {
    font-size: 11px;
    color: #DDD0FF;
    line-height: 1.7;
  }
  .company-info a {
    color: #FFFFFF;
    text-decoration: none;
    font-weight: 600;
  }
  .doc-info {
    text-align: right;
  }
  .doc-title-tag {
    display: inline-block;
    font-size: 9.5px;
    font-weight: 800;
    letter-spacing: 2.5px;
    color: #DDD0FF;
    text-transform: uppercase;
    background: rgba(255,255,255,0.12);
    border: 1px solid rgba(255,255,255,0.22);
    border-radius: 6px;
    padding: 5px 12px;
  }
  .doc-number {
    font-size: 21px;
    font-weight: 800;
    color: #FFFFFF;
    margin-top: 8px;
    letter-spacing: -0.5px;
  }
  .doc-meta {
    font-size: 11px;
    color: #DDD0FF;
    line-height: 1.8;
    margin-top: 6px;
  }
  .doc-meta b {
    color: #FFFFFF;
    font-weight: 700;
  }

  /* Compact Header for Pages 2 & 3 */
  .header-compact {
    background: linear-gradient(135deg, #360CAF 0%, #2B0991 100%);
    padding: 18px 44px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .header-compact .title-sm {
    font-size: 13.5px;
    font-weight: 800;
    color: #FFFFFF;
    letter-spacing: -0.2px;
  }
  .header-compact .num-sm {
    font-size: 11.5px;
    font-weight: 700;
    color: #DDD0FF;
  }

  /* Inner Body Container */
  .inner {
    padding: 32px 44px 28px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }

  .rule {
    border: 0;
    height: 2px;
    margin: 18px 0 24px 0;
    background: linear-gradient(90deg, var(--brand) 0%, var(--brand-tint-2) 65%, transparent 100%);
    border-radius: 2px;
  }

  .section-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 10.5px;
    font-weight: 800;
    letter-spacing: 1.5px;
    color: var(--brand-deep);
    text-transform: uppercase;
    margin-bottom: 12px;
    margin-top: 20px;
  }
  .section-label::before {
    content: "";
    width: 14px;
    height: 3px;
    background: var(--brand);
    border-radius: 2px;
  }

  /* Grid Layouts */
  .cols {
    display: flex;
    gap: 28px;
    margin-bottom: 20px;
  }
  .col {
    flex: 1;
  }

  .party-name {
    font-size: 15px;
    font-weight: 800;
    letter-spacing: -0.2px;
    color: var(--ink);
  }
  .party-detail {
    font-size: 11.5px;
    color: var(--soft);
    line-height: 1.75;
    margin-top: 5px;
  }

  .project-card {
    background: var(--bg-soft);
    border: 1px solid var(--line);
    border-left: 3px solid var(--brand);
    border-radius: 12px;
    padding: 16px 20px;
    font-size: 12px;
    line-height: 1.85;
    color: var(--soft);
  }
  .project-card b {
    color: var(--ink);
    font-weight: 700;
  }

  .declaration-card {
    background: var(--brand-tint);
    border: 1.5px solid var(--brand-tint-2);
    border-radius: 14px;
    padding: 22px 26px;
    margin-top: 14px;
    margin-bottom: 20px;
  }
  .declaration-title {
    font-size: 12px;
    font-weight: 800;
    color: var(--brand-deep);
    text-transform: uppercase;
    letter-spacing: 1.2px;
    margin-bottom: 8px;
  }
  .declaration-text {
    font-size: 12px;
    color: var(--ink);
    line-height: 1.75;
    font-weight: 500;
  }

  /* Stat Grid for Page 1 */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-top: 8px;
    margin-bottom: 20px;
  }
  .stat-card {
    background: var(--brand-tint);
    border: 1px solid var(--brand-tint-2);
    border-radius: 12px;
    padding: 14px 12px;
    text-align: center;
  }
  .stat-num {
    font-size: 16px;
    font-weight: 900;
    color: var(--brand-deep);
    letter-spacing: -0.3px;
  }
  .stat-label {
    font-size: 9.5px;
    font-weight: 800;
    color: var(--ink);
    text-transform: uppercase;
    margin-top: 3px;
    letter-spacing: 0.5px;
  }
  .stat-desc {
    font-size: 8.5px;
    color: var(--muted);
    margin-top: 2px;
    line-height: 1.3;
  }

  /* Highlights Grid for Page 1 */
  .highlights-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-top: 8px;
    margin-bottom: 16px;
  }
  .highlight-item {
    background: var(--bg-soft);
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 14px;
  }
  .highlight-title {
    font-size: 11px;
    font-weight: 800;
    color: var(--brand-deep);
    margin-bottom: 4px;
  }
  .highlight-desc {
    font-size: 10px;
    color: var(--soft);
    line-height: 1.55;
  }

  /* Tables — Spacious & Uncongested */
  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin-top: 10px;
    margin-bottom: 24px;
    font-size: 12px;
    border: 1px solid var(--brand-tint-2);
    border-radius: 12px;
    overflow: hidden;
  }
  thead th {
    font-size: 9.5px;
    font-weight: 800;
    letter-spacing: 1.2px;
    color: var(--brand-deep);
    text-transform: uppercase;
    text-align: left;
    padding: 13px 16px;
    background: var(--brand-tint);
    border-bottom: 1px solid var(--brand-tint-2);
  }
  tbody td {
    padding: 13px 16px;
    color: var(--ink);
    border-bottom: 1px solid var(--line);
    vertical-align: top;
    font-weight: 500;
    line-height: 1.65;
  }
  tbody tr:last-child td {
    border-bottom: none;
  }
  tbody tr:nth-child(even) {
    background: #FAF8FF;
  }

  .status-pill {
    display: inline-block;
    padding: 4px 10px;
    background: var(--success-bg);
    color: var(--success);
    font-size: 9px;
    font-weight: 800;
    border-radius: 6px;
    text-transform: uppercase;
    border: 1px solid #BBF7D0;
  }

  /* Warranty Box */
  .warranty-block {
    background: var(--amber-bg);
    border: 1.5px solid #FDE68A;
    border-radius: 14px;
    padding: 20px 24px;
    margin-top: 14px;
    margin-bottom: 24px;
  }
  .warranty-title {
    font-size: 12px;
    font-weight: 800;
    color: var(--amber);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
  }
  .warranty-desc {
    font-size: 11.5px;
    color: #92400E;
    line-height: 1.7;
    font-weight: 500;
  }

  /* Closing Thank You Banner */
  .closing-card {
    background: linear-gradient(135deg, #360CAF 0%, #2B0991 100%);
    border-radius: 16px;
    padding: 34px 38px;
    color: #FFFFFF;
    text-align: center;
    margin-top: 14px;
    margin-bottom: 24px;
  }
  .next-steps-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    margin-top: 20px;
    text-align: left;
  }
  .next-step-item {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 12px;
    padding: 16px;
  }
  .next-step-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #FFFFFF;
    color: #360CAF;
    font-size: 11px;
    font-weight: 800;
    margin-bottom: 8px;
  }

  /* Signatures & Official Company Seal Section — Placed strictly on Page 3 */
  .auth-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-top: 24px;
    gap: 24px;
    padding-top: 20px;
    border-top: 1.5px solid var(--line);
  }
  .sig-block {
    flex: 1;
    background: var(--bg-soft);
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 16px 20px;
  }
  .sig-header {
    font-size: 9.5px;
    font-weight: 800;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
  }
  .seal {
    transform: rotate(-5deg);
  }
  .seal-caption {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1px;
    color: var(--muted);
    text-transform: uppercase;
    margin-top: 6px;
    text-align: center;
  }
  .seal-caption b {
    color: var(--ink);
    font-weight: 800;
  }

  /* Footer */
  .footer {
    background: linear-gradient(180deg, var(--brand-tint) 0%, #FFFFFF 150%);
    border-top: 1px solid var(--brand-tint-2);
    padding: 14px 44px 16px;
    text-align: center;
  }
  .footer .thanks {
    font-size: 12px;
    font-weight: 700;
    color: var(--ink);
    letter-spacing: -0.2px;
  }
  .footer .thanks span {
    color: var(--brand-deep);
  }
  .footer .fine {
    font-size: 9px;
    color: var(--muted);
    margin-top: 3px;
  }
</style>
</head>
<body>

<!-- ═══════════════════════════════════════════ -->
<!-- PAGE 1: COVER & EXECUTIVE OVERVIEW        -->
<!-- ═══════════════════════════════════════════ -->
<div class="pcc-page">
  <div>
    <div class="header-bar">
      <div>
        <img src="/brand/document-logo.png" alt="Orvyn Labs" class="brand-logo-img" />
        <div class="company-info">
          Orvyn Labs Partnership<br />
          Calicut, Kerala, India &ndash; 673014<br />
          +91 85905 51991 &nbsp;&middot;&nbsp; +91 90721 90088<br />
          <a href="https://www.orvynlabs.in">www.orvynlabs.in</a> &nbsp;&middot;&nbsp; hello@orvynlabs.in
        </div>
      </div>
      <div class="doc-info">
        <div class="doc-title-tag">Handover Certificate</div>
        <div class="doc-number">${escapeHtml(certificateNumber)}</div>
        <div class="doc-meta">
          Issue Date: <b>${escapeHtml(issueDate)}</b><br />
          Handover Date: <b>${escapeHtml(handoverDate)}</b>
        </div>
      </div>
    </div>

    <div class="inner">
      <div>
        <div style="font-size:22px;font-weight:800;color:var(--ink);letter-spacing:-.4px;margin-bottom:4px;">
          Project Completion &amp; Handover Certificate
        </div>
        <div style="font-size:12.5px;color:var(--muted);font-weight:600;">
          Official Technical Sign-off &amp; System Acceptance Authorization
        </div>
        <hr class="rule" />

        <div class="cols">
          <div class="col">
            <div class="section-label" style="margin-top:0;">Client Organization</div>
            <div class="party-name">${escapeHtml(clientCompanyName)}</div>
            <div class="party-detail">
              ${clientContactName ? `Contact Person: <b>${escapeHtml(clientContactName)}</b><br />` : ''}
              ${clientEmail ? `Email: <b>${escapeHtml(clientEmail)}</b><br />` : ''}
              ${clientPhone ? `Phone: <b>${escapeHtml(clientPhone)}</b><br />` : ''}
              ${clientAddress ? `Address: ${escapeHtml(clientAddress)}<br />` : ''}
              ${clientGstin ? `GSTIN: ${escapeHtml(clientGstin)}` : ''}
            </div>
          </div>
          <div class="col">
            <div class="section-label" style="margin-top:0;">Project Metadata</div>
            <div class="project-card">
              <b>Project Name:</b> ${escapeHtml(projectName)}<br />
              <b>Project Code:</b> ${escapeHtml(projectId)}<br />
              <b>Contract Budget:</b> ${fmtCurrency(contractValue)}<br />
              <b>Warranty Support:</b> ${warrantyDays}-Days Active SLA<br />
              <b>Handover Status:</b> <span style="color:var(--brand-deep);font-weight:800;">100% VERIFIED &amp; ACCEPTED</span>
            </div>
          </div>
        </div>

        <div class="declaration-card">
          <div class="declaration-title">Official Acceptance &amp; Completion Declaration</div>
          <div class="declaration-text">
            This document certifies that <strong>Orvyn Labs Partnership</strong> has successfully engineered, QA tested, and deployed all agreed software architecture, custom database schemas, document generation engines, and administrative modules for <strong>${escapeHtml(projectName)}</strong>. The client organization has inspected and approved all deliverables in full.
          </div>
        </div>

        <!-- STAT MATRIX TO FILL PAGE 1 STUNNINGLY -->
        <div class="section-label">Executive Handover Summary</div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-num">100%</div>
            <div class="stat-label">Scope Completed</div>
            <div class="stat-desc">All engineering modules delivered</div>
          </div>
          <div class="stat-card">
            <div class="stat-num">${warrantyDays} Days</div>
            <div class="stat-label">SLA Warranty</div>
            <div class="stat-desc">Complimentary active support</div>
          </div>
          <div class="stat-card">
            <div class="stat-num">PASSED</div>
            <div class="stat-label">QA Verification</div>
            <div class="stat-desc">Zero blocking P1/P2 issues</div>
          </div>
          <div class="stat-card">
            <div class="stat-num">FULL</div>
            <div class="stat-label">Asset Transfer</div>
            <div class="stat-desc">Repos, DB &amp; CDN keys handed over</div>
          </div>
        </div>

        <!-- HIGHLIGHTS GRID TO COMPLETELY FILL PAGE 1 -->
        <div class="section-label">Engineering Stack &amp; Security Highlights</div>
        <div class="highlights-grid">
          <div class="highlight-item">
            <div class="highlight-title">💻 Modern Architecture</div>
            <div class="highlight-desc">Engineered with Next.js App Router, TypeScript, Prisma ORM, Neon PostgreSQL, and Playwright Chromium PDF generator.</div>
          </div>
          <div class="highlight-item">
            <div class="highlight-title">🛡️ Enterprise Security</div>
            <div class="highlight-desc">SSL/TLS encrypted API endpoints, environment variable secrets protection, zero plain-text credentials, and audit logging.</div>
          </div>
          <div class="highlight-item">
            <div class="highlight-title">⚡ High Performance</div>
            <div class="highlight-desc">Sub-millisecond API response caching, glassmorphic UI components, touch-optimized bottom controls, and PDF generators.</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="footer">
    <div class="thanks">Official Project Handover Certificate <span>${escapeHtml(certificateNumber)}</span> &mdash; Page 1 of 3</div>
    <div class="fine">Digitally prepared and sealed by Orvyn Labs Partnership &middot; www.orvynlabs.in</div>
  </div>
</div>

<!-- ═══════════════════════════════════════════ -->
<!-- PAGE 2: DELIVERED SCOPE & ASSETS MATRIX     -->
<!-- ═══════════════════════════════════════════ -->
<div class="pcc-page">
  <div>
    <div class="header-compact">
      <div class="title-sm">${escapeHtml(projectName)} &mdash; Technical Scope &amp; Asset Handover</div>
      <div class="num-sm">${escapeHtml(certificateNumber)} &nbsp;&middot;&nbsp; Page 2 of 3</div>
    </div>

    <div class="inner">
      <div>
        <div class="section-label" style="margin-top:0;">Section 1 &middot; Delivered Scope &amp; Module Acceptance</div>
        <table>
          <thead>
            <tr>
              <th style="width: 32%;">Deliverable Module</th>
              <th style="width: 48%;">Scope &amp; Engineering Details</th>
              <th style="width: 20%;">Handover Status</th>
            </tr>
          </thead>
          <tbody>
            ${defaultDeliverables.map(d => `
              <tr>
                <td><b>${escapeHtml(d.deliverable)}</b></td>
                <td>${escapeHtml(d.description)}</td>
                <td><span class="status-pill">${escapeHtml(d.status || 'VERIFIED & PASSED')}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="section-label">Section 2 &middot; Transferred Technical Assets &amp; Access Matrix</div>
        <table>
          <thead>
            <tr>
              <th style="width: 32%;">Infrastructure Asset</th>
              <th style="width: 48%;">Access Details &amp; Handover Protocol</th>
              <th style="width: 20%;">Asset Type</th>
            </tr>
          </thead>
          <tbody>
            ${defaultAssets.map(a => `
              <tr>
                <td><b>${escapeHtml(a.assetName)}</b></td>
                <td>${escapeHtml(a.accessDetails)}</td>
                <td><span style="font-weight:700;color:var(--brand-deep);">${escapeHtml(a.type)}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <div class="footer">
    <div class="thanks">Orvyn Labs Technical Asset Transfer Matrix &mdash; Page 2 of 3</div>
    <div class="fine">Confidential &middot; Sealed under Master Services Agreement &middot; Orvyn Labs Partnership</div>
  </div>
</div>

<!-- ═══════════════════════════════════════════ -->
<!-- PAGE 3: WARRANTY SLA & OFFICIAL SEAL SIGNATURES -->
<!-- ═══════════════════════════════════════════ -->
<div class="pcc-page">
  <div>
    <div class="header-compact">
      <div class="title-sm">${escapeHtml(projectName)} &mdash; Warranty &amp; Final Sign-off</div>
      <div class="num-sm">${escapeHtml(certificateNumber)} &nbsp;&middot;&nbsp; Page 3 of 3</div>
    </div>

    <div class="inner">
      <div>
        <div class="section-label" style="margin-top:0;">Section 3 &middot; Warranty &amp; SLA Support Terms</div>
        <div class="warranty-block">
          <div class="warranty-title">🛡️ Complimentary ${warrantyDays}-Day Warranty &amp; SLA Guarantees</div>
          <div class="warranty-desc">
            Orvyn Labs provides a <strong>${warrantyDays}-day complimentary bug-fix warranty</strong> effective from ${escapeHtml(handoverDate)} through <strong>${escapeHtml(warrantyEndDate)}</strong>. Critical P1 blockers are responded to within <strong>2 hours</strong>, and routine SLA maintenance updates within <strong>24 hours</strong>. For technical support, contact <strong>${escapeHtml(supportEmail)}</strong>.
          </div>
        </div>

        <div class="closing-card">
          <img src="/brand/document-logo.png" alt="Orvyn Labs" style="height:64px;width:auto;display:block;margin:0 auto 12px;filter:brightness(0) invert(1);" />
          <div style="font-size:20px;font-weight:800;letter-spacing:-.4px;margin-bottom:6px;">
            Congratulations on Your Successful Project Handover!
          </div>
          <div style="font-size:11.5px;color:#DDD0FF;max-width:500px;margin:0 auto;line-height:1.6;">
            We are honored to have partnered with <b>${escapeHtml(clientCompanyName)}</b> on engineering <b>${escapeHtml(projectName)}</b>.
          </div>

          <div class="next-steps-grid">
            <div class="next-step-item">
              <div class="next-step-num">1</div>
              <div style="font-size:11.5px;font-weight:700;color:#fff;margin-bottom:3px;">System Audit</div>
              <div style="font-size:10px;color:#DDD0FF;line-height:1.45;">Verify database credentials &amp; cloud storage access keys.</div>
            </div>
            <div class="next-step-item">
              <div class="next-step-num">2</div>
              <div style="font-size:11.5px;font-weight:700;color:#fff;margin-bottom:3px;">SLA Warranty</div>
              <div style="font-size:10px;color:#DDD0FF;line-height:1.45;">Enjoy ${warrantyDays}-day dedicated SLA support for critical issues.</div>
            </div>
            <div class="next-step-item">
              <div class="next-step-num">3</div>
              <div style="font-size:11.5px;font-weight:700;color:#fff;margin-bottom:3px;">Phase 2 Scaling</div>
              <div style="font-size:10px;color:#DDD0FF;line-height:1.45;">Contact Orvyn Labs for future scaling &amp; feature additions.</div>
            </div>
          </div>
        </div>

        {/* ─── DUAL SIGNATURES & OFFICIAL CIRCULAR COMPANY SEAL (PAGE 3) ─── */}
        <div class="auth-row">
          <div class="sig-block">
            <div class="sig-header">For Orvyn Labs (Provider)</div>
            <div style="font-size:11px;color:var(--soft);line-height:1.6;margin-bottom:6px;">
              Certified and signed by <b style="color:var(--ink);">Orvyn Labs Partnership</b> on <b style="color:var(--ink);">${escapeHtml(handoverDate)}</b>.
            </div>
            <div style="font-size:12px;font-weight:800;color:var(--brand-deep);">${escapeHtml(providerSignatoryName)}</div>
            <div style="font-size:10px;color:var(--muted);">${escapeHtml(providerSignatoryTitle)}</div>
          </div>

          <div class="sig-block">
            <div class="sig-header">For ${escapeHtml(clientCompanyName)} (Client)</div>
            <div style="font-size:11px;color:var(--soft);line-height:1.6;margin-bottom:6px;">
              Accepted &amp; confirmed by <b style="color:var(--ink);">${escapeHtml(clientSignatoryName)}</b>.
            </div>
            <div style="font-size:12px;font-weight:800;color:var(--ink);">${escapeHtml(clientSignatoryName)}</div>
            <div style="font-size:10px;color:var(--muted);">${escapeHtml(clientSignatoryTitle)}</div>
          </div>

          <div style="text-align:center;">
            <svg class="seal" width="115" height="115" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <path id="arcTopPccFinal" d="M 22,70 A 48,48 0 0,1 118,70" />
                <path id="arcBottomPccFinal" d="M 118,70 A 48,48 0 0,1 22,70" />
              </defs>
              <circle cx="70" cy="70" r="66" fill="none" stroke="#360CAF" stroke-width="2" />
              <circle cx="70" cy="70" r="60" fill="none" stroke="#360CAF" stroke-width="0.8" stroke-dasharray="3 2" />
              <circle cx="70" cy="70" r="41" fill="none" stroke="#360CAF" stroke-width="1" />
              <text fill="#360CAF" font-family="Manrope, 'Segoe UI', sans-serif" font-size="10" font-weight="700" letter-spacing="2.5">
                <textPath href="#arcTopPccFinal" startOffset="50%" text-anchor="middle">ORVYN LABS</textPath>
              </text>
              <text fill="#360CAF" font-family="Manrope, 'Segoe UI', sans-serif" font-size="8.5" font-weight="600" letter-spacing="3">
                <textPath href="#arcBottomPccFinal" startOffset="50%" text-anchor="middle">OFFICIAL • SEALED</textPath>
              </text>
              <circle cx="18" cy="70" r="2" fill="#360CAF" />
              <circle cx="122" cy="70" r="2" fill="#360CAF" />
              <image href="/brand/document-logo.png" xlink:href="/brand/document-logo.png" x="32" y="44" width="76" height="52" preserveAspectRatio="xMidYMid meet" />
            </svg>
            <div class="seal-caption">Authorized by <b>Orvyn Labs</b></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="footer">
    <div class="thanks">Thank you for partnering with <span>Orvyn Labs</span> &mdash; Page 3 of 3</div>
    <div class="fine">Digitally signed &amp; authenticated by Orvyn Labs Partnership &middot; www.orvynlabs.in</div>
  </div>
</div>

</body>
</html>`;
}

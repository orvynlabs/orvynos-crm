/**
 * SowTemplate — Server-rendered HTML template for Orvyn Labs Statement of Work (SOW).
 * Dynamic Page Flow Architecture:
 * - Uses page-break-inside: avoid on article boxes, table rows, and sign-off sections.
 * - If Section 2 (Deliverables) or Section 5 (Milestones) grows dynamically with 5, 10, or 20+ items,
 *   Playwright Chromium automatically spills content cleanly onto the next page without text clipping or overlapping!
 */

export interface SowDeliverableItem {
  id?: string;
  deliverable: string;
  description: string;
}

export interface SowMilestoneItem {
  id?: string;
  milestone: string;
  workDescription: string;
  dueDate: string;
  paymentAmount: number;
}

export interface SowTemplateProps {
  sowNumber: string;
  sowDate: string;
  linkedMsaNumber?: string;
  status?: string;
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
  projectOverview: string;
  // Deliverables & Scope
  deliverables: SowDeliverableItem[];
  outOfScopeItems: string[];
  techStack: string[];
  // Milestones & Financials
  milestones: SowMilestoneItem[];
  totalFee: number;
  advanceAmount: number;
  paymentTermsDays?: number;
  // Revisions & Support
  revisionRounds?: number;
  supportPeriod?: string;
  // Client Obligations
  feedbackWindowDays?: number;
  clientPocName?: string;
  clientPocEmail?: string;
  // Signatories
  providerSignatoryName?: string;
  providerSignatoryTitle?: string;
  clientSignatoryName?: string;
  clientSignatoryTitle?: string;
}

export function renderSowHtml(props: SowTemplateProps): string {
  const {
    sowNumber,
    sowDate,
    linkedMsaNumber = "AGR-2026-0001",
    status = "DRAFT",
    clientName,
    clientCompanyName = clientName,
    clientContactName,
    clientEmail,
    clientPhone,
    clientGstin,
    clientAddress,
    projectName = "Enterprise Application Engineering & Cloud Services",
    projectId = "PRJ-2026-001",
    projectOverview,
    deliverables = [],
    outOfScopeItems = [],
    techStack = [],
    milestones = [],
    totalFee = 0,
    advanceAmount = 0,
    paymentTermsDays = 15,
    revisionRounds = 2,
    supportPeriod = "30 Days Free Bug-Fix Support",
    feedbackWindowDays = 3,
    clientPocName = clientContactName || clientName,
    clientPocEmail = clientEmail || "client@company.com",
    providerSignatoryName = "Authorized Partner",
    providerSignatoryTitle = "Managing Partner, Orvyn Labs Partnership",
    clientSignatoryName = clientContactName || clientName,
    clientSignatoryTitle = `Authorized Signatory, ${clientCompanyName}`,
  } = props;

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n);

  const statusLabel = (status || 'DRAFT').replace(/_/g, ' ');
  const statusColors: Record<string, { color: string; bg: string; border: string }> = {
    ACTIVE: { color: '#16A34A', bg: '#E8F8F0', border: '#BBF7D0' },
    SIGNED: { color: '#16A34A', bg: '#E8F8F0', border: '#BBF7D0' },
    SENT: { color: '#360CAF', bg: '#F3EFFF', border: '#DDD0FF' },
    DRAFT: { color: '#78716C', bg: '#F5F5F4', border: '#E7E5E4' },
    EXPIRED: { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  };
  const sc = statusColors[status] || statusColors.DRAFT;

  // Outline Icons SVG definitions
  const phoneIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`;
  const mailIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`;
  const globeIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10z"></path></svg>`;
  const mapPinIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;

  const deliverablesRows = deliverables.map((item, i) => `
    <tr class="${i % 2 === 1 ? 'row-alt' : ''}">
      <td style="width:8%;text-align:center;font-weight:700;color:var(--brand-deep);">${i + 1}</td>
      <td style="width:34%;font-weight:700;color:var(--ink);">${esc(item.deliverable)}</td>
      <td style="width:58%;color:var(--soft);line-height:1.65;">${esc(item.description)}</td>
    </tr>
  `).join('');

  const milestoneRows = milestones.map((m, i) => `
    <tr class="${i % 2 === 1 ? 'row-alt' : ''}">
      <td style="width:8%;text-align:center;font-weight:700;color:var(--brand-deep);">${i + 1}</td>
      <td style="width:44%;font-weight:700;color:var(--ink);">${esc(m.milestone)} &mdash; <span style="font-weight:500;color:var(--soft);">${esc(m.workDescription)}</span></td>
      <td style="width:23%;font-weight:600;color:var(--brand);">${esc(m.dueDate)}</td>
      <td style="width:25%;text-align:right;font-weight:800;color:var(--ink);">${fmt(m.paymentAmount)}</td>
    </tr>
  `).join('');

  const techBadges = techStack.map(t => `<span class="tech-badge">${esc(t)}</span>`).join(' ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="color-scheme" content="light" />
<title>Statement of Work ${sowNumber} — Orvyn Labs</title>
<style>
  @page {
    size: A4 portrait;
    margin: 0mm;
    background-color: #ffffff !important;
  }

  :root {
    --brand: #360CAF;
    --brand-deep: #210673;
    --brand-tint: #F3EFFF;
    --brand-tint-2: #E2D7FF;
    --ink: #190659;
    --soft: #4A3C80;
    --muted: #7A6FA6;
    --line: #EBE7FA;
    --bg-soft: #F9F8FE;
    --card-bg: #FFFFFF;
    --radius-lg: 12px;
    --radius-md: 9px;
    --radius-sm: 6px;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  html, body {
    width: 210mm;
    font-family: "Manrope", "Segoe UI", -apple-system, sans-serif;
    background-color: #ffffff !important;
    background: #ffffff !important;
    color: var(--ink);
    color-scheme: light !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    font-feature-settings: "tnum" 1;
  }

  /* Multi-Page Dynamic Flow Container */
  .sow-page {
    width: 210mm;
    min-height: 297mm;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background-color: #ffffff !important;
    background: #ffffff !important;
    position: relative;
    page-break-after: always;
    break-after: page;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .sow-page:last-child {
    page-break-after: avoid;
    break-after: avoid;
  }

  /* ════════════ HEADER BANNER ════════════ */
  .header-banner {
    background: linear-gradient(135deg, #360CAF 0%, #1E0875 100%);
    padding: 24px 40px 18px;
    color: #fff;
    border-bottom: 3px solid #4D18D3;
    flex-shrink: 0;
  }

  .header-top-grid {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header-brand-block img {
    height: 86px;
    max-height: 86px;
    width: auto;
    object-fit: contain;
    display: block;
    filter: brightness(0) invert(1);
  }

  .header-meta-block {
    text-align: right;
  }

  .header-title-badge {
    display: inline-block;
    font-size: 9.5px;
    font-weight: 800;
    letter-spacing: 2.5px;
    color: #DDD0FF;
    text-transform: uppercase;
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.22);
    border-radius: 6px;
    padding: 3px 12px;
  }

  .header-doc-num {
    font-size: 21px;
    font-weight: 800;
    color: #ffffff;
    margin-top: 3px;
    letter-spacing: -0.5px;
  }

  .header-dates-row {
    font-size: 9.5px;
    color: #DDD0FF;
    line-height: 1.5;
    margin-top: 3px;
    display: flex;
    gap: 14px;
    justify-content: flex-end;
  }

  .header-dates-row b { color: #fff; font-weight: 600; }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-top: 4px;
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.8px;
    color: ${sc.color};
    background: ${sc.bg};
    border: 1px solid ${sc.border};
    border-radius: 999px;
    padding: 2.5px 10px;
    text-transform: uppercase;
  }

  .company-info-strip {
    margin-top: 14px;
    padding-top: 10px;
    border-top: 1px solid rgba(255, 255, 255, 0.18);
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 9.5px;
    color: #DDD0FF;
  }

  .company-left-details {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .company-right-details {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .company-meta-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .company-meta-item svg { stroke: #DDD0FF; opacity: 0.9; }
  .company-meta-item a { color: #fff; text-decoration: none; font-weight: 600; }
  .company-meta-item b { color: #fff; font-weight: 700; }

  /* ════════════ MAIN BODY CONTENT ════════════ */
  .body-content {
    padding: 24px 40px 20px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background-color: #ffffff !important;
    background: #ffffff !important;
  }

  .page-number-indicator {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1.6px;
    color: var(--brand);
    text-transform: uppercase;
    margin-bottom: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1.5px solid var(--brand-tint-2);
    padding-bottom: 6px;
  }

  /* Cards Grid */
  .info-cards-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 22px;
    margin-bottom: 18px;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .card {
    background: var(--bg-soft);
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    padding: 18px 22px;
  }

  .card-header-label {
    font-size: 8.5px;
    font-weight: 800;
    letter-spacing: 1.4px;
    color: var(--brand);
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .party-title {
    font-size: 15px;
    font-weight: 800;
    color: var(--ink);
    letter-spacing: -0.3px;
  }

  .party-sub {
    font-size: 10.5px;
    color: var(--soft);
    line-height: 1.65;
    margin-top: 5px;
  }

  .party-sub b { color: var(--ink); font-weight: 700; }

  /* Article Cards with Page Break Avoidance */
  .article-box {
    background: #ffffff;
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    padding: 18px 24px;
    margin-bottom: 16px;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .article-title {
    font-size: 12.5px;
    font-weight: 800;
    color: var(--brand-deep);
    letter-spacing: -0.2px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .article-title span {
    color: var(--brand);
    font-size: 9.5px;
    font-weight: 800;
    background: var(--brand-tint);
    padding: 3px 9px;
    border-radius: 5px;
  }

  .article-body {
    font-size: 11.5px;
    color: var(--soft);
    line-height: 1.75;
  }

  .article-body p {
    margin-bottom: 8px;
  }

  .article-body p:last-child {
    margin-bottom: 0;
  }

  .article-body ul {
    list-style: none;
    padding-left: 10px;
    margin: 8px 0;
  }

  .article-body li {
    position: relative;
    padding-left: 14px;
    margin-bottom: 6px;
  }

  .article-body li::before {
    content: "•";
    position: absolute;
    left: 0;
    color: var(--brand);
    font-weight: bold;
    font-size: 13px;
  }

  /* Table with row-level page break protection */
  table.sow-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    overflow: hidden;
    background: #ffffff;
    margin-top: 10px;
    margin-bottom: 14px;
  }

  table.sow-table thead th {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1.2px;
    color: var(--brand-deep);
    text-transform: uppercase;
    text-align: left;
    padding: 11px 16px;
    background: var(--brand-tint);
    border-bottom: 1px solid var(--line);
  }

  table.sow-table tbody tr {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  table.sow-table tbody td {
    padding: 12px 16px;
    font-size: 11px;
    border-bottom: 1px solid var(--line);
    color: var(--soft);
    line-height: 1.65;
  }

  table.sow-table tbody tr.row-alt {
    background: var(--bg-soft);
  }

  table.sow-table tbody tr:last-child td {
    border-bottom: none;
  }

  .tech-badge {
    display: inline-block;
    background: var(--brand-tint);
    color: var(--brand);
    font-size: 10.5px;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 6px;
    border: 1px solid var(--brand-tint-2);
    margin-right: 8px;
    margin-bottom: 8px;
  }

  .financial-summary-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-top: 12px;
    margin-bottom: 16px;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .fin-box {
    background: var(--bg-soft);
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    padding: 14px 18px;
    text-align: center;
  }

  .fin-label {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1.2px;
    color: var(--brand);
    text-transform: uppercase;
    margin-bottom: 4px;
  }

  .fin-val {
    font-size: 17px;
    font-weight: 800;
    color: var(--ink);
  }

  /* Sign-Off Execution Table & Grid on Final Page */
  .sign-off-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    overflow: hidden;
    background: #ffffff;
    margin-top: 16px;
    margin-bottom: 20px;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .sign-off-table th {
    background: var(--brand-tint);
    color: var(--brand-deep);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 1.4px;
    text-transform: uppercase;
    padding: 14px 20px;
    border-bottom: 1px solid var(--line);
    text-align: left;
    width: 50%;
  }

  .sign-off-table td {
    padding: 16px 20px;
    font-size: 11.5px;
    color: var(--ink);
    border-bottom: 1px solid var(--line);
    vertical-align: top;
  }

  .sign-off-table tr:last-child td {
    border-bottom: none;
  }

  .sig-line-drawn {
    border-bottom: 2px solid var(--brand);
    margin-top: 50px;
    margin-bottom: 8px;
    width: 85%;
  }

  .seal-card-large {
    background: var(--bg-soft);
    border: 1.5px solid var(--brand-tint-2);
    border-radius: var(--radius-md);
    padding: 22px 28px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    margin-top: 16px;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .seal-svg { transform: rotate(-4deg); }

  .seal-caption-text {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1.5px;
    color: var(--brand-deep);
    text-transform: uppercase;
    margin-top: 6px;
  }

  /* Footer Two Col */
  .footer-two-col {
    display: grid;
    grid-template-columns: 1fr 1.2fr;
    gap: 32px;
    align-items: flex-start;
    padding-top: 16px;
    border-top: 1.5px solid var(--line);
    background-color: #ffffff !important;
    background: #ffffff !important;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .footer-col-title {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1.4px;
    color: var(--brand-deep);
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  .footer-col-text {
    font-size: 9px;
    color: var(--soft);
    line-height: 1.6;
  }

  .footer-contacts-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 16px;
    font-size: 9.5px;
    color: var(--soft);
  }

  .footer-contact-line {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .footer-contact-line svg { stroke: var(--brand); flex-shrink: 0; }
  .footer-contact-line a { color: var(--brand); text-decoration: none; font-weight: 600; }

  /* Bottom Bar */
  .bottom-bar {
    background: var(--brand-tint);
    border-top: 1px solid var(--brand-tint-2);
    padding: 7.5px 40px;
    text-align: center;
    font-size: 8px;
    color: var(--muted);
    line-height: 1.4;
    flex-shrink: 0;
  }

  .bottom-bar span {
    margin: 0 6px;
    color: var(--brand-tint-2);
  }
</style>
</head>
<body>

<!-- ════════════════════════════════════════════════════════════════
     PAGE 1: PREAMBLE, PARTY CARDS & SECTION 1 & 2 (OVERVIEW & DELIVERABLES)
     ════════════════════════════════════════════════════════════════ -->
<div class="sow-page">

  <!-- HEADER BANNER -->
  <div class="header-banner">
    <div class="header-top-grid">
      <div class="header-brand-block">
        <img src="/brand/document-logo.png" alt="Orvyn Labs" />
      </div>
      <div class="header-meta-block">
        <div class="header-title-badge">STATEMENT OF WORK</div>
        <div class="header-doc-num">${esc(sowNumber)}</div>
        <div class="header-dates-row">
          <span>SOW Date: <b>${esc(sowDate)}</b></span>
          <span>Linked MSA: <b>${esc(linkedMsaNumber)}</b></span>
        </div>
        <div style="margin-top:3px;">
          <span class="status-badge">${esc(statusLabel)}</span>
        </div>
      </div>
    </div>

    <!-- Company Details Strip -->
    <div class="company-info-strip">
      <div class="company-left-details">
        <div class="company-meta-item">${mapPinIcon} <b>Orvyn Labs Partnership</b> &middot; Calicut, Kerala, India &ndash; 673014</div>
      </div>
      <div class="company-right-details">
        <span class="company-meta-item">${phoneIcon} +91 85905 51991</span>
        <span class="company-meta-item">${mailIcon} <a href="mailto:hello@orvynlabs.in">hello@orvynlabs.in</a></span>
        <span class="company-meta-item">${globeIcon} <a href="https://www.orvynlabs.in">www.orvynlabs.in</a></span>
      </div>
    </div>
  </div>

  <!-- BODY CONTENT (PAGE 1) -->
  <div class="body-content">
    <div>
      <div class="page-number-indicator">
        <span>STATEMENT OF WORK (SOW) &mdash; PROJECT PREAMBLE &amp; DELIVERABLES</span>
        <span>PAGE 1 OF 3</span>
      </div>

      <!-- Party Identification Cards Grid -->
      <div class="info-cards-grid">
        <div class="card">
          <div class="card-header-label">Service Provider (Party A)</div>
          <div class="party-title">Orvyn Labs Partnership</div>
          <div class="party-sub">
            <b>Project Ref:</b> ${esc(projectName)} (ID: ${esc(projectId)})<br />
            <b>Linked MSA:</b> ${esc(linkedMsaNumber)}<br />
            <b>Email:</b> hello@orvynlabs.in &nbsp;&middot;&nbsp; <b>Phone:</b> +91 85905 51991
          </div>
        </div>

        <div class="card">
          <div class="card-header-label">Client (Party B)</div>
          <div class="party-title">${esc(clientCompanyName)}</div>
          <div class="party-sub">
            ${clientContactName ? `<b>Attn / Contact:</b> ${esc(clientContactName)}<br />` : ''}
            ${clientEmail ? `<b>Email:</b> ${esc(clientEmail)} &nbsp;&middot;&nbsp; ` : ''}
            ${clientPhone ? `<b>Phone:</b> ${esc(clientPhone)}<br />` : ''}
            ${clientAddress ? `<b>Address:</b> ${esc(clientAddress)}` : ''}
          </div>
        </div>
      </div>

      <!-- Section 1: What We Are Building -->
      <div class="article-box">
        <div class="article-title"><span>SECTION 1</span> What We Are Building (Project Overview)</div>
        <div class="article-body">
          <p>This Statement of Work ("<b>SOW</b>"), SOW No: <b>${esc(sowNumber)}</b>, governs the specific engineering deliverables and milestone timeline for project <b>${esc(projectName)}</b>. This SOW operates under the Master Services Agreement (MSA No: <b>${esc(linkedMsaNumber)}</b>) signed between Orvyn Labs Partnership and <b>${esc(clientCompanyName)}</b>. If any clause conflicts, MSA rules apply.</p>
          <p style="margin-top:6px;"><b>Project Description:</b> ${esc(projectOverview)}</p>
        </div>
      </div>

      <!-- Section 2: What's Included (Deliverables Table) -->
      <div class="article-box">
        <div class="article-title"><span>SECTION 2</span> What's Included (Project Deliverables Table)</div>
        <table class="sow-table">
          <thead>
            <tr>
              <th style="text-align:center;">#</th>
              <th>Deliverable Name</th>
              <th>Scope &amp; Technical Specifications</th>
            </tr>
          </thead>
          <tbody>
            ${deliverablesRows}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer-two-col">
      <div>
        <div class="footer-col-title">Statement of Work</div>
        <div class="footer-col-text">
          Project SOW for <b>${esc(projectName)}</b> under MSA <b>${esc(linkedMsaNumber)}</b>. Page 1 of 3.
        </div>
      </div>
      <div>
        <div class="footer-col-title">Connect With Orvyn Labs</div>
        <div class="footer-contacts-grid">
          <div class="footer-contact-line">${globeIcon} <a href="https://www.orvynlabs.in">www.orvynlabs.in</a></div>
          <div class="footer-contact-line">${mailIcon} <a href="mailto:hello@orvynlabs.in">hello@orvynlabs.in</a></div>
          <div class="footer-contact-line">${phoneIcon} +91 85905 51991</div>
          <div class="footer-contact-line">${mapPinIcon} Calicut, Kerala, India &ndash; 673014</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Bottom Bar -->
  <div class="bottom-bar">
    &copy; 2026 Orvyn Labs. All Rights Reserved. <span>•</span> Statement of Work <span>•</span> Confidential Document <span>•</span> Page 1 of 3
  </div>

</div>

<!-- ════════════════════════════════════════════════════════════════
     PAGE 2: OUT OF SCOPE, TECH STACK, MILESTONES & FINANCIALS
     ════════════════════════════════════════════════════════════════ -->
<div class="sow-page">

  <!-- HEADER BANNER -->
  <div class="header-banner">
    <div class="header-top-grid">
      <div class="header-brand-block">
        <img src="/brand/document-logo.png" alt="Orvyn Labs" />
      </div>
      <div class="header-meta-block">
        <div class="header-title-badge">STATEMENT OF WORK</div>
        <div class="header-doc-num">${esc(sowNumber)}</div>
        <div class="header-dates-row">
          <span>SOW Date: <b>${esc(sowDate)}</b></span>
        </div>
      </div>
    </div>
  </div>

  <!-- BODY CONTENT (PAGE 2) -->
  <div class="body-content">
    <div>
      <div class="page-number-indicator">
        <span>SECTIONS 3, 4 &amp; 5: OUT OF SCOPE, TECH STACK &amp; MILESTONE PAYMENTS</span>
        <span>PAGE 2 OF 3</span>
      </div>

      <!-- Section 3: What's NOT Included -->
      <div class="article-box">
        <div class="article-title"><span>SECTION 3</span> What's NOT Included (Out of Scope)</div>
        <div class="article-body">
          <p>To ensure project momentum and protect budget boundaries, the following items are strictly out of scope for this SOW:</p>
          <ul>
            ${outOfScopeItems.map(item => `<li>${esc(item)}</li>`).join('')}
          </ul>
        </div>
      </div>

      <!-- Section 4: Tech Stack -->
      <div class="article-box">
        <div class="article-title"><span>SECTION 4</span> Technology Stack Architecture</div>
        <div class="article-body" style="margin-bottom:8px;">
          <p>Orvyn Labs Partnership will build and deploy project <b>${esc(projectName)}</b> using the following modern enterprise technology stack:</p>
        </div>
        <div>
          ${techBadges}
        </div>
      </div>

      <!-- Section 5: Timeline & Milestone Payments -->
      <div class="article-box">
        <div class="article-title"><span>SECTION 5</span> Timeline &amp; Milestone Payments Schedule</div>
        <table class="sow-table">
          <thead>
            <tr>
              <th style="text-align:center;">#</th>
              <th>Milestone Work &amp; Deliverable</th>
              <th>Target Due Date</th>
              <th style="text-align:right;">Payment Amount</th>
            </tr>
          </thead>
          <tbody>
            ${milestoneRows}
          </tbody>
        </table>

        <!-- Financial Summary Grid -->
        <div class="financial-summary-grid">
          <div class="fin-box">
            <div class="fin-label">Total Project Fee</div>
            <div class="fin-val">${fmt(totalFee)}</div>
          </div>
          <div class="fin-box">
            <div class="fin-label">Advance Deposit</div>
            <div class="fin-val" style="color:#16A34A;">${fmt(advanceAmount)}</div>
          </div>
          <div class="fin-box">
            <div class="fin-label">Invoice Payment Terms</div>
            <div class="fin-val" style="font-size:14px;">Net ${paymentTermsDays} Days</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer-two-col">
      <div>
        <div class="footer-col-title">Statement of Work</div>
        <div class="footer-col-text">
          Project SOW for <b>${esc(projectName)}</b> under MSA <b>${esc(linkedMsaNumber)}</b>. Page 2 of 3.
        </div>
      </div>
      <div>
        <div class="footer-col-title">Connect With Orvyn Labs</div>
        <div class="footer-contacts-grid">
          <div class="footer-contact-line">${globeIcon} <a href="https://www.orvynlabs.in">www.orvynlabs.in</a></div>
          <div class="footer-contact-line">${mailIcon} <a href="mailto:hello@orvynlabs.in">hello@orvynlabs.in</a></div>
          <div class="footer-contact-line">${phoneIcon} +91 85905 51991</div>
          <div class="footer-contact-line">${mapPinIcon} Calicut, Kerala, India &ndash; 673014</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Bottom Bar -->
  <div class="bottom-bar">
    &copy; 2026 Orvyn Labs. All Rights Reserved. <span>•</span> Statement of Work <span>•</span> Confidential Document <span>•</span> Page 2 of 3
  </div>

</div>

<!-- ════════════════════════════════════════════════════════════════
     PAGE 3: DEDICATED REVISIONS, CLIENT OBLIGATIONS & SIGN-OFF EXECUTION WITH PROMINENT SEAL
     ════════════════════════════════════════════════════════════════ -->
<div class="sow-page">

  <!-- HEADER BANNER -->
  <div class="header-banner">
    <div class="header-top-grid">
      <div class="header-brand-block">
        <img src="/brand/document-logo.png" alt="Orvyn Labs" />
      </div>
      <div class="header-meta-block">
        <div class="header-title-badge">STATEMENT OF WORK</div>
        <div class="header-doc-num">${esc(sowNumber)}</div>
        <div class="header-dates-row">
          <span>SOW Date: <b>${esc(sowDate)}</b></span>
        </div>
      </div>
    </div>
  </div>

  <!-- BODY CONTENT (PAGE 3) -->
  <div class="body-content">
    <div>
      <div class="page-number-indicator">
        <span>SECTIONS 6 &ndash; 9: REVISIONS, SUPPORT, SCOPE CHANGES &amp; SIGN-OFF</span>
        <span>PAGE 3 OF 3</span>
      </div>

      <!-- Section 6, 7 & 8: Revisions, Support & Scope Changes -->
      <div class="info-cards-grid">
        <div class="card">
          <div class="card-header-label">SECTION 6 &amp; 7 &middot; Revisions &amp; Client Obligations</div>
          <div class="party-sub" style="font-size:10.5px;line-height:1.7;">
            <b>Revisions Included:</b> ${revisionRounds} rounds of review per milestone.<br />
            <b>Bug-Fix Support:</b> ${esc(supportPeriod)}.<br />
            <b>Client Feedback Window:</b> Within ${feedbackWindowDays} business days.<br />
            <b>Client Contact:</b> ${esc(clientPocName)} (<a href="mailto:${esc(clientPocEmail)}" style="color:var(--brand);text-decoration:none;">${esc(clientPocEmail)}</a>).
          </div>
        </div>

        <div class="card">
          <div class="card-header-label">SECTION 8 &middot; Scope Modifications</div>
          <div class="party-sub" style="font-size:10.5px;line-height:1.7;">
            Any new feature request or technical addition outside this SOW requires a separate Change Order, mutually agreed upon in writing before engineering work begins.
          </div>
        </div>
      </div>

      <!-- Section 9: Sign-Off Table & Prominent Seal -->
      <div class="article-box" style="margin-bottom:12px;">
        <div class="article-title"><span>SECTION 9</span> Sign-Off Execution &amp; SOW Approval</div>
        <div class="article-body">
          <p>Both parties hereby agree to the project scope, deliverables, timeline, and milestone payment schedule detailed in this Statement of Work.</p>
        </div>

        <!-- 2-Column Signature Table -->
        <table class="sign-off-table">
          <thead>
            <tr>
              <th>Orvyn Labs Partnership (Service Provider)</th>
              <th>${esc(clientCompanyName)} (Client)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <b>Signatory Name:</b> ${esc(providerSignatoryName)}<br />
                <span style="color:var(--muted);font-size:10px;">${esc(providerSignatoryTitle)}</span>
              </td>
              <td>
                <b>Signatory Name:</b> ${esc(clientSignatoryName)}<br />
                <span style="color:var(--muted);font-size:10px;">${esc(clientSignatoryTitle)}</span>
              </td>
            </tr>
            <tr>
              <td>
                <div class="sig-line-drawn"></div>
                <b>Signature:</b> ___________________________
              </td>
              <td>
                <div class="sig-line-drawn"></div>
                <b>Signature:</b> ___________________________
              </td>
            </tr>
            <tr>
              <td>
                <b>Execution Date:</b> ${esc(sowDate)}
              </td>
              <td>
                <b>Execution Date:</b> ${esc(sowDate)}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Official Prominent Company Seal Card -->
        <div class="seal-card-large">
          <div style="font-size:9.5px;font-weight:800;letter-spacing:1.6px;color:var(--brand-deep);text-transform:uppercase;margin-bottom:6px;">Official Verification Stamp &amp; Seal</div>
          <svg class="seal-svg" width="90" height="90" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <path id="arcTopSowFinal2" d="M 22,70 A 48,48 0 0,1 118,70" />
              <path id="arcBottomSowFinal2" d="M 118,70 A 48,48 0 0,1 22,70" />
            </defs>
            <circle cx="70" cy="70" r="66" fill="none" stroke="#360CAF" stroke-width="2.5" />
            <circle cx="70" cy="70" r="60" fill="none" stroke="#78716C" stroke-width="1" stroke-dasharray="4 2.5" />
            <circle cx="70" cy="70" r="41" fill="none" stroke="#360CAF" stroke-width="1.2" />
            <text fill="#360CAF" font-family="Manrope, sans-serif" font-size="10" font-weight="700" letter-spacing="2.5">
              <textPath href="#arcTopSowFinal2" startOffset="50%" text-anchor="middle">ORVYN LABS</textPath>
            </text>
            <text fill="#360CAF" font-family="Manrope, sans-serif" font-size="8.5" font-weight="600" letter-spacing="3">
              <textPath href="#arcBottomSowFinal2" startOffset="50%" text-anchor="middle">OFFICIAL • VERIFIED</textPath>
            </text>
            <circle cx="18" cy="70" r="2.5" fill="#360CAF" />
            <circle cx="122" cy="70" r="2.5" fill="#360CAF" />
            <image href="/brand/document-logo.png" xlink:href="/brand/document-logo.png" x="32" y="44" width="76" height="52" preserveAspectRatio="xMidYMid meet" />
          </svg>
          <div class="seal-caption-text">Official Verified Company Seal</div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer-two-col">
      <div>
        <div class="footer-col-title">Statement of Work</div>
        <div class="footer-col-text">
          Project SOW for <b>${esc(projectName)}</b> under MSA <b>${esc(linkedMsaNumber)}</b>. Page 3 of 3.
        </div>
      </div>
      <div>
        <div class="footer-col-title">Connect With Orvyn Labs</div>
        <div class="footer-contacts-grid">
          <div class="footer-contact-line">${globeIcon} <a href="https://www.orvynlabs.in">www.orvynlabs.in</a></div>
          <div class="footer-contact-line">${mailIcon} <a href="mailto:hello@orvynlabs.in">hello@orvynlabs.in</a></div>
          <div class="footer-contact-line">${phoneIcon} +91 85905 51991</div>
          <div class="footer-contact-line">${mapPinIcon} Calicut, Kerala, India &ndash; 673014</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Bottom Bar -->
  <div class="bottom-bar">
    &copy; 2026 Orvyn Labs. All Rights Reserved. <span>•</span> Statement of Work <span>•</span> Confidential Document <span>•</span> Page 3 of 3
  </div>

</div>

</body>
</html>`;
}

function esc(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

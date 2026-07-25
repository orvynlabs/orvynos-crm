/**
 * InvoiceTemplate — Server-rendered HTML template for Orvyn Labs Enterprise Invoice PDFs.
 * Styled with pitch-deck aesthetic: Manrope typography, #360CAF primary purple gradient,
 * subtle borderless-feeling card fills, mobile-optimized crisp white rendering engine
 * (prevents ash/gray background color on mobile PDF viewers), and adaptive A4 auto-scaling.
 */

export interface InvoiceLineItem {
  service?: string;
  description: string;
  quantity: number;
  rate: number;
  taxRate?: number;
  amount: number;
}

export interface InvoiceTemplateProps {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: string;
  invoiceRef?: string;
  projectRef?: string;
  // Client
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
  billingPeriod?: string;
  milestone?: string;
  paymentMethod?: string;
  // Items
  lineItems: InvoiceLineItem[];
  subtotal: number;
  discount?: number;
  taxRate: number;
  taxAmount: number;
  previousBalance?: number;
  amountPaid?: number;
  total: number;
  // Notes
  notes?: string;
}

export function renderInvoiceHtml(props: InvoiceTemplateProps): string {
  const {
    invoiceNumber, issueDate, dueDate, status,
    invoiceRef = `REF-${invoiceNumber}`,
    projectRef = `PRJ-2026-WEB`,
    clientName,
    clientCompanyName = clientName,
    clientContactName,
    clientEmail, clientPhone, clientGstin, clientAddress,
    projectName = "Enterprise Application Engineering",
    projectId = "PRJ-2026-001",
    serviceCategory = "Software Engineering & Cloud Services",
    billingPeriod = "Current Milestone",
    milestone = "Deliverable Approval",
    paymentMethod = "Bank Transfer / GPay / UPI",
    lineItems = [], subtotal = 0, discount = 0, taxRate = 18, taxAmount = 0,
    previousBalance = 0, amountPaid = 0, total = 0,
    notes,
  } = props;

  const balanceDue = total - amountPaid;

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n);

  const statusLabel = (status || 'DRAFT').replace(/_/g, ' ');
  const statusColors: Record<string, { color: string; bg: string; border: string }> = {
    PAID: { color: '#16A34A', bg: '#E8F8F0', border: '#BBF7D0' },
    SENT: { color: '#360CAF', bg: '#F3EFFF', border: '#DDD0FF' },
    DRAFT: { color: '#78716C', bg: '#F5F5F4', border: '#E7E5E4' },
    OVERDUE: { color: '#EF4444', bg: '#FEF2F2', border: '#FCA5A5' },
    UNPAID: { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
    PARTIALLY_PAID: { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
    CANCELLED: { color: '#78716C', bg: '#F5F5F4', border: '#E7E5E4' },
  };
  const sc = statusColors[status] || statusColors.DRAFT;

  // Adaptive Auto-Scaling Parameters based on item count
  const itemCount = lineItems.length;
  let tablePadding = "11px 14px";
  let tableFontSize = "10px";
  let cardPadding = "15px 18px";
  let sectionGap = "20px";
  let notesMargin = "28px";
  let sealPadding = "11px 14px";

  if (itemCount > 6) {
    tablePadding = "5px 10px";
    tableFontSize = "8.5px";
    cardPadding = "10px 14px";
    sectionGap = "12px";
    notesMargin = "12px";
    sealPadding = "6px 10px";
  } else if (itemCount > 4) {
    tablePadding = "8px 12px";
    tableFontSize = "9px";
    cardPadding = "12px 16px";
    sectionGap = "16px";
    notesMargin = "18px";
    sealPadding = "8px 12px";
  }

  const rows = lineItems.map((item, i) => `
    <tr class="${i % 2 === 1 ? 'row-alt' : ''}">
      <td class="td-num">${i + 1}</td>
      <td class="td-service">${esc(item.service || 'Software Engineering')}</td>
      <td class="td-desc">${esc(item.description)}</td>
      <td class="td-center">${item.quantity}</td>
      <td class="td-right">${fmt(item.rate)}</td>
      <td class="td-right">${item.taxRate ?? taxRate}%</td>
      <td class="td-amount">${fmt(item.amount)}</td>
    </tr>
  `).join('');

  // Outline Icons SVG definitions
  const phoneIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`;
  const mailIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`;
  const globeIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10z"></path></svg>`;
  const mapPinIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="color-scheme" content="light" />
<title>Invoice ${invoiceNumber} — Orvyn Labs</title>
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
    --radius-md: 8px;
    --radius-sm: 5px;
    --shadow-subtle: 0 2px 10px rgba(54, 12, 175, 0.02);
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  html, body {
    width: 210mm;
    height: 297mm;
    max-height: 297mm;
    overflow: hidden;
    margin: 0;
    padding: 0;
    font-family: "Manrope", "Segoe UI", -apple-system, sans-serif;
    background-color: #ffffff !important;
    background: #ffffff !important;
    color: var(--ink);
    color-scheme: light !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    font-feature-settings: "tnum" 1;
  }

  /* Strict Single-Page A4 Container */
  .invoice-wrapper {
    width: 210mm;
    height: 297mm;
    max-height: 297mm;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background-color: #ffffff !important;
    background: #ffffff !important;
    color-scheme: light !important;
    position: relative;
    overflow: hidden;
    page-break-after: avoid;
    break-after: avoid;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* ════════════ 1. HEADER BANNER ════════════ */
  .header-banner {
    background: linear-gradient(135deg, #360CAF 0%, #1E0875 100%);
    padding: 24px 38px 18px;
    color: #fff;
    border-bottom: 3px solid #4D18D3;
  }

  .header-top-grid {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header-brand-block {
    display: flex;
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
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 2.5px;
    color: #DDD0FF;
    text-transform: uppercase;
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.22);
    border-radius: 6px;
    padding: 3px 12px;
  }

  .header-inv-num {
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

  /* Company Details Strip inside Header */
  .company-info-strip {
    margin-top: 16px;
    padding-top: 12px;
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

  /* ════════════ 2. MAIN BODY CONTENT (Crisp White Background) ════════════ */
  .body-content {
    padding: 24px 38px 20px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background-color: #ffffff !important;
    background: #ffffff !important;
  }

  /* Section Title Standard */
  .section-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1.5px;
    color: var(--brand-deep);
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .section-label::before {
    content: "";
    width: 9px;
    height: 2.5px;
    background: var(--brand);
    border-radius: 2px;
  }

  /* Cards Grid: Client Info & Project Info (Ultra-Subtle Borderless Look) */
  .info-cards-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 22px;
  }

  .card {
    background: var(--bg-soft);
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    padding: ${cardPadding};
  }

  .card-header-label {
    font-size: 8.5px;
    font-weight: 800;
    letter-spacing: 1.2px;
    color: var(--brand);
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .party-title {
    font-size: 14.5px;
    font-weight: 800;
    color: var(--ink);
    letter-spacing: -0.3px;
  }

  .party-sub {
    font-size: 10px;
    color: var(--soft);
    line-height: 1.6;
    margin-top: 4px;
  }

  .party-sub b { color: var(--ink); font-weight: 700; }

  .kv-grid {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 6px 14px;
    font-size: 10px;
    line-height: 1.55;
  }

  .kv-label { color: var(--muted); font-weight: 500; }
  .kv-val { color: var(--ink); font-weight: 700; }

  /* ════════════ 3. ENTERPRISE TABLE ════════════ */
  .table-section {
    margin-bottom: 22px;
  }

  table.invoice-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    overflow: hidden;
    background: #ffffff;
  }

  table.invoice-table thead th {
    font-size: 8.5px;
    font-weight: 800;
    letter-spacing: 1px;
    color: var(--brand-deep);
    text-transform: uppercase;
    text-align: left;
    padding: ${tablePadding};
    background: var(--brand-tint);
    border-bottom: 1px solid var(--line);
  }

  table.invoice-table tbody td {
    padding: ${tablePadding};
    font-size: ${tableFontSize};
    border-bottom: 1px solid var(--line);
    color: var(--soft);
  }

  table.invoice-table tbody tr.row-alt {
    background: var(--bg-soft);
  }

  table.invoice-table tbody tr:last-child td {
    border-bottom: none;
  }

  .td-num { width: 4%; color: var(--muted); }
  .td-service { width: 22%; font-weight: 700; color: var(--brand-deep); }
  .td-desc { width: 38%; font-weight: 500; color: var(--ink); }
  .td-center { width: 6%; text-align: center; font-weight: 600; }
  .td-right { width: 11%; text-align: right; }
  .td-amount { width: 13%; text-align: right; font-weight: 800; color: var(--ink); background: rgba(54, 12, 175, 0.02); }

  /* ════════════ 4. HEIGHT-MATCHED FINANCIALS & SEAL GRID (Subtle Seamless Cards) ════════════ */
  .financials-grid {
    display: grid;
    grid-template-columns: 1fr 285px;
    gap: 20px;
    align-items: stretch;
    margin-bottom: 22px;
  }

  .payment-instructions-column {
    display: flex;
    flex-direction: column;
    gap: ${sectionGap};
    justify-content: space-between;
  }

  .payment-details-card {
    background: var(--bg-soft);
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    padding: ${cardPadding};
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .card-sub-title {
    font-size: 8.5px;
    font-weight: 800;
    letter-spacing: 1px;
    color: var(--brand-deep);
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .bank-fields-inline {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 6px 14px;
    font-size: 9.5px;
    line-height: 1.55;
  }

  .bank-fields-inline b { color: var(--ink); font-weight: 700; }

  .payment-ref-note {
    margin-top: 10px;
    font-size: 9px;
    font-style: italic;
    color: var(--brand);
    font-weight: 600;
  }

  .instructions-card {
    background: var(--bg-soft);
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    padding: 13px 18px;
    font-size: 9px;
    color: var(--soft);
    line-height: 1.6;
    height: 100%;
    display: flex;
    align-items: center;
  }

  .instructions-card ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .instructions-card li {
    position: relative;
    padding-left: 12px;
    margin-bottom: 4px;
  }

  .instructions-card li:last-child {
    margin-bottom: 0;
  }

  .instructions-card li::before {
    content: "•";
    position: absolute;
    left: 0;
    color: var(--brand);
    font-weight: bold;
  }

  /* Right Column: Financial Summary + Authorized Seal Card */
  .right-financial-column {
    display: flex;
    flex-direction: column;
    gap: ${sectionGap};
    justify-content: space-between;
  }

  .summary-card {
    background: #ffffff;
    border: 1px solid var(--brand-tint-2);
    border-radius: var(--radius-md);
    overflow: hidden;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    padding: 10px 16px;
    font-size: 10px;
    color: var(--soft);
    border-bottom: 1px solid var(--line);
  }

  .summary-row b { color: var(--ink); font-weight: 700; }

  .summary-grand-total {
    background: linear-gradient(135deg, #360CAF 0%, #1E0875 100%);
    padding: 14px 16px;
    color: #fff;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .grand-label {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1.2px;
    color: #DDD0FF;
    text-transform: uppercase;
  }

  .grand-amount {
    font-size: 18.5px;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: -0.5px;
  }

  /* Authorized Seal Card (Seamless Soft Card Fill) */
  .seal-card {
    background: var(--bg-soft);
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    padding: ${sealPadding};
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    height: 100%;
  }

  .seal-card-title {
    font-size: 8.5px;
    font-weight: 800;
    letter-spacing: 1.4px;
    color: var(--brand-deep);
    text-transform: uppercase;
    margin-bottom: 4px;
  }

  .seal-svg { transform: rotate(-4deg); }
  
  .seal-caption-text {
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 1.2px;
    color: var(--muted);
    text-transform: uppercase;
    margin-top: 3px;
  }

  /* ════════════ 5. NOTES CARD ════════════ */
  .notes-card {
    background: var(--bg-soft);
    border: 1px dashed var(--brand-tint-2);
    border-radius: var(--radius-md);
    padding: 14px 20px;
    font-size: 9.5px;
    color: var(--soft);
    line-height: 1.6;
    margin-top: 8px;
    margin-bottom: ${notesMargin};
  }

  .notes-card b { color: var(--brand-deep); font-weight: 700; }

  /* ════════════ 6. TWO-COLUMN FOOTER ════════════ */
  .footer-two-col {
    display: grid;
    grid-template-columns: 1fr 1.2fr;
    gap: 32px;
    align-items: flex-start;
    padding-top: 20px;
    border-top: 1.5px solid var(--line);
    background-color: #ffffff !important;
    background: #ffffff !important;
  }

  .footer-col-title {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1.4px;
    color: var(--brand-deep);
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .footer-col-text {
    font-size: 9px;
    color: var(--soft);
    line-height: 1.6;
  }

  .footer-contacts-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 16px;
    font-size: 9.5px;
    color: var(--soft);
  }

  .footer-contact-line {
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .footer-contact-line svg { stroke: var(--brand); flex-shrink: 0; }
  .footer-contact-line a { color: var(--brand); text-decoration: none; font-weight: 600; }

  /* ════════════ 7. BOTTOM FOOTER BAR ════════════ */
  .bottom-bar {
    background: var(--brand-tint);
    border-top: 1px solid var(--brand-tint-2);
    padding: 8.5px 38px;
    text-align: center;
    font-size: 8px;
    color: var(--muted);
    line-height: 1.4;
  }

  .bottom-bar span {
    margin: 0 6px;
    color: var(--brand-tint-2);
  }
</style>
</head>
<body>

<div class="invoice-wrapper">

  <!-- 1. HEADER BANNER -->
  <div class="header-banner">
    <div class="header-top-grid">
      <div class="header-brand-block">
        <img src="/brand/document-logo.png" alt="Orvyn Labs" />
      </div>
      <div class="header-meta-block">
        <div class="header-title-badge">INVOICE</div>
        <div class="header-inv-num">${esc(invoiceNumber)}</div>
        <div class="header-dates-row">
          <span>Issue Date: <b>${esc(issueDate)}</b></span>
          <span>Due Date: <b>${esc(dueDate)}</b></span>
        </div>
      </div>
    </div>

    <!-- Company details strip inside Header -->
    <div class="company-info-strip">
      <div class="company-left-details">
        <div class="company-meta-item">${mapPinIcon} <b>Orvyn Labs Partnership</b> &middot; Calicut, Kerala, India &ndash; 673014</div>
        <div class="company-meta-item" style="margin-top:2px;">GSTIN: <b>32AAACA0000A1Z5</b></div>
      </div>
      <div class="company-right-details">
        <span class="company-meta-item">${phoneIcon} +91 85905 51991</span>
        <span class="company-meta-item">${mailIcon} <a href="mailto:hello@orvynlabs.in">hello@orvynlabs.in</a></span>
        <span class="company-meta-item">${globeIcon} <a href="https://www.orvynlabs.in">www.orvynlabs.in</a></span>
      </div>
    </div>
  </div>

  <!-- 2. MAIN BODY CONTENT -->
  <div class="body-content">
    <div>
      <!-- Client Info & Project Info Cards Grid -->
      <div class="info-cards-grid">
        <!-- Client Information Card -->
        <div class="card">
          <div class="card-header-label">Client Information</div>
          <div class="party-title">${esc(clientName)}</div>
          <div class="party-sub">
            ${clientCompanyName && clientCompanyName !== clientName ? `<b>Company:</b> ${esc(clientCompanyName)}<br />` : ''}
            ${clientContactName ? `<b>Attn:</b> ${esc(clientContactName)}<br />` : ''}
            ${clientEmail ? `<b>Email:</b> ${esc(clientEmail)} &nbsp;&middot;&nbsp; ` : ''}
            ${clientPhone ? `<b>Phone:</b> ${esc(clientPhone)}<br />` : ''}
            ${clientAddress ? `<b>Address:</b> ${esc(clientAddress)}<br />` : ''}
            ${clientGstin ? `<b>GSTIN:</b> ${esc(clientGstin)}` : ''}
          </div>
        </div>

        <!-- Project Information Card -->
        <div class="card">
          <div class="card-header-label">Project Information</div>
          <div class="kv-grid">
            <div class="kv-label">Project Name:</div>
            <div class="kv-val">${esc(projectName)}</div>

            <div class="kv-label">Project ID / Ref:</div>
            <div class="kv-val">${esc(projectId)} &nbsp;|&nbsp; ${esc(projectRef)}</div>

            <div class="kv-label">Service Category:</div>
            <div class="kv-val">${esc(serviceCategory)}</div>

            <div class="kv-label">Billing Period:</div>
            <div class="kv-val">${esc(billingPeriod)} &nbsp;|&nbsp; ${esc(milestone)}</div>

            <div class="kv-label">Payment Method:</div>
            <div class="kv-val">${esc(paymentMethod)}</div>
          </div>
        </div>
      </div>

      <!-- Enterprise Items Table -->
      <div class="table-section">
        <div class="section-label">Invoice Items &amp; Services</div>
        <table class="invoice-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Service Category</th>
              <th>Description</th>
              <th style="text-align:center;">Qty</th>
              <th style="text-align:right;">Rate</th>
              <th style="text-align:right;">Tax</th>
              <th style="text-align:right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>

      <!-- Height-Matched Financials & Seal Grid -->
      <div class="financials-grid">
        <!-- Left Column: Payment Details & Instructions -->
        <div class="payment-instructions-column">
          <!-- Payment Information Card -->
          <div class="payment-details-card">
            <div class="card-sub-title">Payment Information</div>
            <div class="bank-fields-inline">
              <div>Bank Name: <b>Canara Bank (Calicut Branch)</b></div>
              <div>Account Name: <b>Orvyn Labs Partnership</b></div>
              <div>Account Number: <b>110023849102</b></div>
              <div>IFSC Code: <b>CNRB0001204</b></div>
              <div>GPay / PhonePe: <b>+91 85905 51991</b></div>
              <div>UPI ID: <b>orvynlabs@oksbi</b></div>
              <div>Payment Terms: <b>Net 15 Days</b></div>
              <div>Currency: <b>INR (₹)</b></div>
            </div>
            <div class="payment-ref-note">
              Please mention the Invoice Number (${esc(invoiceNumber)}) as the payment reference while making the transfer.
            </div>
          </div>

          <!-- Payment Instructions Card -->
          <div class="instructions-card">
            <ul>
              <li>Payment is due within 15 days of invoice issue date.</li>
              <li>Deliverables remain the property of Orvyn Labs until full payment is received.</li>
              <li>Late payments may incur additional charges as per the agreement terms.</li>
              <li>Please retain this tax invoice for your accounting and GST records.</li>
              <li>For billing queries, contact hello@orvynlabs.in or +91 85905 51991.</li>
            </ul>
          </div>
        </div>

        <!-- Right Column: Financial Summary + Authorized Seal Card -->
        <div class="right-financial-column">
          <!-- Floating Summary Card -->
          <div class="summary-card">
            <div class="summary-row">
              <span>Subtotal</span>
              <b>${fmt(subtotal)}</b>
            </div>
            ${discount > 0 ? `
              <div class="summary-row">
                <span>Discount</span>
                <b style="color:#16A34A;">-${fmt(discount)}</b>
              </div>
            ` : ''}
            <div class="summary-row">
              <span>GST (${taxRate}%)</span>
              <b>${fmt(taxAmount)}</b>
            </div>
            ${previousBalance > 0 ? `
              <div class="summary-row">
                <span>Previous Balance</span>
                <b>${fmt(previousBalance)}</b>
              </div>
            ` : ''}
            ${amountPaid > 0 ? `
              <div class="summary-row">
                <span>Amount Paid</span>
                <b style="color:#16A34A;">${fmt(amountPaid)}</b>
              </div>
            ` : ''}
            <div class="summary-grand-total">
              <span class="grand-label">Grand Total</span>
              <span class="grand-amount">${fmt(balanceDue)}</span>
            </div>
          </div>

          <!-- Authorized Seal Card -->
          <div class="seal-card">
            <div class="seal-card-title">Authorized By</div>
            <svg class="seal-svg" width="62" height="62" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <path id="arcTop" d="M 22,70 A 48,48 0 0,1 118,70" />
                <path id="arcBottom" d="M 118,70 A 48,48 0 0,1 22,70" />
              </defs>
              <circle cx="70" cy="70" r="66" fill="none" stroke="#360CAF" stroke-width="2" />
              <circle cx="70" cy="70" r="60" fill="none" stroke="#78716C" stroke-width="0.8" stroke-dasharray="3 2" />
              <circle cx="70" cy="70" r="41" fill="none" stroke="#360CAF" stroke-width="1" />
              <text fill="#360CAF" font-family="Manrope, 'Segoe UI', sans-serif" font-size="10" font-weight="700" letter-spacing="2.5">
                <textPath href="#arcTop" startOffset="50%" text-anchor="middle">ORVYN LABS</textPath>
              </text>
              <text fill="#360CAF" font-family="Manrope, 'Segoe UI', sans-serif" font-size="8.5" font-weight="600" letter-spacing="3">
                <textPath href="#arcBottom" startOffset="50%" text-anchor="middle">OFFICIAL • VERIFIED</textPath>
              </text>
              <circle cx="18" cy="70" r="2" fill="#360CAF" />
              <circle cx="122" cy="70" r="2" fill="#360CAF" />
              <image href="/brand/document-logo.png" x="32" y="44" width="76" height="52" preserveAspectRatio="xMidYMid meet" />
            </svg>
            <div class="seal-caption-text">Company Seal</div>
          </div>
        </div>
      </div>

      <!-- Notes Card -->
      <div class="notes-card">
        <b>Note:</b> ${notes ? esc(notes) : 'Payment due within 15 days of invoice date. Thank you for your business!'}
      </div>
    </div>

    <!-- 2-Column Footer -->
    <div class="footer-two-col">
      <!-- Left Column: Thank You -->
      <div>
        <div class="footer-col-title">Thank You</div>
        <div class="footer-col-text">
          Thank you for choosing <b>Orvyn Labs</b>.<br />
          We appreciate your trust and look forward to delivering reliable, scalable, and high-quality software solutions for your business.
        </div>
      </div>

      <!-- Right Column: Connect With Orvyn Labs -->
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

  <!-- Bottom Footer Bar -->
  <div class="bottom-bar">
    &copy; 2026 Orvyn Labs. All Rights Reserved. <span>•</span> Confidential Business Document <span>•</span> This is a computer-generated invoice and does not require a signature. <span>•</span> Page 1 of 1
  </div>

</div>

</body>
</html>`;
}

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

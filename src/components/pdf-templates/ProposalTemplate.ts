/**
 * ProposalTemplate — Multi-Page Executive Presentation HTML template for Proposals.
 * Each section is formatted to exact A4 pages with zero top/bottom/edge gaps,
 * anchored headers & footers, and pitch-deck presentation styling.
 * Includes a dedicated 4th Closing & Thank You Slide.
 */

export interface PricingItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface ProposalTemplateProps {
  proposalNumber: string;
  title: string;
  date: string;
  validUntil: string;
  status: string;
  // Client
  clientName: string;
  clientContactName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientGstin?: string;
  clientAddress?: string;
  // Project
  projectName?: string;
  // Content
  executiveSummary: string;
  scope: string;
  deliverables: string[];
  timeline: string;
  // Pricing
  pricingItems: PricingItem[];
  totalAmount: number;
  // Terms
  termsAndConditions: string;
}

export function renderProposalHtml(props: ProposalTemplateProps): string {
  const {
    proposalNumber, title, date, validUntil, status,
    clientName, clientContactName, clientEmail, clientPhone, clientGstin, clientAddress,
    projectName,
    executiveSummary, scope, deliverables, timeline,
    pricingItems, totalAmount,
    termsAndConditions,
  } = props;

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n);

  const statusColor = status === 'ACCEPTED' ? '#16A34A' : status === 'REJECTED' ? '#EF4444' : status === 'EXPIRED' ? '#78716C' : '#360CAF';
  const statusBg = status === 'ACCEPTED' ? '#E8F8F0' : status === 'REJECTED' ? '#FEF2F2' : status === 'EXPIRED' ? '#F5F5F4' : '#F3EFFF';

  const pricingRows = pricingItems.map((item, i) => `
    <tr>
      <td style="padding:11px 14px;font-size:12px;border-bottom:1px solid #EAE4FF;">${i + 1}</td>
      <td style="padding:11px 14px;font-size:12px;font-weight:500;border-bottom:1px solid #EAE4FF;">${escapeHtml(item.description)}</td>
      <td style="padding:11px 14px;font-size:12px;text-align:center;border-bottom:1px solid #EAE4FF;">${item.quantity}</td>
      <td style="padding:11px 14px;font-size:12px;text-align:right;border-bottom:1px solid #EAE4FF;">${formatCurrency(item.rate)}</td>
      <td style="padding:11px 14px;font-size:12px;text-align:right;font-weight:600;border-bottom:1px solid #EAE4FF;">${formatCurrency(item.amount)}</td>
    </tr>
  `).join('');

  const deliverablesList = deliverables.map(d => `
    <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;background:#F9F7FF;border:1px solid #EAE4FF;border-radius:8px;padding:10px 14px;">
      <span style="color:#360CAF;font-weight:800;font-size:14px;line-height:1.4;">✓</span>
      <span style="font-size:12px;color:#190659;font-weight:500;line-height:1.5;">${escapeHtml(d)}</span>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Proposal ${proposalNumber}</title>
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
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: "Manrope", "Segoe UI", -apple-system, sans-serif;
    background: #fff;
    color: var(--ink);
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    font-feature-settings: "tnum" 1;
  }

  /* Multi-Page Section Layout */
  .proposal-page {
    width: 210mm;
    min-height: 297mm;
    height: 297mm;
    box-sizing: border-box;
    page-break-after: always;
    break-after: page;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: #fff;
    position: relative;
    overflow: hidden;
  }
  .proposal-page:last-child {
    page-break-after: avoid;
    break-after: avoid;
  }

  .header-bar {
    background: linear-gradient(135deg, #360CAF 0%, #2B0991 100%);
    padding: 32px 40px 26px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .header-compact {
    background: linear-gradient(135deg, #360CAF 0%, #2B0991 100%);
    padding: 16px 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .header-compact .title-sm { font-size: 13px; font-weight: 700; color: #fff; letter-spacing: -.2px; }
  .header-compact .num-sm { font-size: 11px; font-weight: 600; color: #DDD0FF; }

  .header-bar .company-info { margin-top: 10px; font-size: 11px; color: #DDD0FF; line-height: 1.7; }
  .header-bar .company-info a { color: #fff; text-decoration: none; font-weight: 600; }
  .header-bar .doc-info { text-align: right; }
  .header-bar .doc-title-tag {
    display: inline-block; font-size: 9px; font-weight: 700; letter-spacing: 2.5px;
    color: #DDD0FF; text-transform: uppercase;
    background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2);
    border-radius: 6px; padding: 5px 12px;
  }
  .header-bar .doc-number { font-size: 20px; font-weight: 700; color: #fff; margin-top: 8px; letter-spacing: -.5px; }
  .header-bar .doc-meta { font-size: 11px; color: #DDD0FF; line-height: 1.8; margin-top: 6px; }
  .header-bar .doc-meta b { color: #fff; font-weight: 600; }

  .status-pill {
    display: inline-flex; align-items: center; gap: 4px; margin-top: 10px;
    font-size: 9px; font-weight: 700; letter-spacing: .8px;
    color: ${statusColor}; background: ${statusBg};
    border: 1px solid ${statusColor}30; border-radius: 999px; padding: 4px 12px;
    text-transform: uppercase;
  }

  .inner { padding: 28px 40px 24px; flex: 1; flex-grow: 1; }

  .section-label {
    display: flex; align-items: center; gap: 6px;
    font-size: 10px; font-weight: 700; letter-spacing: 1.2px;
    color: var(--brand-deep); text-transform: uppercase; margin-bottom: 10px; margin-top: 20px;
  }
  .section-label::before { content: ""; width: 12px; height: 3px; background: var(--brand); border-radius: 2px; }

  .rule { border: 0; height: 2px; margin: 16px 0;
    background: linear-gradient(90deg, var(--brand) 0%, var(--brand-tint-2) 65%, transparent 100%); border-radius: 2px; }

  .cols { display: flex; gap: 28px; }
  .col { flex: 1; }
  .party-name { font-size: 14px; font-weight: 700; letter-spacing: -.2px; color: var(--ink); }
  .party-detail { font-size: 11px; color: var(--soft); line-height: 1.7; margin-top: 3px; }

  .content-block { font-size: 12px; color: var(--soft); line-height: 1.8; margin-top: 4px; background: var(--bg-soft); border: 1px solid var(--line); border-radius: 10px; padding: 14px 18px; }

  .project-card {
    background: var(--bg-soft); border: 1px solid var(--line); border-left: 3px solid var(--brand);
    border-radius: 8px; padding: 12px 16px; margin-top: 6px;
    font-size: 11.5px; line-height: 1.8; color: var(--soft);
  }
  .project-card b { color: var(--ink); font-weight: 700; }

  table { width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 8px; font-size: 12px;
    border: 1px solid var(--brand-tint-2); border-radius: 10px; overflow: hidden; }
  thead th {
    font-size: 9px; font-weight: 700; letter-spacing: 1px;
    color: var(--brand-deep); text-transform: uppercase; text-align: left; padding: 11px 14px;
    background: var(--brand-tint); border-bottom: 1px solid var(--brand-tint-2);
  }
  thead th:last-child { text-align: right; }

  .total-row {
    background: linear-gradient(135deg, #360CAF 0%, #2B0991 100%);
    display: flex; justify-content: space-between; align-items: center;
    padding: 16px 22px; border-radius: 10px; margin-top: 14px;
  }
  .total-label { font-size: 10px; font-weight: 700; letter-spacing: 1.2px; color: #DDD0FF; text-transform: uppercase; }
  .total-amount { font-size: 22px; font-weight: 700; color: #fff; letter-spacing: -.5px; }

  .terms-block {
    background: var(--bg-soft); border: 1px solid var(--line);
    border-radius: 10px; padding: 14px 18px; margin-top: 8px;
    font-size: 11px; color: var(--soft); line-height: 1.8; white-space: pre-line;
  }

  .footer {
    background: linear-gradient(180deg, var(--brand-tint) 0%, #fff 150%);
    border-top: 1px solid var(--brand-tint-2); padding: 14px 40px 16px; text-align: center;
  }
  .footer .thanks { font-size: 12px; font-weight: 600; color: var(--ink); letter-spacing: -.2px; }
  .footer .thanks span { color: var(--brand-deep); }
  .footer .contact { font-size: 10px; color: var(--soft); margin-top: 3px; line-height: 1.5; }
  .footer .fine { font-size: 9px; color: var(--muted); margin-top: 4px; }

  .seal { transform: rotate(-5deg); }
  .auth-row { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 20px; gap: 20px; }
  .seal-caption { font-size: 9px; font-weight: 700; letter-spacing: 1px; color: var(--muted); text-transform: uppercase; margin-top: 6px; text-align: center; }
  .seal-caption b { color: var(--ink); font-weight: 700; }

  /* Closing Slide Styles */
  .closing-card {
    background: linear-gradient(135deg, #360CAF 0%, #2B0991 100%);
    border-radius: 16px;
    padding: 40px;
    color: #fff;
    text-align: center;
    margin-top: 20px;
  }
  .next-steps-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    margin-top: 24px;
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
    background: #fff;
    color: #360CAF;
    font-size: 11px;
    font-weight: 800;
    margin-bottom: 8px;
  }
  .contact-box {
    background: var(--bg-soft);
    border: 1.5px solid var(--line);
    border-radius: 14px;
    padding: 24px 32px;
    margin-top: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
</style>
</head>
<body>

<!-- ═══════════════════════════════════════════ -->
<!-- PAGE 1: COVER & EXECUTIVE OVERVIEW        -->
<!-- ═══════════════════════════════════════════ -->
<div class="proposal-page">
  <div>
    <div class="header-bar">
      <div>
        <img src="/brand/document-logo.png" alt="Orvyn Labs" style="height:80px;width:auto;display:block;filter:brightness(0) invert(1);" />
        <div class="company-info">
          Orvyn Labs Partnership<br />
          Calicut, Kerala, India &ndash; 673014<br />
          +91 85905 51991 &nbsp;&middot;&nbsp; +91 90721 90088<br />
          <a href="https://www.orvynlabs.in">www.orvynlabs.in</a> &nbsp;&middot;&nbsp; hello@orvynlabs.in
        </div>
      </div>
      <div class="doc-info">
        <div class="doc-title-tag">Business Proposal</div>
        <div class="doc-number">${escapeHtml(proposalNumber)}</div>
        <div class="doc-meta">
          Date: <b>${escapeHtml(date)}</b><br />
          Valid Until: <b>${escapeHtml(validUntil)}</b>
        </div>
      </div>
    </div>

    <div class="inner">
      <div style="font-size:20px;font-weight:800;color:#190659;letter-spacing:-.4px;margin-bottom:6px;">${escapeHtml(title)}</div>
      <hr class="rule" />

      <div class="cols">
        <div class="col">
          <div class="section-label" style="margin-top:0;">Prepared For</div>
          <div class="party-name">${escapeHtml(clientName)}</div>
          <div class="party-detail">
            ${clientContactName ? `Attn: ${escapeHtml(clientContactName)}<br />` : ''}
            ${clientEmail ? `${escapeHtml(clientEmail)}<br />` : ''}
            ${clientPhone ? `${escapeHtml(clientPhone)}<br />` : ''}
            ${clientAddress ? `${escapeHtml(clientAddress)}<br />` : ''}
            ${clientGstin ? `GSTIN: ${escapeHtml(clientGstin)}` : ''}
          </div>
        </div>
        <div class="col">
          ${projectName ? `
          <div class="section-label" style="margin-top:0;">Associated Project</div>
          <div class="project-card">
            <b>${escapeHtml(projectName)}</b>
          </div>
          ` : ''}
        </div>
      </div>

      <div class="section-label">1. Executive Summary</div>
      <div class="content-block">${escapeHtml(executiveSummary)}</div>

      <div class="section-label">2. Scope of Work</div>
      <div class="content-block">${escapeHtml(scope)}</div>
    </div>
  </div>

  <div class="footer">
    <div class="thanks">Thank you for considering <span>Orvyn Labs</span> &mdash; Page 1 of 4</div>
    <div class="fine">Digitally prepared and sealed by Orvyn Labs Partnership &middot; www.orvynlabs.in</div>
  </div>
</div>

<!-- ═══════════════════════════════════════════ -->
<!-- PAGE 2: DELIVERABLES & TIMELINE            -->
<!-- ═══════════════════════════════════════════ -->
<div class="proposal-page">
  <div>
    <div class="header-compact">
      <div class="title-sm">${escapeHtml(title)}</div>
      <div class="num-sm">${escapeHtml(proposalNumber)} &nbsp;&middot;&nbsp; Page 2 of 4</div>
    </div>

    <div class="inner">
      <div class="section-label" style="margin-top:10px;">3. Key Project Deliverables</div>
      <div style="margin-top:8px;">
        ${deliverablesList}
      </div>

      <div class="section-label">4. Project Timeline &amp; Milestones</div>
      <div class="content-block">${escapeHtml(timeline)}</div>

      <div class="section-label">5. Technical Standards &amp; Assurance</div>
      <div class="content-block">
        All software components created by <b>Orvyn Labs</b> are engineered adhering to modern performance, security, and responsive UX standards. Deliverables include comprehensive source code handover, deployment automation, and dedicated post-launch support.
      </div>
    </div>
  </div>

  <div class="footer">
    <div class="thanks">Building scalable digital solutions &mdash; <span>Orvyn Labs</span> &mdash; Page 2 of 4</div>
    <div class="fine">Digitally prepared and sealed by Orvyn Labs Partnership &middot; www.orvynlabs.in</div>
  </div>
</div>

<!-- ═══════════════════════════════════════════ -->
<!-- PAGE 3: INVESTMENT, TERMS & AUTHORIZATION  -->
<!-- ═══════════════════════════════════════════ -->
<div class="proposal-page">
  <div>
    <div class="header-compact">
      <div class="title-sm">${escapeHtml(title)}</div>
      <div class="num-sm">${escapeHtml(proposalNumber)} &nbsp;&middot;&nbsp; Page 3 of 4</div>
    </div>

    <div class="inner">
      <div class="section-label" style="margin-top:10px;">6. Investment Breakdown</div>
      <table>
        <thead>
          <tr>
            <th style="width:6%;">#</th>
            <th style="width:42%;">Description</th>
            <th style="width:12%;text-align:center;">Qty</th>
            <th style="width:20%;text-align:right;">Rate</th>
            <th style="width:20%;text-align:right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${pricingRows}
        </tbody>
      </table>
      <div class="total-row">
        <span class="total-label">Total Investment</span>
        <span class="total-amount">${formatCurrency(totalAmount)}</span>
      </div>

      <div class="section-label">7. Terms &amp; Conditions</div>
      <div class="terms-block">${escapeHtml(termsAndConditions)}</div>

      <div class="auth-row">
        <div style="font-size:11px;color:#4A3C80;line-height:1.7;max-width:330px;">
          This proposal is prepared by <b style="color:#190659;">Orvyn Labs Partnership</b> and is valid until <b style="color:#190659;">${escapeHtml(validUntil)}</b>. Acceptance of this proposal constitutes agreement to the terms stated above.
        </div>
        <div style="text-align:center;">
          <svg class="seal" width="110" height="110" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <path id="arcTop" d="M 22,70 A 48,48 0 0,1 118,70" />
              <path id="arcBottom" d="M 118,70 A 48,48 0 0,1 22,70" />
            </defs>
            <circle cx="70" cy="70" r="66" fill="none" stroke="#360CAF" stroke-width="2" />
            <circle cx="70" cy="70" r="60" fill="none" stroke="#360CAF" stroke-width="0.8" stroke-dasharray="3 2" />
            <circle cx="70" cy="70" r="41" fill="none" stroke="#360CAF" stroke-width="1" />
            <text fill="#360CAF" font-family="Manrope, 'Segoe UI', sans-serif" font-size="10" font-weight="700" letter-spacing="2.5">
              <textPath href="#arcTop" startOffset="50%" text-anchor="middle">ORVYN LABS</textPath>
            </text>
            <text fill="#360CAF" font-family="Manrope, 'Segoe UI', sans-serif" font-size="8.5" font-weight="600" letter-spacing="3">
              <textPath href="#arcBottom" startOffset="50%" text-anchor="middle">OFFICIAL • VERIFIED</textPath>
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

  <div class="footer">
    <div class="thanks">Thank you for considering <span>Orvyn Labs</span> &mdash; Page 3 of 4</div>
    <div class="fine">Digitally prepared and sealed by Orvyn Labs Partnership &middot; www.orvynlabs.in</div>
  </div>
</div>

<!-- ═══════════════════════════════════════════ -->
<!-- PAGE 4: CLOSING & THANK YOU SLIDE          -->
<!-- ═══════════════════════════════════════════ -->
<div class="proposal-page">
  <div>
    <div class="header-compact">
      <div class="title-sm">${escapeHtml(title)}</div>
      <div class="num-sm">${escapeHtml(proposalNumber)} &nbsp;&middot;&nbsp; Page 4 of 4</div>
    </div>

    <div class="inner">
      <div class="closing-card">
        <img src="/brand/document-logo.png" alt="Orvyn Labs" style="height:70px;width:auto;display:block;margin:0 auto 16px;filter:brightness(0) invert(1);" />
        <div style="font-size:24px;font-weight:800;letter-spacing:-.5px;margin-bottom:8px;">Thank You for Your Consideration</div>
        <div style="font-size:13px;color:#DDD0FF;max-width:480px;margin:0 auto;line-height:1.6;">
          We are excited about the opportunity to partner with <b>${escapeHtml(clientName)}</b> and deliver extraordinary digital products.
        </div>

        <div class="next-steps-grid">
          <div class="next-step-item">
            <div class="next-step-num">1</div>
            <div style="font-size:12px;font-weight:700;color:#fff;margin-bottom:4px;">Review &amp; Approve</div>
            <div style="font-size:10.5px;color:#DDD0FF;line-height:1.5;">Review proposal terms and confirm acceptance with our team.</div>
          </div>
          <div class="next-step-item">
            <div class="next-step-num">2</div>
            <div style="font-size:12px;font-weight:700;color:#fff;margin-bottom:4px;">Kickoff Meeting</div>
            <div style="font-size:10.5px;color:#DDD0FF;line-height:1.5;">Schedule project kickoff call and align key stakeholders.</div>
          </div>
          <div class="next-step-item">
            <div class="next-step-num">3</div>
            <div style="font-size:12px;font-weight:700;color:#fff;margin-bottom:4px;">Sprint Execution</div>
            <div style="font-size:10.5px;color:#DDD0FF;line-height:1.5;">Commence development as per agreed milestone timeline.</div>
          </div>
        </div>
      </div>

      <div class="section-label">Direct Contact Information</div>
      <div class="contact-box">
        <div>
          <div style="font-size:14px;font-weight:800;color:#190659;">Orvyn Labs Partnership</div>
          <div style="font-size:11px;color:#4A3C80;margin-top:4px;line-height:1.6;">
            Calicut, Kerala, India &ndash; 673014<br />
            Official Portal: <b style="color:#360CAF;">www.orvynlabs.in</b>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:12px;font-weight:700;color:#360CAF;">hello@orvynlabs.in</div>
          <div style="font-size:11px;color:#4A3C80;margin-top:4px;">+91 85905 51991 &middot; +91 90721 90088</div>
        </div>
      </div>
    </div>
  </div>

  <div class="footer">
    <div class="thanks">Let's build something great together &mdash; <span>Orvyn Labs</span> &mdash; Page 4 of 4</div>
    <div class="fine">Digitally prepared and sealed by Orvyn Labs Partnership &middot; www.orvynlabs.in</div>
  </div>
</div>

</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

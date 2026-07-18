export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { prisma } from '../../../lib/db';
import { notFound } from 'next/navigation';

function numberToWordsINR(num: number): string {
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const wholeNumber = Math.floor(num);
  const decimals = Math.round((num - wholeNumber) * 100);

  if (wholeNumber === 0 && decimals === 0) return 'Zero Rupees';

  function formatWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + formatWords(n % 100) : '');
    if (n < 100000) return formatWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + formatWords(n % 1000) : '');
    if (n < 10000000) return formatWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + formatWords(n % 100000) : '');
    return formatWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + formatWords(n % 10000000) : '');
  }

  let words = '';
  if (wholeNumber > 0) {
    words += formatWords(wholeNumber) + ' Rupees';
  }
  if (decimals > 0) {
    if (words) words += ' and ';
    words += formatWords(decimals) + ' Paise';
  }
  return words + ' Only';
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
}

function formatPaymentMethod(method: string): string {
  return method.replace(/_/g, ' ');
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReceiptPrintPage({ params }: PageProps) {
  const { id } = await params;

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      client: true,
      project: true,
    },
  });

  if (!payment) {
    notFound();
  }

  // Calculate payment history dynamically for this project
  const projectPayments = await prisma.payment.findMany({
    where: {
      projectId: payment.projectId,
      status: 'COMPLETED',
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  let previouslyPaid = 0;
  for (const p of projectPayments) {
    if (p.id === payment.id) {
      break;
    }
    previouslyPaid += Number(p.amount);
  }

  const totalProjectValue = Number(payment.project.budget);
  const amountReceived = Number(payment.amount);
  const balanceDue = Math.max(0, totalProjectValue - previouslyPaid - amountReceived);

  const receiptNo = payment.receiptNumber || `RCPT-${payment.id.substring(0, 8).toUpperCase()}`;

  const receiptDateStr = payment.createdAt.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const paidAtDateStr = payment.paidAt.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const amountWords = numberToWordsINR(amountReceived);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          color-scheme: light;
          --brand: #F1441E;
          --brand-deep: #D63A15;
          --brand-tint: #FEF1EC;
          --brand-tint-2: #FBDDD1;
          --ink: #2b2825;
          --muted: #8e8880;
          --soft: #5e5852;
          --line: #f1ece7;
          --bg-soft: #fbf9f7;
          --green: #16A34A;
          --green-bg: #E8F8F0;
          --green-line: #BBF7D0;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: "Manrope", "Segoe UI", -apple-system, sans-serif;
          background: #efeae6;
          color: var(--ink);
          padding: 20px 12px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          font-feature-settings: "tnum" 1;
        }

        .frame {
          max-width: 800px; margin: 0 auto; background: #fff;
          border: 1px solid var(--brand-tint-2); border-radius: 16px; padding: 6px;
          box-shadow: 0 4px 20px rgba(214,58,21,.05);
        }
        .page { border: 1.5px solid var(--brand); border-radius: 11px; overflow: hidden; background: #fff; }
        .inner { padding: 28px 40px 24px; }
        
        @media print {
          html, body {
            height: 100vh;
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #fff;
          }
          .frame { box-shadow: none; max-width: none; border-radius: 0; border: none; padding: 0; width: 100%; }
          .page { border: none; border-radius: 0; width: 100%; }
          .inner { padding: 15px 20px; }
        }

        /* ---------- header ---------- */
        .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; }
        .company-meta { margin-top: 8px; font-size: 11px; color: var(--soft); line-height: 1.7; }
        .company-meta a { color: var(--brand-deep); text-decoration: none; font-weight: 600; }

        .doc-block { text-align: right; flex-shrink: 0; }
        .doc-title {
          display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: 2px;
          color: var(--brand-deep); text-transform: uppercase;
          background: var(--brand-tint); border: 1px solid var(--brand-tint-2);
          border-radius: 6px; padding: 5px 10px;
        }
        .doc-no { font-size: 20px; font-weight: 700; color: var(--ink); margin-top: 6px; letter-spacing: -.5px; }
        .doc-meta { margin-top: 6px; font-size: 11px; color: var(--soft); line-height: 1.7; }
        .doc-meta b { color: var(--ink); font-weight: 600; }
        .status-pill {
          display: inline-flex; align-items: center; gap: 4px; margin-top: 8px;
          font-size: 9.5px; font-weight: 700; letter-spacing: .5px;
          color: var(--green); background: var(--green-bg);
          border: 1px solid var(--green-line); border-radius: 999px; padding: 4px 10px;
        }

        .rule { border: 0; height: 2px; margin: 16px 0 14px;
          background: linear-gradient(90deg, var(--brand) 0%, var(--brand-tint-2) 65%, transparent 100%); border-radius: 2px; }

        /* ---------- parties ---------- */
        .cols { display: flex; gap: 24px; }
        .col { flex: 1; }
        .label {
          display: flex; align-items: center; gap: 6px;
          font-size: 9.5px; font-weight: 700; letter-spacing: 1px;
          color: var(--brand-deep); text-transform: uppercase; margin-bottom: 6px;
        }
        .label::before { content: ""; width: 10px; height: 2.5px; background: var(--brand); border-radius: 2px; }
        .party-name { font-size: 14px; font-weight: 600; letter-spacing: -.2px; }
        .party-detail { font-size: 11px; color: var(--soft); line-height: 1.7; margin-top: 3px; }

        .project-card {
          background: var(--bg-soft); border: 1px solid var(--line); border-left: 2.5px solid var(--brand);
          border-radius: 8px; padding: 10px 14px; margin-top: 6px;
          font-size: 11px; line-height: 1.8; color: var(--soft);
        }
        .project-card b { color: var(--ink); font-weight: 600; }

        /* ---------- table ---------- */
        table { width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 18px; font-size: 12px;
          border: 1px solid var(--brand-tint-2); border-radius: 10px; overflow: hidden; }
        thead th {
          font-size: 9px; font-weight: 700; letter-spacing: 1px;
          color: var(--brand-deep); text-transform: uppercase; text-align: left; padding: 10px 14px;
          background: var(--brand-tint); border-bottom: 1px solid var(--brand-tint-2);
        }
        thead th:last-child { text-align: right; }
        tbody td { padding: 12px 14px; vertical-align: top; background: #fff; }
        .desc-main { font-weight: 600; font-size: 12.5px; }
        .desc-sub { font-size: 10.5px; color: var(--muted); margin-top: 4px; line-height: 1.6; }
        .method-tag {
          display: inline-block; font-size: 9px; font-weight: 700; letter-spacing: .5px;
          color: var(--brand-deep); background: var(--brand-tint); border: 1px solid var(--brand-tint-2);
          border-radius: 4px; padding: 4px 8px; text-transform: uppercase;
        }
        td.amt { text-align: right; font-weight: 700; font-size: 14px; white-space: nowrap; color: var(--ink); }

        /* ---------- summary ---------- */
        .summary-wrap { display: flex; gap: 24px; margin-top: 18px; align-items: flex-start; }
        .summary-left { flex: 1.15; }
        .words { font-size: 12px; font-weight: 500; color: var(--ink); }
        .notes { font-size: 11px; color: var(--soft); line-height: 1.7; margin-top: 4px; }

        .totals { flex: 1; border: 1px solid var(--brand-tint-2); border-radius: 10px; overflow: hidden; font-size: 11.5px; }
        .totals .row { display: flex; justify-content: space-between; padding: 8px 14px; border-bottom: 1px solid var(--line); color: var(--soft); background: #fff; }
        .totals .row b { color: var(--ink); font-weight: 600; }
        
        /* Amount Received: green = semantic "paid/success" per design system */
        .totals .paid-row { background: linear-gradient(135deg, #15803D 0%, #16A34A 100%); color: #fff; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; }
        .totals .paid-label { font-size: 10px; font-weight: 700; letter-spacing: 1px; color: #BBF7D0; text-transform: uppercase; }
        .totals .paid-amt { font-size: 18px; font-weight: 700; letter-spacing: -.5px; }
        
        .totals .balance-row { display: flex; justify-content: space-between; padding: 10px 14px; font-weight: 600; background: var(--bg-soft); }
        .totals .balance-row .val { color: var(--brand-deep); font-weight: 700; }

        /* ---------- authorization: seal only ---------- */
        .auth-row { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 20px; gap: 20px; }
        .next-due { font-size: 11px; color: var(--soft); line-height: 1.7; max-width: 330px; }
        .next-due b { color: var(--ink); font-weight: 600; }
        .seal-block { text-align: center; }
        .seal { transform: rotate(-5deg); }
        .seal-caption { font-size: 9px; font-weight: 700; letter-spacing: 1px; color: var(--muted); text-transform: uppercase; margin-top: 6px; }
        .seal-caption b { color: var(--ink); font-weight: 700; }

        /* ---------- footer ---------- */
        .footer {
          background: linear-gradient(180deg, var(--brand-tint) 0%, #fff 150%);
          border-top: 1px solid var(--brand-tint-2); padding: 14px 36px 16px; text-align: center;
        }
        .footer .thanks { font-size: 12.5px; font-weight: 600; color: var(--ink); letter-spacing: -.2px; }
        .footer .thanks span { color: var(--brand-deep); }
        .footer .contact { font-size: 10.5px; color: var(--soft); margin-top: 4px; line-height: 1.6; }
        .footer .fine { font-size: 9.5px; color: var(--muted); margin-top: 6px; }
      ` }} />

      <div className="frame">
        <div className="page">
          <div className="inner">

            {/* Header */}
            <div className="header">
              <div>
                <div className="logo-row">
                  {/* Exact system logo brand lockup image */}
                  <img src="/brand/logo.png" alt="Orvyn Labs" style={{ height: '40px', width: 'auto', display: 'block' }} />
                </div>
                <div className="company-meta">
                  Orvyn Labs Partnership<br />
                  Calicut, Kerala, India &ndash; 673014<br />
                  +91 85905 51991 &nbsp;&middot;&nbsp; +91 90721 90088<br />
                  <a href="https://www.orvynlabs.in">www.orvynlabs.in</a> &nbsp;&middot;&nbsp; hello@orvynlabs.in
                </div>
              </div>
              <div className="doc-block">
                <div className="doc-title">Payment Receipt</div>
                <div className="doc-no">{receiptNo}</div>
                <div className="doc-meta">
                  Receipt Date: <b>{receiptDateStr}</b><br />
                  Payment Received On: <b>{paidAtDateStr}</b>
                </div>
                <div className="status-pill">&#10003;&nbsp; PAYMENT RECEIVED &amp; CONFIRMED</div>
              </div>
            </div>

            <hr className="rule" />

            {/* Parties */}
            <div className="cols">
              <div className="col">
                <div className="label">Received From</div>
                <div className="party-name">{payment.client.name}</div>
                <div className="party-detail">
                  {payment.client.contactName && <>Attn: {payment.client.contactName}<br /></>}
                  {payment.client.email && <>{payment.client.email}<br /></>}
                  {payment.client.phone && <>{payment.client.phone}<br /></>}
                  {payment.client.gstin && <>GSTIN: {payment.client.gstin}</>}
                </div>
              </div>
              <div className="col">
                <div className="label">Project Details</div>
                <div className="party-name">{payment.project.name}</div>
                <div className="project-card">
                  Project Status: <b style={{ textTransform: 'capitalize' }}>{payment.project.status.replace(/_/g, ' ').toLowerCase()}</b><br />
                  Total Project Value: <b>{formatCurrency(totalProjectValue)}</b>
                </div>
              </div>
            </div>

            {/* Line item */}
            <table>
              <thead>
                <tr>
                  <th style={{ width: '48%' }}>Description</th>
                  <th style={{ width: '26%' }}>Payment Method</th>
                  <th style={{ width: '26%' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div className="desc-main">Project Payment Installment</div>
                    <div className="desc-sub">
                      Reference Code: {payment.reference || 'N/A'}
                    </div>
                  </td>
                  <td><span className="method-tag">{formatPaymentMethod(payment.method)}</span></td>
                  <td className="amt">{formatCurrency(amountReceived)}</td>
                </tr>
              </tbody>
            </table>

            {/* Summary */}
            <div className="summary-wrap">
              <div className="summary-left">
                <div className="label">Amount in Words</div>
                <div className="words">{amountWords}</div>
                {payment.notes && (
                  <>
                    <div className="label" style={{ marginTop: '16px' }}>Remarks / Notes</div>
                    <div className="notes">{payment.notes}</div>
                  </>
                )}
              </div>
              <div className="totals">
                <div className="row"><span>Total Project Value</span><b>{formatCurrency(totalProjectValue)}</b></div>
                <div className="row"><span>Previously Paid</span><b>{formatCurrency(previouslyPaid)}</b></div>
                <div className="paid-row">
                  <span className="paid-label">Amount Received</span>
                  <span className="paid-amt">{formatCurrency(amountReceived)}</span>
                </div>
                <div className="balance-row"><span>Balance Due</span><span className="val">{formatCurrency(balanceDue)}</span></div>
              </div>
            </div>

            {/* Authorization: premium seal */}
            <div className="auth-row">
              <div className="next-due">
                This is a digitally verified receipt issued by <b>Orvyn Labs Partnership</b> on receipt of corresponding payment milestones.
              </div>
              <div className="seal-block">
                <svg className="seal" width="132" height="132" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Orvyn Labs official verified seal">
                  <defs>
                    <path id="arcTop" d="M 22,70 A 48,48 0 0,1 118,70" />
                    <path id="arcBottom" d="M 118,70 A 48,48 0 0,1 22,70" />
                  </defs>
                  {/* rings */}
                  <circle cx="70" cy="70" r="66" fill="none" stroke="#F1441E" strokeWidth="2"/>
                  <circle cx="70" cy="70" r="60" fill="none" stroke="#F1441E" strokeWidth="0.8" strokeDasharray="3 2"/>
                  <circle cx="70" cy="70" r="41" fill="none" stroke="#F1441E" strokeWidth="1"/>
                  {/* top text: ORVYN LABS */}
                  <text fill="#F1441E" fontFamily="Manrope, 'Segoe UI', sans-serif" fontSize="10" fontWeight="700" letterSpacing="2.5">
                    <textPath href="#arcTop" startOffset="50%" textAnchor="middle">ORVYN LABS</textPath>
                  </text>
                  {/* bottom text: OFFICIAL VERIFIED */}
                  <text fill="#F1441E" fontFamily="Manrope, 'Segoe UI', sans-serif" fontSize="8.5" fontWeight="600" letterSpacing="3">
                    <textPath href="#arcBottom" startOffset="50%" textAnchor="middle">OFFICIAL • VERIFIED</textPath>
                  </text>
                  {/* side elements */}
                  <circle cx="18" cy="70" r="2" fill="#F1441E" />
                  <circle cx="122" cy="70" r="2" fill="#F1441E" />
                  {/* center Orvyn Labs logo icon */}
                  <image href="/brand/favicon-48.png" x="53" y="53" height="34" width="34" />
                </svg>
                <div className="seal-caption">Authorized by <b>Orvyn Labs Partnership</b></div>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="footer">
            <div className="thanks">Thank you for partnering with <span>Orvyn Labs</span> &mdash; we're excited to build with you.</div>
            <div className="contact">
              Questions about this receipt? Reach us at hello@orvynlabs.in or +91 85905 51991, quoting receipt no. {receiptNo}.
            </div>
            <div className="fine">Digitally issued and sealed by Orvyn Labs Partnership &middot; Valid without a handwritten signature &middot; www.orvynlabs.in</div>
          </div>
        </div>
      </div>
    </>
  );
}

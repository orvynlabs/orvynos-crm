import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/db';
import { uploadToStorage, getFromStorage } from '../../../../../lib/r2';
import { generatePdfFromHtml } from '../../../../../lib/pdf';
import ReceiptPrintPage from '../../../../receipts/[id]/page';
import React from 'react';
import fs from 'fs';
import path from 'path';

// Establish React in global context for dynamic JS/JSX element builds in dev mode
(global as any).React = React;

// Never cache this route at the framework level — freshness is decided below
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Bump this number whenever the receipt template design changes.
// It automatically invalidates every previously cached PDF (disk + R2).
const TEMPLATE_VERSION = 2;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("DOWNLOAD ROUTE HIT");
  console.log("URL:", request.url);
  console.log("Headers:", Object.fromEntries(request.headers));

  try {
    const { id } = await params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        client: true,
        project: true,
      },
    });

    if (!payment) {
      return new NextResponse('Payment record not found', { status: 404 });
    }

    // Clean, professional filename shown to the user when saving
    const clientNameClean = payment.client.name.replace(/[^a-zA-Z0-9]/g, '_');
    const receiptNoClean = (payment.receiptNumber || `rcpt-${id.substring(0, 8)}`).toLowerCase();
    const receiptFilename = `receipt-${clientNameClean}-${receiptNoClean}.pdf`;

    // Internal cache key: bound to template version AND the payment's last update time.
    // If the payment is edited or the template design changes, the key changes and
    // the old PDF can never be served again.
    const cacheStamp = `v${TEMPLATE_VERSION}-${payment.updatedAt.getTime()}`;
    const cacheFilename = `receipt-${receiptNoClean}-${cacheStamp}.pdf`;
    const localDir = path.join(process.cwd(), 'public/receipts');
    const localPath = path.join(localDir, cacheFilename);
    const storageKey = `receipts/${cacheFilename}`;

    const pdfHeaders = (len: number) => ({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${receiptFilename}"`,
      'Content-Length': len.toString(),
      // Browser/proxy must never cache — freshness is fully decided server-side
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
      'Access-Control-Expose-Headers': 'Content-Disposition',
    });

    // 1. Local filesystem cache — only ever hits when data + template are unchanged
    if (fs.existsSync(localPath)) {
      try {
        const pdfBuffer = fs.readFileSync(localPath);
        console.log(`[Receipt Download] Serving from local disk cache: ${localPath}`);
        return new NextResponse(new Uint8Array(pdfBuffer), { status: 200, headers: pdfHeaders(pdfBuffer.length) });
      } catch (e) {
        console.warn(`[Receipt Download] Local read failed, falling back:`, e);
      }
    }

    // 2. R2/storage cache — only trusted if it points at the CURRENT cache key
    if (payment.receiptKey === storageKey) {
      try {
        const pdfBuffer = await getFromStorage(payment.receiptKey);

        // Write to local disk cache for future downloads
        fs.mkdirSync(localDir, { recursive: true });
        fs.writeFileSync(localPath, pdfBuffer);

        return new NextResponse(new Uint8Array(pdfBuffer), { status: 200, headers: pdfHeaders(pdfBuffer.length) });
      } catch (e) {
        // Cached file missing from storage — regenerate below
        console.warn(`[Receipt Download] Cached file missing from storage, regenerating: ${payment.receiptKey}`);
      }
    }

    console.log(`[Receipt Download] Generating PDF via direct Server Rendering for ID: ${id}`);
    
    // Render the React Server Component directly to dynamic HTML markup
    const jsx = await ReceiptPrintPage({ params: Promise.resolve({ id }) });
    const { renderToString } = await import('react-dom/server');
    let html = renderToString(jsx);

    // Load and inline local logo assets as base64. Uses replaceAll to replace BOTH preload and image tags.
    try {
      const logoPath = path.join(process.cwd(), 'public/brand/logo.png');
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        const logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
        html = html.replaceAll('/brand/logo.png', logoBase64);
      }
      
      const faviconPath = path.join(process.cwd(), 'public/brand/favicon-48.png');
      if (fs.existsSync(faviconPath)) {
        const faviconBuffer = fs.readFileSync(faviconPath);
        const faviconBase64 = `data:image/png;base64,${faviconBuffer.toString('base64')}`;
        html = html.replaceAll('/brand/favicon-48.png', faviconBase64);
      }
    } catch (e) {
      console.warn('[Receipt Download] Base64 inline failed:', e);
    }

    // Prepend Google Fonts @import directly into styles to ensure fonts load
    html = html.replace(
      ':root {',
      `@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap'); :root {`
    );

    // Generate the PDF directly from the HTML content
    const pdfBuffer = await generatePdfFromHtml(html);

    // Save to local disk cache and purge stale variants of this receipt
    try {
      fs.mkdirSync(localDir, { recursive: true });
      // Remove any older cached PDFs for this same receipt number (old versions/timestamps)
      for (const f of fs.readdirSync(localDir)) {
        if (f.includes(receiptNoClean) && f !== cacheFilename && f.endsWith('.pdf')) {
          try { fs.unlinkSync(path.join(localDir, f)); } catch { /* best-effort */ }
        }
      }
      fs.writeFileSync(localPath, pdfBuffer);
      console.log(`[Receipt Download] Saved fresh PDF to local cache: ${localPath}`);
    } catch (e) {
      console.warn('[Receipt Download] Failed to save local cache file:', e);
    }

    // Upload to storage in the background (don't block the response)
    uploadToStorage(storageKey, pdfBuffer, 'application/pdf')
      .then(() => {
        return prisma.payment.update({
          where: { id },
          data: { receiptKey: storageKey },
        });
      })
      .then(() => console.log(`[Receipt Download] Cached to: ${storageKey}`))
      .catch((err) => console.error('[Receipt Download] Background cache failed:', err));
    
    console.log({
      bufferLength: pdfBuffer.length,
      firstBytes: pdfBuffer.subarray(0, 20).toString("hex"),
      isBuffer: Buffer.isBuffer(pdfBuffer)
    });

    // Return the PDF immediately
    return new NextResponse(new Uint8Array(pdfBuffer), { status: 200, headers: pdfHeaders(pdfBuffer.length) });
  } catch (error: any) {
    console.error('[Receipt Download Error]', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to download receipt', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

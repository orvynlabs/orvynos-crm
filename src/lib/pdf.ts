import fs from 'fs';
import path from 'path';

// Types for the generic pipeline
export type PdfDocumentType = 'PROPOSAL' | 'INVOICE' | 'AGREEMENT' | 'QUOTATION' | 'RECEIPT';

export interface GenerateDocumentParams {
  /** Raw HTML string to render as PDF */
  html: string;
  /** Storage key prefix, e.g. 'proposals', 'invoices' */
  storagePrefix: string;
  /** Filename used for the storage key, e.g. 'proposal-PROP-2026-0001' */
  fileBaseName: string;
  /** Document type for the Document record */
  documentType: PdfDocumentType;
  /** Human-readable document name */
  documentName: string;
  /** Client ID to link */
  clientId?: string;
  /** Project ID to link */
  projectId?: string;
  /** User ID who generated the doc */
  userId?: string;
}

export interface GenerateDocumentResult {
  pdfBuffer: Buffer;
  storageKey: string;
  documentId: string;
}

let cachedLogoBase64: string | null = null;
let cachedLogo2Base64: string | null = null;
let cachedFaviconBase64: string | null = null;

/**
 * Injects brand assets (logo, favicon, fonts) into HTML for PDF rendering.
 * Converts local image paths to base64 data URIs and prepends Google Fonts.
 */
export function injectBrandAssets(html: string): string {
  let result = html;

  // Inline logo assets as base64 with in-memory caching
  try {
    if (cachedLogoBase64 === null) {
      const logoPath = path.join(process.cwd(), 'public/brand/document-logo.png');
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        cachedLogoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
      } else {
        cachedLogoBase64 = '';
      }
    }
    if (cachedLogoBase64) {
      result = result.replaceAll('/brand/document-logo.png', cachedLogoBase64);
    }

    if (cachedLogo2Base64 === null) {
      const logo2Path = path.join(process.cwd(), 'public/brand/logo.png');
      if (fs.existsSync(logo2Path)) {
        const logoBuffer = fs.readFileSync(logo2Path);
        cachedLogo2Base64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
      } else {
        cachedLogo2Base64 = '';
      }
    }
    if (cachedLogo2Base64) {
      result = result.replaceAll('/brand/logo.png', cachedLogo2Base64);
    }

    if (cachedFaviconBase64 === null) {
      const faviconPath = path.join(process.cwd(), 'public/brand/favicon-48.png');
      if (fs.existsSync(faviconPath)) {
        const faviconBuffer = fs.readFileSync(faviconPath);
        cachedFaviconBase64 = `data:image/png;base64,${faviconBuffer.toString('base64')}`;
      } else {
        cachedFaviconBase64 = '';
      }
    }
    if (cachedFaviconBase64) {
      result = result.replaceAll('/brand/favicon-48.png', cachedFaviconBase64);
    }
  } catch (e) {
    console.warn('[PDF Pipeline] Base64 inline failed:', e);
  }

  // Inject Manrope font
  if (!result.includes('fonts.googleapis.com')) {
    result = result.replace(
      '<style',
      `<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" /><style`
    );
  }

  return result;
}

let browserInstance: any = null;

async function getBrowser() {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }

  const isVercelServerless = Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.AWS_EXECUTION_ENV
  );

  if (isVercelServerless) {
    console.log('[PDF Generator] Launching Chromium via @sparticuz/chromium for Vercel Serverless...');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const chromium = require('@sparticuz/chromium');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const playwright = require('playwright-core');

    const executablePath = await chromium.executablePath();
    browserInstance = await playwright.chromium.launch({
      args: chromium.args,
      executablePath: executablePath,
      headless: true,
    });
    return browserInstance;
  }

  // Local development environment fallback
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const playwright = require('playwright');
    const userHome = process.env.USERPROFILE || 'C:\\Users\\muham';
    const msPlaywrightDir = path.join(userHome, 'AppData', 'Local', 'ms-playwright');
    let customExecPath: string | undefined;

    if (fs.existsSync(msPlaywrightDir)) {
      const entries = fs.readdirSync(msPlaywrightDir);
      for (const entry of entries) {
        if (entry.startsWith('chromium-')) {
          const p = path.join(msPlaywrightDir, entry, 'chrome-win64', 'chrome.exe');
          if (fs.existsSync(p)) {
            customExecPath = p;
            break;
          }
        }
      }
    }

    console.log('[PDF Generator] Launching local Chromium with exec path:', customExecPath || 'default');

    browserInstance = await playwright.chromium.launch({
      headless: true,
      ...(customExecPath ? { executablePath: customExecPath } : {}),
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    });
    return browserInstance;
  } catch (err) {
    console.error('[PDF Generator] Local browser launch error, trying sparticuz fallback...', err);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const chromium = require('@sparticuz/chromium');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const playwright = require('playwright-core');

    const executablePath = await chromium.executablePath();
    browserInstance = await playwright.chromium.launch({
      args: chromium.args,
      executablePath: executablePath,
      headless: true,
    });
    return browserInstance;
  }
}

/**
 * Generic one-call pipeline: HTML → PDF → Storage → Document record.
 * Used by all generators (Proposal, Invoice, Agreement, Quotation).
 */
export async function generateAndSaveDocument(
  params: GenerateDocumentParams
): Promise<GenerateDocumentResult> {
  const { html, storagePrefix, fileBaseName, documentType, documentName, clientId, projectId, userId } = params;

  // 1. Inject brand assets into the HTML
  const brandedHtml = injectBrandAssets(html);

  // 2. Determine single-page strict constraint
  const isSinglePage = documentType === 'INVOICE' || documentType === 'RECEIPT';

  // 3. Generate PDF buffer
  const pdfBuffer = await generatePdfFromHtml(brandedHtml, isSinglePage ? { pageRanges: '1' } : undefined);

  // 4. Upload to storage
  const storageKey = `${storagePrefix}/${fileBaseName}.pdf`;
  const { uploadToStorage } = await import('./r2');
  await uploadToStorage(storageKey, pdfBuffer, 'application/pdf');

  // 5. Create Document record in the DB
  const { prisma } = await import('./db');
  const document = await prisma.document.create({
    data: {
      name: documentName,
      type: documentType,
      r2Key: storageKey,
      mimeType: 'application/pdf',
      size: pdfBuffer.length,
      clientId: clientId || null,
      projectId: projectId || null,
      uploadedById: userId || null,
    },
  });

  console.log(`[PDF Pipeline] Generated ${documentType}: ${storageKey} (${pdfBuffer.length} bytes), Document ID: ${document.id}`);

  return {
    pdfBuffer,
    storageKey,
    documentId: document.id,
  };
}

/**
 * Generates an A4 PDF buffer directly from raw HTML content.
 */
export async function generatePdfFromHtml(
  htmlContent: string,
  options?: { pageRanges?: string }
): Promise<Buffer> {
  console.log(`[PDF Generator] Rendering PDF directly from HTML content...`);
  const startMs = Date.now();

  const browser = await getBrowser();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Inject the HTML directly with fast domcontentloaded strategy
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded', timeout: 10000 });

    // Wait for webfonts with a 1.5s max timeout to prevent hangs
    await Promise.race([
      page.evaluate(() => (document as { fonts?: { ready: Promise<unknown> } }).fonts?.ready),
      new Promise((r) => setTimeout(r, 1500)),
    ]).catch(() => {});

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '0mm',
        bottom: '0mm',
        left: '0mm',
        right: '0mm',
      },
      printBackground: true,
      preferCSSPageSize: true,
      ...(options?.pageRanges ? { pageRanges: options.pageRanges } : {}),
    });

    console.log(`[PDF Generator] HTML-to-PDF generation completed in ${Date.now() - startMs}ms (${pdfBuffer.length} bytes)`);
    return pdfBuffer;
  } finally {
    await context.close();
  }
}

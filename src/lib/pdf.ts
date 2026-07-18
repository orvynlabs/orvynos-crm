import { chromium } from 'playwright';

// Reuse a single browser instance across requests to avoid cold-start overhead
let browserInstance: Awaited<ReturnType<typeof chromium.launch>> | null = null;

async function getBrowser() {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await chromium.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    });
  }
  return browserInstance;
}

/**
 * Generates an A4 PDF buffer directly from raw HTML content.
 * This completely avoids local HTTP requests and concurrent deadlocks in Next.js development mode.
 */
export async function generatePdfFromHtml(htmlContent: string): Promise<Buffer> {
  console.log(`[PDF Generator] Rendering PDF directly from HTML content...`);
  const startMs = Date.now();
  
  const browser = await getBrowser();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Inject the HTML directly
    await page.setContent(htmlContent, { waitUntil: 'load', timeout: 15000 });

    // Wait for webfonts to actually finish loading (faster + more reliable than a fixed sleep)
    await page.evaluate(() => (document as { fonts?: { ready: Promise<unknown> } }).fonts?.ready).catch(() => {});
    await page.waitForTimeout(100);
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '0mm',
        bottom: '0mm',
        left: '0mm',
        right: '0mm',
      },
      printBackground: true,
    });
    
    console.log(`[PDF Generator] HTML-to-PDF generation completed in ${Date.now() - startMs}ms (${pdfBuffer.length} bytes)`);
    return pdfBuffer;
  } finally {
    await context.close();
  }
}

/**
 * Renders a URL using a persistent Playwright browser instance
 * and returns the generated A4 PDF Buffer.
 */
export async function generatePdfFromUrl(url: string): Promise<Buffer> {
  console.log(`[PDF Generator] Rendering: ${url}`);
  const startMs = Date.now();
  
  const browser = await getBrowser();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Use 'load' to wait for all images and fonts to finish loading
    await page.goto(url, { waitUntil: 'load', timeout: 15000 });

    // Wait for webfonts to actually finish loading (faster + more reliable than a fixed sleep)
    await page.evaluate(() => (document as { fonts?: { ready: Promise<unknown> } }).fonts?.ready).catch(() => {});
    await page.waitForTimeout(100);
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '0mm',
        bottom: '0mm',
        left: '0mm',
        right: '0mm',
      },
      printBackground: true,
    });
    
    console.log(`[PDF Generator] Done in ${Date.now() - startMs}ms (${pdfBuffer.length} bytes)`);
    return pdfBuffer;
  } finally {
    await context.close();
  }
}

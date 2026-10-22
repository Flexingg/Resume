// Renders every resume in resumes/manifest.js to a one-page US Letter PDF.
// Usage: node scripts/build-pdfs.mjs [outDir]   (default: _site/pdf)
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.resolve(root, process.argv[2] || '_site/pdf');
fs.mkdirSync(outDir, { recursive: true });
const pageUrl = pathToFileURL(path.join(root, 'index.html')).href;

const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const page = await browser.newPage({ viewport: { width: 1280, height: 1200 } });
const ready = () => page.waitForFunction(() => window.__resumeReady || window.__resumeError, null, { timeout: 30000 });

await page.goto(pageUrl);
await ready();
const ids = await page.evaluate(() => window.RESUME_MANIFEST.resumes);

let problems = 0;
const built = [];
for (const id of ids) {
  await page.goto(`${pageUrl}?r=${encodeURIComponent(id)}`);
  await ready();
  const err = await page.evaluate(() => window.__resumeError);
  if (err) { console.error(`✖ ${id}: ${err}`); problems++; continue; }
  const info = await page.evaluate(() => window.__resumeInfo);
  const file = path.join(outDir, `${info.pdfName}.pdf`);
  await page.pdf({ path: file, format: 'Letter', printBackground: true, preferCSSPageSize: true });
  built.push({ id, file: `${info.pdfName}.pdf` });
  console.log(`✔ ${id} → ${path.relative(root, file)}${info.scale < 1 ? ` (text at ${Math.round(info.scale * 100)}%)` : ''}`);
  if (info.overflow) { console.warn(`⚠ ${id} overflows one page — trim content`); problems++; }
}
fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(built, null, 2));
await browser.close();
if (problems && process.env.STRICT) process.exit(1);

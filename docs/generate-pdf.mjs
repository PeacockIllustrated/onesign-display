import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath = resolve(__dirname, 'onesign-display-brochure.html');
const pdfPath = resolve(__dirname, 'Onesign-Display-Product-Overview.pdf');

console.log('Launching browser...');
const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();

console.log('Loading brochure HTML...');
await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, {
  waitUntil: 'networkidle0',
  timeout: 30000
});

// Wait for web fonts to load
console.log('Waiting for fonts...');
await page.evaluateHandle('document.fonts.ready');

// Small extra delay for font rendering
await new Promise(r => setTimeout(r, 1000));

console.log('Generating PDF...');
await page.pdf({
  path: pdfPath,
  format: 'A4',
  printBackground: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  preferCSSPageSize: true
});

await browser.close();
console.log(`PDF generated: ${pdfPath}`);

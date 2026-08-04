// Renders a brochure HTML file to A4 PDF.
//
//   node docs/render-pdf.mjs <input.html> <output.pdf>
//
// Uses the Chromium that ships with this environment via Playwright. Fonts are
// inlined as data URIs by build-fonts.mjs, so nothing is fetched at render time
// and the output is byte-stable.

import { chromium } from 'playwright'
import { fileURLToPath, pathToFileURL } from 'url'
import { dirname, resolve } from 'path'
import { existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

const [inputArg, outputArg] = process.argv.slice(2)
if (!inputArg || !outputArg) {
  console.error('usage: node docs/render-pdf.mjs <input.html> <output.pdf>')
  process.exit(1)
}

const htmlPath = resolve(process.cwd(), inputArg)
const pdfPath = resolve(process.cwd(), outputArg)

if (!existsSync(htmlPath)) {
  console.error(`No such file: ${htmlPath}`)
  process.exit(1)
}

if (!existsSync(resolve(__dirname, 'fonts.css'))) {
  console.error('docs/fonts.css is missing — run `node docs/build-fonts.mjs` first.')
  process.exit(1)
}

const browser = await chromium.launch()
const page = await browser.newPage()

// Surface anything that fails to load rather than silently shipping a PDF with
// a missing logo or a fallback typeface.
const failures = []
page.on('requestfailed', r => failures.push(`${r.failure()?.errorText} ${r.url()}`))
page.on('response', r => {
  if (r.status() >= 400) failures.push(`HTTP ${r.status()} ${r.url()}`)
})

console.log(`Loading ${htmlPath}`)
await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle', timeout: 60_000 })
await page.evaluate(() => document.fonts.ready)

// Confirm the brand face actually resolved — a silent fallback to a system sans
// is the exact failure this pipeline exists to prevent.
const gilroyLoaded = await page.evaluate(() => document.fonts.check("700 12pt 'Gilroy-Bold'"))
if (!gilroyLoaded) {
  console.error('Gilroy-Bold did not load — aborting rather than shipping fallback type.')
  await browser.close()
  process.exit(1)
}

if (failures.length) {
  console.error('Asset load failures:')
  for (const f of failures) console.error(`  ${f}`)
  await browser.close()
  process.exit(1)
}

const pageCount = await page.locator('.page').count()
console.log(`Rendering ${pageCount} pages...`)

await page.pdf({
  path: pdfPath,
  format: 'A4',
  printBackground: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  preferCSSPageSize: true,
})

await browser.close()
console.log(`Wrote ${pdfPath}`)

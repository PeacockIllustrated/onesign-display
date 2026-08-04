// Dev helper: screenshot each .page and report any that overflow its sheet.
// A4 pages silently spill past the footer when type is rescaled, and that is
// invisible in the HTML — it only shows up in the PDF. Measure instead.
import { chromium } from 'playwright'
import { pathToFileURL } from 'url'

const [src, out] = process.argv.slice(2)
const b = await chromium.launch()
const p = await b.newPage({ viewportSize: { width: 900, height: 1300 }, deviceScaleFactor: 2 })
await p.goto(pathToFileURL(src).href, { waitUntil: 'networkidle' })
await p.evaluate(() => document.fonts.ready)

const report = await p.evaluate(() =>
  [...document.querySelectorAll('.page')].map((page, i) => {
    const pageBox = page.getBoundingClientRect()
    const content = page.querySelector('.content') ?? page
    const footer = page.querySelector('.pg-footer')

    // An element inside an overflow:hidden ancestor is visually clipped, so it
    // cannot spill onto the sheet no matter what its box says. The cover's
    // decorative rings sit deliberately past the page edge and would otherwise
    // report a permanent false overflow.
    // Stop at .page — the sheet's own overflow:hidden is what we are measuring
    // against, so counting it would mark every element clipped.
    const isClipped = el => {
      for (let a = el.parentElement; a && a !== page; a = a.parentElement) {
        const o = getComputedStyle(a)
        if (o.overflow === 'hidden' || o.overflowY === 'hidden') return true
      }
      return false
    }

    // Deepest unclipped descendant bottom, relative to the page top.
    let lowest = 0
    for (const el of content.querySelectorAll('*')) {
      const r = el.getBoundingClientRect()
      if (r.height > 0 && !isClipped(el)) lowest = Math.max(lowest, r.bottom - pageBox.top)
    }

    const limit = footer
      ? footer.getBoundingClientRect().top - pageBox.top
      : pageBox.height

    return {
      page: i + 1,
      overflowMm: +(((lowest - limit) / pageBox.height) * 297).toFixed(1),
      fillPct: Math.round((lowest / pageBox.height) * 100),
    }
  })
)

for (let i = 0; i < report.length; i++) {
  await p.locator('.page').nth(i).screenshot({ path: `${out}/page-${i + 1}.png` })
}

for (const r of report) {
  const flag = r.overflowMm > 0 ? `  ** OVERFLOWS by ${r.overflowMm}mm **` : ''
  console.log(`page ${String(r.page).padStart(2)}  fill ${String(r.fillPct).padStart(3)}%${flag}`)
}

await b.close()

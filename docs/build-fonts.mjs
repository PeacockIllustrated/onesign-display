// Builds a self-contained @font-face CSS block for the brochure.
//
// Gilroy is the Onesign brand face but its CDN (fonts.cdnfonts.com) is not
// reliably reachable, so headings silently fell back to DM Sans. We ship the
// licensed TTFs from public/fonts instead and inline them as data URIs, which
// also makes the brochure HTML portable — it renders identically offline.

import { readFile, writeFile } from 'fs/promises'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const GILROY = [
  { file: 'Gilroy-Light.ttf', weight: 300 },
  { file: 'Gilroy-Regular.ttf', weight: 400 },
  { file: 'Gilroy-Medium.ttf', weight: 500 },
  { file: 'Gilroy-Bold.ttf', weight: 700 },
  { file: 'Gilroy-Heavy.ttf', weight: 800 },
]

const parts = []

for (const { file, weight } of GILROY) {
  const buf = await readFile(resolve(root, 'public/fonts', file))
  const b64 = buf.toString('base64')
  parts.push(
    `@font-face{font-family:'Gilroy';font-style:normal;font-weight:${weight};` +
      `src:url(data:font/ttf;base64,${b64}) format('truetype');font-display:block}`
  )
}

// The design system addresses the bold cut directly as 'Gilroy-Bold'.
const boldBuf = await readFile(resolve(root, 'public/fonts/Gilroy-Bold.ttf'))
parts.push(
  `@font-face{font-family:'Gilroy-Bold';font-style:normal;font-weight:400;` +
    `src:url(data:font/ttf;base64,${boldBuf.toString('base64')}) format('truetype');font-display:block}`
)

// DM Sans carries the body copy. Google Fonts is reachable, so pull the woff2
// files once at build time and inline them rather than leaving a runtime
// dependency in the document.
const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'

const cssRes = await fetch(
  'https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap',
  { headers: { 'User-Agent': UA } }
)
if (!cssRes.ok) throw new Error(`DM Sans CSS fetch failed: ${cssRes.status}`)
let dmCss = await cssRes.text()

// Inline every remote src the stylesheet points at.
const urls = [...new Set(dmCss.match(/https:\/\/fonts\.gstatic\.com\/[^)]+/g) ?? [])]
console.log(`Inlining ${urls.length} DM Sans font files...`)

for (const url of urls) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`font fetch failed ${res.status}: ${url}`)
  const b64 = Buffer.from(await res.arrayBuffer()).toString('base64')
  dmCss = dmCss.split(url).join(`data:font/woff2;base64,${b64}`)
}

if (/https:\/\//.test(dmCss)) throw new Error('DM Sans CSS still references a remote URL')

parts.push(dmCss)

const out = parts.join('\n')
await writeFile(resolve(__dirname, 'fonts.css'), out)
console.log(`Wrote docs/fonts.css (${(out.length / 1024 / 1024).toFixed(2)} MB)`)

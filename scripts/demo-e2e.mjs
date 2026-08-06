// End-to-end proof of the /demo in-situ simulator, in real Chromium.
//
// Walks the full provisioning journey (mount -> power -> NO SIGNAL -> insert
// USB -> boot -> pairing code -> pair from phone -> menu live), then
// quick-starts the preset room and exercises the reliability beats: synced
// wall, power-cut rejoin on the correct frame, a phone price edit propagating
// through the real renderMenu() pipeline, and a venue-wifi cut with cached
// playback continuing under OFFLINE badges.
//
// Not wired into npm scripts because playwright-core is not a project
// dependency. To run:
//   npm i --no-save playwright-core
//   npm run build && npx next start -p 3113
//   SP=/tmp node scripts/demo-e2e.mjs
//
// BASE overrides the server URL; SP is where screenshots land.
import { chromium } from 'playwright-core'

const SP = process.env.SP
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const page = await b.newPage({ viewport: { width: 1600, height: 950 } })
const logs = []
page.on('console', (m) => { if (m.type() === 'error') logs.push(m.text()) })
page.on('pageerror', (e) => logs.push(String(e)))

await page.goto((process.env.BASE ?? 'http://localhost:3113') + '/demo', { waitUntil: 'networkidle' })
await page.waitForTimeout(5200) // marketing splash in root layout

// ── Manual journey ──────────────────────────────────────────
// 1. Edit mode → mount a screen
await page.getByRole('button', { name: 'Edit layout' }).click()
await page.getByRole('button', { name: '+ Mount a screen' }).click()
await page.getByRole('button', { name: 'Done editing' }).click()
console.log('mounted: 1 screen')

// 2. Hover it → power on
const screen = page.locator('div.group').first()
await screen.hover()
await page.getByRole('button', { name: /Power on/ }).click()
await screen.hover()
console.log('powered on; OSD:', (await screen.innerText()).replace(/\n/g, ' | ').slice(0, 80))

// 3. Insert USB → boot → pairing code appears
await page.getByRole('button', { name: /Insert Onesign USB/ }).click()
await page.waitForTimeout(2600) // boot splash
const tvText = await screen.innerText()
const code = (tvText.match(/[A-Z2-9]{3}-[A-Z2-9]{3}/) || [])[0]
console.log('pairing code on TV:', code ?? `NOT FOUND in: ${tvText.slice(0, 120)}`)
await page.screenshot({ path: `${SP}/demo-1-pairing.png` })

// 4. Phone: pair it
await page.getByRole('button', { name: '+ Pair a screen' }).click()
await page.getByPlaceholder('Code shown on the TV').fill(code)
await page.getByPlaceholder(/Screen name/).fill('Counter Screen')
await page.locator('select').first().selectOption('set-counter')
await page.getByRole('button', { name: 'Pair', exact: true }).click()
await page.waitForTimeout(800)
console.log('paired; TV now:', (await screen.innerText()).replace(/\n/g, ' | ').slice(0, 90))

// 5. Assign the panuozzi menu from the phone
await page.getByRole('button', { name: /Counter Screen/ }).first().click()
await page.getByRole('button', { name: 'Signature Panuozzi' }).click()
await page.waitForTimeout(2500) // render fetch + manifest latency
const iframeCount = await screen.locator('iframe').count()
console.log('menu iframe on TV:', iframeCount === 1 ? 'YES' : `NO (${iframeCount})`)
await page.screenshot({ path: `${SP}/demo-2-live.png` })

// ── Reset → Quick start → full room ─────────────────────────
page.on('dialog', (d) => d.accept())
await page.getByRole('button', { name: 'Reset', exact: true }).click()
await page.waitForTimeout(400)
await page.getByRole('button', { name: 'Quick start' }).click()
await page.waitForTimeout(4000) // menus render + manifests fetch + slides up
const iframes = await page.locator('iframe').count()
const imgs = await page.locator('img[src^="data:image/svg"]').count()
console.log(`quick start: ${iframes} menu iframe(s), ${imgs} playlist slide img(s) across the wall`)

// Presence is not health: a malformed SVG data URI still counts as an <img>
// but never decodes. Every visible slide must have real pixels.
const decoded = await page.evaluate(() =>
    [...document.querySelectorAll('img[src^="data:image/svg"]')].map((i) => i.naturalWidth),
)
console.log(
    'all visible slides decode:',
    decoded.length > 0 && decoded.every((w) => w > 0),
    `(naturalWidths: ${decoded.join(',')})`,
)

// ── THE KILLER BEAT: power-cut a synced screen, watch it rejoin ──
const wall = page.locator('div.group')
const slideSrc = async (i) => wall.nth(i).locator('img').first().getAttribute('src')

const beforeA = await slideSrc(0)
const beforeB = await slideSrc(1)
console.log('wall synced before cut:', beforeA === beforeB)

await wall.nth(2).hover()
await wall.nth(2).getByRole('button', { name: /Power off/ }).click()
await page.waitForTimeout(2500) // dark mid-cycle; neighbours advance
await wall.nth(2).hover()
await wall.nth(2).getByRole('button', { name: /Power on/ }).click()
await page.waitForTimeout(2600 + 1600) // boot + manifest fetch

let rejoined = false
for (let t = 0; t < 20; t++) {
    const [a, c] = await Promise.all([slideSrc(0), slideSrc(2)])
    if (a && a === c) { rejoined = true; break }
    await page.waitForTimeout(250)
}
console.log('power-cycled screen rejoined on the correct frame:', rejoined)

// ── Price edit on the phone → real render → counter screen ──
await page.getByRole('button', { name: 'Content' }).click()
await page.getByRole('button', { name: /Signature Panuozzi/ }).click()
const firstPrice = page.locator('input[type="number"]').first()
await firstPrice.fill('9.99')
await page.getByRole('button', { name: 'Save & publish' }).click()
await page.getByText('✓ Saved — pushed to screens').waitFor({ timeout: 10_000 })
let priceShown = false
for (let t = 0; t < 30; t++) {
    const text = await wall.nth(3).frameLocator('iframe').locator('body').innerText().catch(() => '')
    if (text.includes('9.99')) { priceShown = true; break }
    await page.waitForTimeout(300)
}
console.log('edited price £9.99 live on the counter screen:', priceShown)
await page.getByRole('button', { name: '←' }).click()
await page.getByRole('button', { name: 'Screens' }).click()

// Cut venue wifi → offline badges while content keeps playing
await page.keyboard.press('w')
await page.waitForTimeout(26_000) // outlive one poll cycle so fetches fail
const badges = await page.getByText(/OFFLINE · cached/).count()
const stillPlaying = await page.locator('iframe').count()
console.log(`wifi cut: ${badges} offline badge(s), content still rendered: ${stillPlaying > 0 || (await page.locator('img[src^="data:image/svg"]').count()) > 0}`)
await page.screenshot({ path: `${SP}/demo-3-offline.png` })
await page.keyboard.press('w') // restore

console.log('console errors:', logs.length ? logs.slice(0, 5) : 'none')
await b.close()

import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dir = resolve(__dirname, 'screenshots');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// Use the port from preview server
const BASE = 'http://localhost:62926';
const EMAIL = 'peacockillustrated@gmail.com';
const PASSWORD = 'Jacktom1';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function dismissSplash(page) {
  await page.evaluate(() => {
    document.querySelectorAll('[aria-hidden="true"]').forEach(el => {
      if (el.style && (el.style.zIndex === '9999' || el.style.zIndex === '50')) el.remove();
    });
    document.querySelectorAll('[class*="splash"], [class*="Splash"]').forEach(el => el.remove());
  }).catch(() => {});
}

async function capture(page, name, url, opts = {}) {
  const { width = 1280, height = 800, fullPage = false } = opts;
  await page.setViewport({ width, height, deviceScaleFactor: 2 });
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
  } catch (e) {
    console.log(`  warn: ${e.message.split('\n')[0]}`);
  }
  await sleep(4000);
  await dismissSplash(page);
  await sleep(500);

  const filepath = resolve(dir, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage });
  console.log(`  ✓ ${name}.png`);
}

async function main() {
  console.log('Launching browser...\n');
  const browser = await puppeteer.launch({
    headless: true,
    protocolTimeout: 300000,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // === PUBLIC PAGES ===
  console.log('📸 Public pages (desktop 1280x800):');
  await capture(page, 'homepage-desktop', `${BASE}/`);
  await capture(page, 'pricing-desktop', `${BASE}/pricing`, { fullPage: true });
  await capture(page, 'product-desktop', `${BASE}/product`, { fullPage: true });
  await capture(page, 'studio-desktop', `${BASE}/studio`);
  await capture(page, 'templates-desktop', `${BASE}/templates`);

  // Mobile views
  console.log('\n📸 Public pages (mobile 375x812):');
  await capture(page, 'homepage-mobile', `${BASE}/`, { width: 375, height: 812 });
  await capture(page, 'pricing-mobile', `${BASE}/pricing`, { width: 375, height: 812, fullPage: true });
  await capture(page, 'login-mobile', `${BASE}/auth/login`, { width: 375, height: 812 });

  // Tablet views
  console.log('\n📸 Public pages (tablet 768x1024):');
  await capture(page, 'homepage-tablet', `${BASE}/`, { width: 768, height: 1024 });

  // === LOGIN ===
  console.log('\n🔐 Logging in...');
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });
  try {
    await page.goto(`${BASE}/auth/login`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  } catch {}
  await sleep(4000);
  await dismissSplash(page);
  await sleep(500);

  const emailInput = await page.$('input[type="email"], input[name="email"]');
  const passwordInput = await page.$('input[type="password"], input[name="password"]');
  if (emailInput && passwordInput) {
    await emailInput.click({ clickCount: 3 });
    await emailInput.type(EMAIL, { delay: 20 });
    await passwordInput.click({ clickCount: 3 });
    await passwordInput.type(PASSWORD, { delay: 20 });
    const btn = await page.$('button[type="submit"]');
    if (btn) { await btn.click(); await sleep(8000); }
  }
  console.log(`  URL: ${page.url()}`);

  // === ADMIN PAGES ===
  console.log('\n📸 Admin pages (desktop):');
  await capture(page, 'admin-dashboard-desktop', `${BASE}/app`);
  await capture(page, 'admin-media-desktop', `${BASE}/app/media`);
  await capture(page, 'admin-schedules-desktop', `${BASE}/app/schedules`);
  await capture(page, 'admin-specials-desktop', `${BASE}/app/specials`);

  // Dashboard at tablet + mobile
  console.log('\n📸 Admin dashboard (tablet + mobile):');
  await capture(page, 'admin-dashboard-tablet', `${BASE}/app`, { width: 768, height: 1024 });
  await capture(page, 'admin-dashboard-mobile', `${BASE}/app`, { width: 375, height: 812 });

  // === DRILL DOWN ===
  console.log('\n📸 Admin drill-down (desktop):');
  // Navigate to demo client
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });
  try {
    await page.goto(`${BASE}/app`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  } catch {}
  await sleep(4000);
  await dismissSplash(page);

  // Find client links
  const clientLinks = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href*="/app/clients/"]'))
      .map(a => a.getAttribute('href'))
  );

  if (clientLinks.length > 0) {
    const clientUrl = `${BASE}${clientLinks[clientLinks.length - 1]}`; // Last = demo
    await capture(page, 'admin-client-desktop', clientUrl);

    // Find store links within client
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });
    try { await page.goto(clientUrl, { waitUntil: 'domcontentloaded', timeout: 20000 }); } catch {}
    await sleep(4000); await dismissSplash(page);

    const storeLinks = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a[href*="/app/stores/"]')).map(a => a.getAttribute('href'))
    );

    if (storeLinks[0]) {
      const storeUrl = `${BASE}${storeLinks[0]}`;
      await capture(page, 'admin-store-desktop', storeUrl);

      // Find screen set links
      try { await page.goto(storeUrl, { waitUntil: 'domcontentloaded', timeout: 20000 }); } catch {}
      await sleep(4000); await dismissSplash(page);

      const setLinks = await page.evaluate(() =>
        Array.from(document.querySelectorAll('a[href*="/app/screen-sets/"]')).map(a => a.getAttribute('href'))
      );

      if (setLinks[0]) {
        const setUrl = `${BASE}${setLinks[0]}`;
        await capture(page, 'admin-screenset-desktop', setUrl);

        // Find screen links
        try { await page.goto(setUrl, { waitUntil: 'domcontentloaded', timeout: 20000 }); } catch {}
        await sleep(4000); await dismissSplash(page);

        const screenLinks = await page.evaluate(() =>
          Array.from(document.querySelectorAll('a[href*="/app/screens/"]')).map(a => a.getAttribute('href'))
        );

        if (screenLinks[0]) {
          const screenUrl = `${BASE}${screenLinks[0]}`;
          await capture(page, 'admin-screen-desktop', screenUrl, { fullPage: true });

          // Get player token
          try { await page.goto(screenUrl, { waitUntil: 'domcontentloaded', timeout: 20000 }); } catch {}
          await sleep(4000); await dismissSplash(page);

          const playerHref = await page.evaluate(() => {
            const a = document.querySelector('a[href*="/player/"]');
            return a ? a.getAttribute('href') : null;
          });

          if (playerHref) {
            // Player at TV resolution
            const playerUrl = `${BASE}${playerHref}`;
            await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
            try { await page.goto(playerUrl, { waitUntil: 'domcontentloaded', timeout: 20000 }); } catch {}
            await sleep(6000);
            await page.screenshot({ path: resolve(dir, 'player-splash.png'), fullPage: false });
            console.log('  ✓ player-splash.png');

            // Click to initialize
            await page.click('body');
            await sleep(5000);
            await page.screenshot({ path: resolve(dir, 'player-active.png'), fullPage: false });
            console.log('  ✓ player-active.png');
          }
        }
      }
    }
  }

  // === SPECIALS EDITOR ===
  console.log('\n📸 Specials editor:');
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });
  try { await page.goto(`${BASE}/app/specials`, { waitUntil: 'domcontentloaded', timeout: 20000 }); } catch {}
  await sleep(4000); await dismissSplash(page);

  // Find specials links or create button
  const specialsLinks = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href*="/app/specials/"]'));
    return links.map(a => a.getAttribute('href')).filter(h => h !== '/app/specials/new');
  });

  if (specialsLinks.length > 0) {
    await capture(page, 'admin-specials-editor-desktop', `${BASE}${specialsLinks[0]}`);
  }

  await browser.close();

  // Summary
  console.log('\n\n✅ DONE! Screenshots saved:\n');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
  files.forEach(f => {
    const stats = fs.statSync(resolve(dir, f));
    console.log(`  ${f} (${(stats.size / 1024).toFixed(0)}KB)`);
  });
}

main().catch(e => { console.error(e); process.exit(1); });

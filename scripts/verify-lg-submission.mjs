// Pre-submission verification for the LG Content Store package.
// Run with: npm run lg:verify
//
// Checks every prerequisite before you submit to seller.lgappstv.com.
// Exits non-zero if anything is missing so you can wire it into CI later.

import fs from "node:fs";
import path from "node:path";
import https from "node:https";

const ROOT = path.resolve(import.meta.dirname, "..");

const checks = [];
let warnings = 0;
let errors = 0;

function check(name, condition, errorMsg, severity = "error") {
    const passed = !!condition;
    checks.push({ name, passed, errorMsg, severity });
    if (!passed) {
        if (severity === "error") errors++;
        else warnings++;
    }
}

function fileExists(rel) {
    return fs.existsSync(path.join(ROOT, rel));
}

function fileSize(rel) {
    try { return fs.statSync(path.join(ROOT, rel)).size; }
    catch { return 0; }
}

function readJson(rel) {
    try { return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8")); }
    catch { return null; }
}

function readText(rel) {
    try { return fs.readFileSync(path.join(ROOT, rel), "utf8"); }
    catch { return ""; }
}

function fetchStatus(url, timeoutMs = 5000) {
    return new Promise((resolve) => {
        const req = https.get(url, { timeout: timeoutMs }, (res) => {
            resolve(res.statusCode);
            res.resume();
        });
        req.on("error", () => resolve(null));
        req.on("timeout", () => { req.destroy(); resolve(null); });
    });
}

// ── webOS app structure ───────────────────────────────
const appinfo = readJson("webos-app/appinfo.json");
check("webos-app/appinfo.json exists", appinfo, "Missing webos-app/appinfo.json");
if (appinfo) {
    check(
        "appinfo.json has required fields",
        appinfo.id && appinfo.version && appinfo.vendor && appinfo.title && appinfo.main && appinfo.icon,
        "appinfo.json missing one of: id, version, vendor, title, main, icon",
    );
    check(
        "appinfo.json id is reverse-DNS",
        /^[a-z0-9]+\.[a-z0-9]+\.[a-z0-9]+/.test(appinfo.id || ""),
        `appinfo.json id must be reverse-DNS (e.g. com.onesignanddigital.display), got: ${appinfo.id}`,
    );
    check(
        "appinfo.json version is semver",
        /^\d+\.\d+\.\d+$/.test(appinfo.version || ""),
        `appinfo.json version must be N.N.N, got: ${appinfo.version}`,
    );
}

check("webos-app/index.html exists", fileExists("webos-app/index.html"), "Missing webos-app/index.html");

// ── webOS app icons ───────────────────────────────────
check("webos-app/icon.png exists (80x80)", fileSize("webos-app/icon.png") > 0, "Missing webos-app/icon.png — run npm run lg:assets");
check("webos-app/largeIcon.png exists (130x130)", fileSize("webos-app/largeIcon.png") > 0, "Missing webos-app/largeIcon.png — run npm run lg:assets");
check("webos-app/splashBackground.png exists (1920x1080)", fileSize("webos-app/splashBackground.png") > 0, "Missing webos-app/splashBackground.png — run npm run lg:assets");

// ── Content Store images ──────────────────────────────
check(
    "webos-app/store-assets/store-icon.png exists",
    fileSize("webos-app/store-assets/store-icon.png") > 0,
    "Missing store-icon.png — run npm run lg:assets",
);
check(
    "webos-app/store-assets/store-tile.png exists",
    fileSize("webos-app/store-assets/store-tile.png") > 0,
    "Missing store-tile.png — run npm run lg:assets",
);
check(
    "webos-app/store-assets/feature-graphic.png exists",
    fileSize("webos-app/store-assets/feature-graphic.png") > 0,
    "Missing feature-graphic.png — run npm run lg:assets",
);

// ── Marketing pages ───────────────────────────────────
check(
    "Privacy page source exists",
    fileExists("app/(marketing)/privacy/page.tsx"),
    "Missing app/(marketing)/privacy/page.tsx",
);
check(
    "Support page source exists",
    fileExists("app/(marketing)/support/page.tsx"),
    "Missing app/(marketing)/support/page.tsx",
);

// ── Player resilience layers ──────────────────────────
const guardSrc = readText("components/player/never-sleep-guard.tsx");
check("Player: Wake Lock referenced", guardSrc.includes("mediaSession") || readText("app/(public)/player/[token]/page.tsx").includes("wakeLock"), "Wake lock not found in player");
check("Player: Media Session API wired", guardSrc.includes("mediaSession"), "Media Session API not wired — see NeverSleepGuard");
check("Player: Hidden video element present", guardSrc.includes("silent.mp4"), "Hidden video element missing from NeverSleepGuard");

const pageSrc = readText("app/(public)/player/[token]/page.tsx");
check("Player: 15-min reload watchdog wired", pageSrc.includes("STALE_THRESHOLD_MS") || pageSrc.includes("STALE_THRESHOLD"), "Reload watchdog not found in player page");
check("Player: online/offline handlers wired", pageSrc.includes("'online'") && pageSrc.includes("'offline'"), "Network state handlers not found");
check("Player: Wake-lock periodic re-acquire", pageSrc.includes("reacquireTimer") || pageSrc.includes("released"), "Periodic wake-lock check not found");

// ── Silent.mp4 (warning only — optional) ──────────────
check(
    "public/silent.mp4 exists",
    fileSize("public/silent.mp4") > 0,
    "public/silent.mp4 missing — optional but recommended. Generate with: ffmpeg -f lavfi -i color=black:s=2x2:r=1 -t 1 -c:v libx264 -pix_fmt yuv420p public/silent.mp4",
    "warning",
);

// ── Live URL checks (privacy + support pages reachable) ─
const SKIP_LIVE = process.argv.includes("--no-network");
if (!SKIP_LIVE) {
    console.log("\nChecking live URLs (skip with --no-network)...");
    const privacy = await fetchStatus("https://onesign-display.vercel.app/privacy");
    const support = await fetchStatus("https://onesign-display.vercel.app/support");
    check(
        "onesign-display.vercel.app/privacy resolves (200 OK)",
        privacy === 200,
        `onesign-display.vercel.app/privacy returned ${privacy ?? "no response"} — LG requires a live privacy page`,
        "warning",
    );
    check(
        "onesign-display.vercel.app/support resolves (200 OK)",
        support === 200,
        `onesign-display.vercel.app/support returned ${support ?? "no response"} — LG requires a live support page`,
        "warning",
    );
}

// ── Print report ──────────────────────────────────────
console.log("\nPre-submission verification\n" + "─".repeat(50));
for (const c of checks) {
    const icon = c.passed ? "✓" : c.severity === "warning" ? "!" : "✗";
    const color = c.passed ? "32" : c.severity === "warning" ? "33" : "31";
    process.stdout.write(`\x1b[${color}m${icon}\x1b[0m  ${c.name}\n`);
    if (!c.passed) {
        process.stdout.write(`     \x1b[${color}m→ ${c.errorMsg}\x1b[0m\n`);
    }
}

console.log("\n" + "─".repeat(50));
console.log(`${checks.filter((c) => c.passed).length} passed, ${warnings} warnings, ${errors} errors\n`);

if (errors === 0 && warnings === 0) {
    console.log("\x1b[32m✓ Ready for LG Content Store submission.\x1b[0m\n");
    console.log("Next steps:");
    console.log("  1. npm run lg:package        (build .ipk; needs @webosose/ares-cli installed globally)");
    console.log("  2. Sideload to a real LG TV  (ares-install dist/com.onesignanddigital.display_X.X.X_all.ipk)");
    console.log("  3. Run testing checklist in webos-app/README.md");
    console.log("  4. Submit at seller.lgappstv.com using LG_SELLER_LOUNGE_SUBMISSION.md\n");
    process.exit(0);
} else if (errors === 0) {
    console.log("\x1b[33m! Submission possible but with warnings. Address them when convenient.\x1b[0m\n");
    process.exit(0);
} else {
    console.log("\x1b[31m✗ NOT ready. Fix the errors above before submitting.\x1b[0m\n");
    process.exit(1);
}

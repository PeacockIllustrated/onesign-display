// Generate LG Content Store and webOS app visual assets from the brand SVGs
// in public/assets/. Run with: node scripts/generate-lg-assets.mjs
//
// Outputs:
//   webos-app/icon.png              80x80    launcher tile icon
//   webos-app/largeIcon.png         130x130  home dashboard icon
//   webos-app/splashBackground.png  1920x1080 app boot splash
//   webos-app/store-assets/store-icon.png      400x400 Content Store icon
//   webos-app/store-assets/store-tile.png      800x450 Content Store tile
//   webos-app/store-assets/store-icon-square.png 600x600 alt square
//   webos-app/store-assets/feature-graphic.png  1024x500 hero graphic

import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC_ICON_LIGHT = path.join(ROOT, "public/assets/OD-Icon-Light.svg");      // white fill
const SRC_WORDMARK_LIGHT = path.join(ROOT, "public/assets/OD-Wordmark-Light.svg"); // white fill
const OUT_WEBOS = path.join(ROOT, "webos-app");
const OUT_STORE = path.join(ROOT, "webos-app/store-assets");

const BRAND_TEAL = "#4e7e8c";
const BRAND_TEAL_DEEP = "#1a2e35";
const BRAND_ACCENT = "#95daf8";

const log = (msg) => console.log(`  ${msg}`);

async function renderSvg(svgPath, width, height) {
    const svg = await fs.readFile(svgPath);
    return sharp(svg, { density: 600 })
        .resize(width, height, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
}

async function writePng(buffer, outPath) {
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, buffer);
    log(`✓ ${path.relative(ROOT, outPath)}`);
}

async function compose({ width, height, background, layers }) {
    const composite = layers.map((l) => ({
        input: l.buffer,
        top: l.top,
        left: l.left,
    }));
    return sharp({
        create: {
            width,
            height,
            channels: 4,
            background,
        },
    })
        .composite(composite)
        .png()
        .toBuffer();
}

async function main() {
    console.log("\nGenerating LG assets from brand SVGs...\n");

    // 1. Launcher icon — 80x80 transparent, white OD icon
    log("Building launcher icons...");
    const icon80 = await renderSvg(SRC_ICON_LIGHT, 72, 72);
    const launcher80 = await compose({
        width: 80,
        height: 80,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        layers: [{ buffer: icon80, top: 4, left: 4 }],
    });
    await writePng(launcher80, path.join(OUT_WEBOS, "icon.png"));

    // 2. Large icon — 130x130 transparent, white OD icon
    const icon130 = await renderSvg(SRC_ICON_LIGHT, 118, 118);
    const launcher130 = await compose({
        width: 130,
        height: 130,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        layers: [{ buffer: icon130, top: 6, left: 6 }],
    });
    await writePng(launcher130, path.join(OUT_WEBOS, "largeIcon.png"));

    // 3. Splash background — 1920x1080 black with white wordmark centered
    log("Building splash screen...");
    const wordmarkSplash = await renderSvg(SRC_WORDMARK_LIGHT, 700, 200);
    const splashBg = await compose({
        width: 1920,
        height: 1080,
        background: { r: 0, g: 0, b: 0, alpha: 1 },
        layers: [
            { buffer: wordmarkSplash, top: Math.round((1080 - 200) / 2), left: Math.round((1920 - 700) / 2) },
        ],
    });
    await writePng(splashBg, path.join(OUT_WEBOS, "splashBackground.png"));

    // 4. Store icon — 400x400 with deep-teal background
    log("Building Content Store assets...");
    const storeIconArt = await renderSvg(SRC_ICON_LIGHT, 280, 280);
    const storeIcon = await compose({
        width: 400,
        height: 400,
        background: hexToRgba(BRAND_TEAL_DEEP),
        layers: [{ buffer: storeIconArt, top: 60, left: 60 }],
    });
    await writePng(storeIcon, path.join(OUT_STORE, "store-icon.png"));

    // 5. Square alt 600x600
    const storeIconLargeArt = await renderSvg(SRC_ICON_LIGHT, 420, 420);
    const storeIconLarge = await compose({
        width: 600,
        height: 600,
        background: hexToRgba(BRAND_TEAL_DEEP),
        layers: [{ buffer: storeIconLargeArt, top: 90, left: 90 }],
    });
    await writePng(storeIconLarge, path.join(OUT_STORE, "store-icon-square.png"));

    // 5b. High-resolution 1024x1024 — for LG Seller Lounge fields that require ≥400px
    const storeIcon1024Art = await renderSvg(SRC_ICON_LIGHT, 720, 720);
    const storeIcon1024 = await compose({
        width: 1024,
        height: 1024,
        background: hexToRgba(BRAND_TEAL_DEEP),
        layers: [{ buffer: storeIcon1024Art, top: 152, left: 152 }],
    });
    await writePng(storeIcon1024, path.join(OUT_STORE, "store-icon-1024.png"));

    // 6. Store tile — 800x450 with wordmark centered on brand-teal
    const tileWordmark = await renderSvg(SRC_WORDMARK_LIGHT, 500, 145);
    const storeTile = await compose({
        width: 800,
        height: 450,
        background: hexToRgba(BRAND_TEAL),
        layers: [
            { buffer: tileWordmark, top: Math.round((450 - 145) / 2), left: Math.round((800 - 500) / 2) },
        ],
    });
    await writePng(storeTile, path.join(OUT_STORE, "store-tile.png"));

    // 7. Feature graphic — 1024x500 dark teal with icon left + wordmark right
    const featureIcon = await renderSvg(SRC_ICON_LIGHT, 280, 280);
    const featureWordmark = await renderSvg(SRC_WORDMARK_LIGHT, 480, 140);
    const featureGraphic = await compose({
        width: 1024,
        height: 500,
        background: hexToRgba(BRAND_TEAL_DEEP),
        layers: [
            { buffer: featureIcon, top: 110, left: 130 },
            { buffer: featureWordmark, top: 180, left: 480 },
        ],
    });
    await writePng(featureGraphic, path.join(OUT_STORE, "feature-graphic.png"));

    // 8. Silent.mp4 hint file — write a small note where the asset should go
    log("\nNote: public/silent.mp4 must be generated separately with ffmpeg.");
    log("See webos-app/ICONS_AND_ASSETS.md for the one-line command.");

    console.log("\nDone. Assets generated:");
    console.log(`  ${OUT_WEBOS}/ (icon.png, largeIcon.png, splashBackground.png)`);
    console.log(`  ${OUT_STORE}/ (store-icon, store-tile, store-icon-square, feature-graphic)`);
    console.log();
}

function hexToRgba(hex) {
    const h = hex.replace("#", "");
    return {
        r: parseInt(h.slice(0, 2), 16),
        g: parseInt(h.slice(2, 4), 16),
        b: parseInt(h.slice(4, 6), 16),
        alpha: 1,
    };
}

main().catch((err) => {
    console.error("\nAsset generation failed:", err);
    process.exit(1);
});

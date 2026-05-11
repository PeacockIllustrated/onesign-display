# Visual assets you need to create

The wrapper needs three image files in this folder before it can be packaged. All can be generated from existing brand assets in `/public`.

## Required files

### `icon.png` — 80×80 PNG
The launcher tile icon that appears in the TV's app grid.
- **Source:** `public/od-icon.png` (or `public/od-icon-white.png`)
- **Treatment:** Square crop, transparent background, OD icon mark centered with ~10% padding
- **Note:** Use the icon mark only — NOT the wordmark. Wordmarks render unreadable at 80px

### `largeIcon.png` — 130×130 PNG
Used on the LG home dashboard.
- **Source:** Same as icon.png, just larger
- **Treatment:** Same as above

### `splashBackground.png` — 1920×1080 PNG
Shown briefly when the app launches before `index.html` renders.
- **Source:** Compose from `public/od-wordmark-white.png` on solid black
- **Treatment:** Wordmark centered, no other UI elements, black background `#000000`

## Quick generation with ImageMagick

If you have ImageMagick installed:

```powershell
# From repo root
magick public/od-icon.png -resize 80x80 -background none webos-app/icon.png
magick public/od-icon.png -resize 130x130 -background none webos-app/largeIcon.png
magick -size 1920x1080 canvas:black \( public/od-wordmark-white.png -resize 600x \) -gravity center -composite webos-app/splashBackground.png
```

## Quick generation in Photoshop/Figma

1. Open the source from `/public`
2. Resize to target dimensions (Image → Image Size)
3. Export as PNG with transparency for icons, opaque PNG for splash
4. Save into `webos-app/`

## Optional but recommended for Content Store submission

These aren't needed for sideloading but are required by LG Seller Lounge when submitting to the Content Store:

| File | Size | Purpose |
|------|------|---------|
| `screenshot-1.png` | 1920×1080 | First store listing screenshot — show the live player on a TV |
| `screenshot-2.png` | 1920×1080 | Setup screen |
| `screenshot-3.png` | 1920×1080 | Dashboard view (separate from the player — show your admin portal in screenshot context) |
| `tile-square.png` | 400×400 | Store tile image |
| `tile-wide.png` | 800×450 | Store featured tile |

Take screenshots from real deployments rather than mockups — LG's review team prefers authentic content.

## Generating silent.mp4 (for the main Next.js app, NOT this folder)

The hosted player's `NeverSleepGuard` references `/silent.mp4` as a hidden keep-awake video. Generate it once and drop it in `public/silent.mp4` of the main Next.js app:

### Option A — ffmpeg (cleanest)

```powershell
ffmpeg -f lavfi -i color=black:s=2x2:r=1 -t 1 -c:v libx264 -pix_fmt yuv420p -movflags +faststart public/silent.mp4
```

Result: ~1 KB, totally silent, plays forever via the looping `<video>` element.

### Option B — Download from NoSleep.js

The [NoSleep.js project](https://github.com/richtr/NoSleep.js) has a small silent MP4 in its source. Extract and rename to `public/silent.mp4`.

### Option C — Skip it

The hidden video element is the LEAST critical layer of the keep-awake stack. If `/silent.mp4` returns a 404, the video element fails silently and the wake lock + audio oscillator + canvas pulse + media session API still do their jobs. Recommended for shipping if you don't have ffmpeg handy — generate it later as an enhancement.

# LG Content Store submission — status board

Single-page status of everything needed to ship Onesign Display to the LG Content Store. Tick items as they land.

## ✅ Already done in this session

### Player-side resilience
- [x] Wake Lock API with `visibilitychange` re-acquisition
- [x] Wake Lock 5-minute periodic re-acquisition
- [x] Silent audio heartbeat (Web Audio oscillator)
- [x] Canvas visual activity pulse
- [x] Media Session API declaring "playing" state
- [x] Hidden looping `<video>` element (HTMLMediaElement signal)
- [x] Fullscreen on play
- [x] 15-minute full-page reload watchdog
- [x] Network online/offline event handlers
- [x] Video stall watchdog (re-fetches manifest)
- [x] Cached manifest fallback for offline

### LG webOS wrapper app
- [x] `webos-app/appinfo.json` — manifest with reverse-DNS ID, semver version
- [x] `webos-app/index.html` — setup screen + iframe player + remote key handling + 5-second hold reset gesture
- [x] `webos-app/icon.png` (80×80, transparent)
- [x] `webos-app/largeIcon.png` (130×130, transparent)
- [x] `webos-app/splashBackground.png` (1920×1080, black + wordmark)
- [x] `webos-app/README.md` — build, sideload, and testing instructions
- [x] `webos-app/ICONS_AND_ASSETS.md` — asset spec reference

### Content Store store-listing assets
- [x] `webos-app/store-assets/store-icon.png` (400×400, deep teal + icon)
- [x] `webos-app/store-assets/store-icon-square.png` (600×600, alt size)
- [x] `webos-app/store-assets/store-tile.png` (800×450, brand teal + wordmark)
- [x] `webos-app/store-assets/feature-graphic.png` (1024×500, deep teal + icon + wordmark)

### Marketing site pages
- [x] `/privacy` — full UK GDPR privacy policy at `app/(marketing)/privacy/page.tsx`
- [x] `/support` — contact methods, TV setup checklist, FAQ at `app/(marketing)/support/page.tsx`

### Submission documentation
- [x] `LG_SELLER_LOUNGE_SUBMISSION.md` — section-by-section walkthrough with recommended answers
- [x] `scripts/generate-lg-assets.mjs` — regenerates all visual assets from brand SVGs
- [x] `scripts/verify-lg-submission.mjs` — pre-flight check of everything

### npm script aliases
- [x] `npm run lg:assets` — regenerate visual assets
- [x] `npm run lg:verify` — run pre-submission verification
- [x] `npm run lg:package` — build the `.ipk` (requires ares-cli)

---

## 🔲 Still to do before submission

### 1. Deploy marketing changes to production
The privacy and support pages exist in source but won't be live until you deploy. LG's reviewers will hit `onesign-display.vercel.app/privacy` and `/support` — both must resolve to 200 OK.

**Action:** Merge this branch and let Vercel deploy. Then run:
```
npm run lg:verify
```
The two `--no-network` warnings should clear once the pages are live.

### 2. Generate `public/silent.mp4` (optional)
Only blocking if you want the full keep-awake stack. The other layers still work without it. To create:
```
ffmpeg -f lavfi -i color=black:s=2x2:r=1 -t 1 -c:v libx264 -pix_fmt yuv420p -movflags +faststart public/silent.mp4
```
If you don't have ffmpeg, [Chocolatey install](https://chocolatey.org/install): `choco install ffmpeg`, or download from [gyan.dev/ffmpeg](https://www.gyan.dev/ffmpeg/builds/) (essentials build is ~80 MB).

### 3. Install LG ares-cli
Required to build the `.ipk` and sideload to a real TV:
```
npm install -g @webosose/ares-cli
```

### 4. Build and test the `.ipk` on a real LG TV
1. Enable Developer Mode on the test TV (see `webos-app/README.md`)
2. Register the TV: `ares-setup-device`
3. Build: `npm run lg:package` (outputs to `dist/`)
4. Install: `ares-install -d <device-name> dist/com.onesignanddigital.display_1.0.0_all.ipk`
5. Run the testing checklist in `webos-app/README.md`

### 5. Take real screenshots for the Content Store listing
The generated assets (icon, tile, feature graphic) are the brand visuals. You still need:
- 3–4 product screenshots at 1920×1080 of the player running real client menus
- Don't include other brands (no Coca-Cola logos, etc.) — LG strips those in review
- Save to `webos-app/store-assets/` as `screenshot-1.png`, `screenshot-2.png`, etc.

### 6. Register an LG Seller Lounge account
- Go to [seller.lgappstv.com](https://seller.lgappstv.com)
- Register with `sales@onesignanddigital.com` or `tom@onesignanddigital.com`
- Approval takes 1–3 business days

### 7. Create a dedicated reviewer test pairing token
Generate a pairing token from your admin portal that:
- Is tied to a sandbox/test screen in your account
- Has demo content pre-loaded (HTML menu + 2–3 slideshow images)
- Doesn't expire during the LG review window (4–6 weeks safety margin)
- Is NOT used in any real client deployment

You'll paste this into the Seller Lounge "Test Info" section.

### 8. Book webOS Cloud Test Lab sessions
After Seller Lounge account is approved:
- Book one session each on webOS 4.0, 6.0, and 22+
- Test the .ipk against the testing checklist in `webos-app/README.md`
- Take screenshots of any issues for the "Defect Info" section

### 9. Submit via Seller Lounge
Follow `LG_SELLER_LOUNGE_SUBMISSION.md` section by section. Most-failed sections are:
- **Test Info** (be specific about test steps + provide a real working token)
- **Self-check list** (run through every item honestly on a real TV first)
- **Privacy/Support URLs** (must resolve)

---

## Realistic timeline from here

| Phase | Duration | Blocker |
|-------|----------|---------|
| Merge + deploy privacy/support pages | 30 min | You |
| Install ffmpeg + generate silent.mp4 | 15 min | You (optional) |
| Install ares-cli + register a test TV | 30 min | You + an LG TV |
| Build + sideload .ipk + run test checklist | 2 hours | You |
| Take product screenshots | 1 hour | You + real menu deployment |
| Register Seller Lounge + wait for approval | 1–3 business days | LG |
| Book + complete Cloud Test Lab sessions | 1 day | LG scheduling |
| Fill in + submit Seller Lounge form | 2 hours | You |
| LG initial review | 5–10 business days | LG |
| **Total** | **3–4 weeks** | Most time waiting on LG |

Active work for you across that timeline: ~7 hours.

---

## Reference: file locations

| File | Purpose |
|------|---------|
| [LG_SELLER_LOUNGE_SUBMISSION.md](LG_SELLER_LOUNGE_SUBMISSION.md) | Form-by-form submission guide |
| [webos-app/README.md](webos-app/README.md) | Build & sideload instructions |
| [webos-app/ICONS_AND_ASSETS.md](webos-app/ICONS_AND_ASSETS.md) | Asset spec reference |
| [scripts/generate-lg-assets.mjs](scripts/generate-lg-assets.mjs) | Regenerate visuals from SVGs |
| [scripts/verify-lg-submission.mjs](scripts/verify-lg-submission.mjs) | Pre-flight checks |
| [app/(marketing)/privacy/page.tsx](app/(marketing)/privacy/page.tsx) | Privacy policy page source |
| [app/(marketing)/support/page.tsx](app/(marketing)/support/page.tsx) | Support page source |

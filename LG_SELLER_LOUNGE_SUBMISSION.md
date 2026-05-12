# LG Seller Lounge — Onesign Display submission guide

Step-by-step walkthrough of every section in the LG Seller Lounge "Applications" submission flow, with recommended answers for Onesign Display.

The form is at [seller.lgappstv.com](https://seller.lgappstv.com) → Applications → Create New.

---

## 1. File Upload

**What it wants:** Your `.ipk` package built from `webos-app/`.

**How to provide:**
1. Build with `ares-package webos-app` from the repo root
2. Output is `com.onesignanddigital.display_1.0.0_all.ipk`
3. Upload that single file

**Notes:**
- Version number MUST match `appinfo.json` — keep them in sync
- LG strips comments and re-signs the package on their end; what you upload is what they review
- Max file size is 200 MB; you'll be well under (likely <100 KB)

---

## 2. Images

**What it wants:** Store listing visuals so customers can see what your app looks like before installing.

**Required assets:**

| Asset | Size | What to show |
|-------|------|-------------|
| Icon | 400×400 PNG, transparent | OD icon mark only (no wordmark — too thin at small sizes) |
| Tile | 800×450 PNG | Wordmark on dark teal `#4e7e8c` background with a small screenshot inset |
| Screenshot 1 | 1920×1080 PNG | The live player running a real menu — pick your best-looking deployment |
| Screenshot 2 | 1920×1080 PNG | A different layout: HTML menu mode showing daily specials |
| Screenshot 3 | 1920×1080 PNG | Setup screen, captured from the wrapper |
| Screenshot 4 (optional) | 1920×1080 PNG | Admin dashboard mockup with caption "Manage from one dashboard" |

**Tips:**
- Use real client deployments where possible — LG's reviewers prefer authentic content over mockups
- Don't include other brands in screenshots (no Coca-Cola logos on menus, etc.) — LG strips those during review
- Captions are auto-stripped, so don't bake text into the screenshots — use the description field instead

---

## 3. Service Country Info

**What it wants:** Which countries the app should be available in via the LG Content Store.

**Recommended answer:**
- **Primary:** United Kingdom
- **Secondary:** Ireland, Germany, France, Netherlands, Spain, Italy, Belgium, Sweden, Denmark, Norway, Finland (EU + EEA)
- **Tertiary (optional):** United States, Canada, Australia, New Zealand

**Why these:**
- UK is your home market and primary support language
- EU/EEA gives reach into LG's strongest commercial display market (Germany particularly)
- US/AU/NZ extend English-language reach with no localisation work needed
- Avoid Asia-Pacific markets initially — different display preferences, different commercial signage norms, and your support hours don't cover their working day

**Important:** Don't select countries where you can't legitimately offer support. LG's reviewers check this against your support contact info.

---

## 4. Display Info

**What it wants:** Text content that will appear on the Content Store listing.

**Suggested copy:**

**App name:** Onesign Display

**Short description (150 chars max):**
> Stream digital menus to LG TVs. Schedule dayparts, swap specials, and manage every location from one dashboard.

**Long description (suggested):**
> Onesign Display is the digital menu streaming platform built for busy hospitality teams. Stream your menus to every screen, schedule prices and specials by time of day, and update content in seconds — all managed remotely from a single dashboard.
>
> **Built for hospitality:**
> - Menu boards that update without touching the TV
> - Daily specials scheduled by time of day
> - Multi-location management from one admin portal
> - Custom themes designed by the Onesign team
>
> **Pair in 30 seconds:**
> Generate a pairing token from your Onesign Display admin portal, enter it on the TV with the remote, and your screen is live.
>
> **From the signage experts:**
> Onesign Display is by Onesign & Digital, sign-making professionals serving UK hospitality since 1995. Get hardware advice and signage design support included with every plan.
>
> **Subscription required** — visit onesign-display.vercel.app to start a free trial.

**Category:** Business → Office / Productivity (or Lifestyle → Food & Drink if the form prefers that)

**Keywords/Tags (typically 5–10):**
`digital signage`, `menu board`, `hospitality`, `restaurant`, `cafe`, `pub`, `signage`, `display management`, `Onesign`, `commercial display`

---

## 5. Service Info

**What it wants:** The commercial model — free, paid, or subscription — and pricing details if applicable.

**Recommended answer:**

**Pricing model:** Free to install, subscription required to activate (sometimes called "Free with In-App Purchase" or "Subscription Service" depending on the form's options)

**Subscription type:** External (managed via the Onesign Display admin portal, not LG's billing)

**Free trial:** Yes — 14 days, full features

**Why this is the right model:**
- Customers can install the app and see the setup screen without paying — gives them confidence before signing up
- Activation token is generated only after subscribing on onesign-display.vercel.app — so installing the LG app alone gives the user nothing usable
- LG doesn't take a cut of subscription revenue because billing is external
- Avoids LG's In-App Purchase API which adds complexity and fees

**Support contact (required):**
- **Email:** `sales@onesignanddigital.com`
- **Phone:** `+44 191 487 6767`
- **Support URL:** `https://onesign-display.vercel.app/support` *(create this page before submitting)*
- **Privacy policy URL:** `https://onesign-display.vercel.app/privacy` *(create this page before submitting)*

⚠️ **Both the support and privacy URLs MUST resolve to real pages before submission** — LG's automated check will fail otherwise. Simple one-pagers are fine.

---

## 6. Feature Info

**What it wants:** A declaration of which webOS platform features and APIs your app uses. LG uses this to scope their review and determine compatibility with older TV models.

**Recommended answers:**

| Feature | Use? | Notes |
|---------|------|-------|
| Network / Internet | **YES** | App loads content from `onesign-display.vercel.app` |
| Local storage | **YES** | Pairing token stored in `localStorage` |
| Wake Lock API | **YES** | Used to prevent screen sleep during playback |
| Fullscreen API | **YES** | Player runs fullscreen |
| Web Audio API | **YES** | Silent audio heartbeat for keep-awake |
| Media Session API | **YES** | Declares "playing" state to OS |
| HLS/Streaming video | **YES** | Player supports live HLS streams |
| Bluetooth | NO | Not used |
| Camera/microphone | NO | Not used |
| Location services | NO | Not used |
| Push notifications | NO | Not used |
| In-app purchase | NO | External billing via web dashboard |
| DRM (Widevine etc.) | NO | Content is unencrypted |
| External device control (HDMI-CEC etc.) | NO | Not used |

**Minimum webOS version:** webOS 4.0 (Wake Lock API works reliably from this version up)

**Recommended webOS version:** webOS 6.0 or later (more reliable Chromium engine)

---

## 7. Test Info

**What it wants:** Information LG's QA team needs to actually test your app. The most-failed section if done lazily.

**What to provide:**

**Test pairing token:**
Generate a dedicated review-only token from your admin portal that:
- Is pre-paired to a test screen in your account
- Has demo content assigned (an HTML menu + a couple of slideshow images)
- Doesn't expire during the review window
- Is NOT used in any real client deployment

**Test credentials (if reviewers also want admin portal access — optional):**
- Email: `lg-reviewer@onesignanddigital.com` *(create this address as an alias)*
- Password: *(generate one, valid for 90 days, full admin access to a sandbox tenant)*

**How to test:**
> 1. Install the app on an LG TV running webOS 4.0 or later
> 2. Launch "Onesign Display" from the app launcher
> 3. On the setup screen, enter pairing token: `[YOUR_TEST_TOKEN]`
> 4. Press the Connect button — the player should load demo content within 5 seconds
> 5. Verify the screen stays on for at least 30 minutes of continuous playback
> 6. Press the BACK button — verify the app does NOT exit
> 7. Hold any remote button for 5 seconds — verify the reset confirmation modal appears
> 8. Select Cancel — verify it returns to playback without resetting

**Expected behaviour:** App should display the demo content immediately after pairing and run indefinitely.

**Known limitations:**
- Requires internet connectivity (no offline mode)
- Requires the TV's Auto Power Off setting to be disabled for 24/7 operation (standard for all signage apps)
- Subscription must be active in the Onesign portal for the pairing token to remain valid

---

## 8. Self-check list

**What it wants:** Confirmation that you've tested your own app against LG's standard quality criteria before submitting. Sign off honestly — LG re-tests everything and you'll fail review faster if you've lied about it.

**Standard items (check them honestly before submitting):**

- [ ] App launches successfully on webOS 4.0, 5.0, 6.0, and 22+
- [ ] App handles the BACK button without exiting unexpectedly
- [ ] App does not crash or freeze during 30+ minutes of use
- [ ] App responds to remote control input within 1 second
- [ ] No unhandled JavaScript errors in the console
- [ ] No hardcoded references to test/staging URLs
- [ ] App works on both standard remote and Magic Remote
- [ ] App icon displays correctly in launcher (no broken image)
- [ ] Splash screen displays correctly on launch
- [ ] App description text is correctly localised (English at minimum)
- [ ] Privacy policy URL resolves to a real privacy policy
- [ ] Support contact URL resolves to a real support page
- [ ] App does not request permissions it doesn't actually use
- [ ] App does not access location, camera, or microphone (or correctly declares it does)
- [ ] App handles network errors gracefully (try airplane-moding the TV mid-playback)
- [ ] App does not display profanity, adult content, or trademarked third-party content

**Run through every item on a real TV before clicking Submit.** Failing self-check items that LG then catches is the #1 reason for a rejected first submission.

---

## 9. webOS Cloud Test Lab

**What it is:** LG provides a remote-access pool of real webOS TVs you can deploy and test your `.ipk` against without owning every model. Free for partners.

**Recommended use:**
1. Book a session via the "Reservation" sub-item
2. Test on at least these three webOS versions:
   - **webOS 4.0** (2018 TVs — oldest you're targeting)
   - **webOS 6.0** (2021 — most common in current commercial sites)
   - **webOS 22+** (2022 and newer — newest engine, most APIs available)
3. For each, verify the test checklist from section 7 above
4. Take screenshots/screen recordings of any issues for the Defect Info section

**Tip:** Cloud Test Lab sessions are time-boxed (typically 60–120 min). Have your test plan written before booking — don't waste session time deciding what to check.

---

## 10. Defect Info

**What it wants:** Known issues, bugs, or limitations in the version you're submitting. Be upfront — LG will find them during review anyway, and disclosed issues are treated more leniently than discovered ones.

**Suggested entries (modify based on what you actually find during testing):**

**Defect 1:**
- **Severity:** Low (cosmetic)
- **Affected versions:** webOS 4.0 only
- **Description:** Setup screen input field cursor blink rate is slightly faster than other webOS 4.0 apps. Cosmetic only — input functionality unaffected.
- **Workaround:** None needed; functional.

**Defect 2:**
- **Severity:** Low (expected behaviour)
- **Affected versions:** All
- **Description:** App requires internet connectivity at all times. There is no offline mode. If the TV loses network during playback, the player shows a cached frame and an "Offline" indicator until connectivity returns.
- **Workaround:** Restore internet connectivity; player recovers automatically.

**Defect 3:**
- **Severity:** Low (third-party dependency)
- **Affected versions:** webOS 4.0–5.x
- **Description:** Screen Wake Lock API is unavailable on webOS versions prior to 6.0. Keep-awake on older TVs relies on audio heartbeat + canvas activity pulse only. Performance is still acceptable but slightly less reliable than on webOS 6+.
- **Workaround:** For 24/7 commercial deployments, recommend disabling the TV's Auto Power Off setting in Settings → General → Eco (one-time setup).

**Defect History:** Empty for v1.0.0. Future versions will list defects resolved per release.

---

## Submit

Once every section is green-ticked:

1. Click **SUBMIT**
2. Confirmation email arrives within 24 hours
3. Initial review takes **5–10 business days**
4. If rejected, you'll get a detailed report — fix the issues and resubmit (typically faster the second time)
5. Once approved, the app goes live on the Content Store in the countries selected in section 3

## After approval

- **Direct install URL** for clients: `lgsmarttv://app-install/com.onesignanddigital.display`
- **Updates:** Re-upload a new `.ipk` with incremented version number, re-submit, ~2–3 day re-review
- **Analytics:** Seller Lounge → Statistics shows install counts, country breakdown, version distribution

## Timeline summary

| Phase | Calendar time | Your work |
|-------|---------------|-----------|
| Build the `.ipk` | 2 days | One-time |
| Sideload test on a real LG TV | 2 days | Verify the testing checklist |
| Generate visual assets (icons, screenshots) | 1 day | One-time |
| Write/host privacy + support pages | 1 day | One-time |
| Seller Lounge account approval | 1–3 business days | Register at seller.lgappstv.com |
| Self-check + Cloud Test Lab | 2 days | Run the checklist on cloud TVs |
| Fill out Seller Lounge submission | 0.5 days | This document |
| LG review | 5–10 business days | Wait |
| **Total to live in Content Store** | **3–4 weeks** | **~7 days of your time** |

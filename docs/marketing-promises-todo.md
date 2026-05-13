# Marketing-promises todo (internal)

Each task is self-contained. An agent should be able to pick any one, work it,
and ship a PR without reading the conversation that produced this list.

The list is **blockers + consistency only**. Larger product work
(tier enforcement, SLA infrastructure, hardware supply chain) is tracked
separately because it's multi-PR scope, not a single agent run.

Status legend:
- `[ ]` not started
- `[~]` in progress (PR open)
- `[x]` shipped to main
- `[?]` verified — claim was already correct, no change needed

---

## Spawned chips (already queued — don't duplicate)

- `[ ]` **Build status page at status.onesigndisplay.com** — see spawned task #1
- `[ ]` **Player domain swap to display.onesignanddigital.com** — see spawned task #2
- `[ ]` **Verify "30+ stock templates" claim** — see spawned task #3
- `[ ]` **Wire demo modal into Odysseus orders page** — see spawned task #4

If those chips have been dismissed, the briefs are reproduced at the bottom of
this file (§ "Reproduced briefs").

---

## A. Consistency — wording must match the code

### A1. webOS minimum version — pick one and standardise

- `[ ]` Three different floors are advertised:
  - Pricing page FAQ (`app/(marketing)/pricing/page.tsx` "Do I need to buy hardware from Onesign?"): **webOS 2018+ (model year)**
  - Support page FAQ ("Which TVs does Onesign Display support?"): **webOS 4.0+, 6.0+ recommended**
  - `webos-app/appinfo.json` declares its own minimum — read it.
- **Acceptance**: one floor wins, all marketing pages match, the wrapper's `appinfo.json` minimum is at least as old. If we recommend a higher version for 24/7 use, state that consistently in both places.
- Likely answer: `webOS 4.0` (2018 model year ≈ webOS 4.0). Verify against the wrapper before editing copy.

### A2. Scheduling precision — "±100ms" is a guess

- `[ ]` Support page line ~173 promises "within ±100ms when the player has a stable internet connection". Code uses `setTimeout` based on `manifest.next_check`. Read [app/(public)/player/[token]/page.tsx](app/(public)/player/[token]/page.tsx) around line 671–680 and verify the actual drift bound.
- **Acceptance**: replace the number with whatever is defensible from the code. If the answer is "we don't know, depends on the device", swap it for honest copy ("schedules trigger within a second or two of the configured time").

### A3. "Auto-refresh within 60 seconds" — sanity-check

- `[x]` Done this session: code uses `POLL_INTERVAL_MS = 60000` at [app/(public)/player/[token]/page.tsx:486](app/(public)/player/[token]/page.tsx:486). Homepage and product page now say 60s.

### A4. Cover hours — Mon-Thu 9-4, Fri 9-12

- `[x]` Done this session: pricing SLA + FAQ + support contact card all reflect the real hours.

### A5. Storage caps removed from pricing

- `[x]` Done this session: no `plan`/`tier`/`quota`/`storage_limit` exists in Supabase schema. The 500MB/5GB/20GB row was dropped from the comparison.

---

## B. Verification tasks — touch the code, confirm or remove

Each of these is "open the file, check the behaviour, then either confirm
[?] or change the marketing copy to match reality".

### B1. Folder-drop batch upload

- `[ ]` Product page line ~222 promises "Batch upload — drag entire folders of menu assets at once".
- **Verify**: open the media library upload UI (look under `components/admin/` or `app/app/`). Does it accept a folder drop, or only multi-file selection?
- **Acceptance**: if folder drop is real, mark `[?]`. If not, either build it or change the copy to "drag many files at once".

### B2. Smart filename matching — auto-tag by venue or daypart

- `[ ]` Product page line ~227 promises filename-based auto-tagging.
- **Verify**: grep the upload route and any post-upload processing for tag inference. Likely doesn't exist — this looks aspirational.
- **Acceptance**: if not real, **delete the line**. Don't soften — it either auto-tags or it doesn't.

### B3. WebP image support

- `[ ]` Product page line ~231 lists "PNG, JPG, and WebP".
- **Verify**: check the upload route's mime-type allowlist (`app/api/upload/ingest/route.ts`) and the player's render path. If WebP isn't accepted on upload or rendered correctly in playback, drop it from the list.

### B4. WebM video support

- `[ ]` Product page line ~234 lists "MP4 and WebM".
- **Verify**: same as B3. Check upload allowlist and player video element.
- **Acceptance**: confirm WebM plays on the actual LG webOS target, not just on a desktop browser. webOS has finicky codec support.

### B5. Playlist transitions — fade / cut / slide-left / slide-right

- `[ ]` Product page line ~459 and homepage promise four transitions.
- **Verify**: open the playlist editor (likely `components/admin/` or `app/app/.../playlist/`) and confirm all four options exist and render correctly in the player.
- **Acceptance**: any missing transition either gets built or removed from marketing.

### B6. Per-slide duration range 5s–5min

- `[ ]` Product page line ~463 promises "5 s to 5 min" duration range.
- **Verify**: read the playlist editor's duration input bounds.
- **Acceptance**: match marketing to code.

### B7. Five-second remote button hold to re-pair

- `[ ]` Support page line ~155 promises a 5-second remote-hold reset gesture.
- **Verify**: search [webos-app/index.html](webos-app/index.html) and the player for any long-press detection.
- **Acceptance**: if it doesn't exist, either build it (it's small) or rewrite the FAQ to describe the real re-pair flow.

### B8. Auto-refresh and offline-safe playback

- `[ ]` Homepage feature card "Offline safe — last-known content keeps playing if Wi-Fi drops".
- **Verify**: read the player's manifest cache logic. The `localStorage.setItem('onesign_manifest_${token}', ...)` line at `page.tsx:648` is the cache. Confirm playback continues from the cache when `/api/player/manifest` returns a network error.
- **Acceptance**: confirm yes/no; if no, build the fallback path (one-pager change).

### B9. Wake lock / "always awake"

- `[ ]` Homepage and product page claim screens never sleep.
- **Verify**: [components/player/never-sleep-guard.tsx](components/player/never-sleep-guard.tsx) — does this actually work on LG webOS? It uses the Wake Lock API which webOS may not support. Check if there's a webOS-specific bridge in the wrapper.
- **Acceptance**: confirm it works on the actual target hardware. If it doesn't, the support page's TV setup checklist is the workaround — but the marketing should reflect "needs the TV settings checklist" rather than implying it Just Works.

### B10. HLS stream tier limits (1 / 3 / unlimited)

- `[ ]` Pricing matrix promises Video=1, Pro=3, Enterprise=unlimited.
- **Verify**: no enforcement exists today. Schema doesn't carry a tier flag.
- **Acceptance**: track under "tier-gating not enforced" — out of scope for this todo. Note in the matrix that these are commercial/honour-system for now if challenged, or build enforcement.

### B11. "Sync groups Pro+ only" gating

- `[ ]` Same situation as B10. Sync toggle is accessible to any account.
- **Acceptance**: same — track under tier enforcement, not here.

---

## C. Quick consistency edits — don't need code reading

### C1. Drop "30-second precision" if it conflicts with B6

- `[ ]` Product page line ~282 says "30-second precision" for scheduling. Once B2 nails down the real precision number, fix this line too.

### C2. Phone hours wording

- `[x]` Done. Support page contact card now says "Mon–Thu 9am–4pm, Fri 9am–12pm UK time".

### C3. Brochure HTML still uses old domain

- `[ ]` `docs/onesign-display-brochure.html` references `display.onesignanddigital.com` already (good) — but cross-check it doesn't also include `onesign-display.vercel.app` anywhere. Search the file.
- **Acceptance**: brochure is single-domain.

### C4. LG submission docs use old domain

- `[ ]` `LG_SUBMISSION_STATUS.md`, `LG_SELLER_LOUNGE_SUBMISSION.md`, and `scripts/verify-lg-submission.mjs` reference `onesign-display.vercel.app`.
- **Decision**: do NOT change these until the domain swap (spawned task #2) is complete and DNS is live. They're correct *today*. They become wrong the day the swap ships.
- **Acceptance**: leave alone; this item gets closed by the domain-swap PR.

---

## D. Operational follow-ups — flagged here so they don't get lost

These aren't code work, but every one is a promise that needs a process behind
it. Owner = Tom unless reassigned.

- `[ ]` **4-hour critical-bug acknowledgement** — needs a real tagged queue (Gmail label or Linear inbox) with a start-clock. Without measurement, the SLA is unenforceable.
- `[ ]` **48-hour fix/workaround** — same: needs an incident log with start/end times.
- `[ ]` **30-day priority go-live support** — needs an `account.go_live_until` column, a triage rule, D+7 and D+21 check-in reminders, a D+30 close-out email. Spec already written in chat.
- `[ ]` **30-day pre-renewal email** — for monthly customers approaching the 90-day launch lock expiry. Schedule at `signup + 60d`.
- `[ ]` **Public roadmap** — pricing FAQ promises feature requests "go on a visible roadmap". Pick a tool (Linear public board, Notion page, GitHub Projects) and publish one.
- `[ ]` **Critical-bug runbook** — the pricing page enumerates what counts/doesn't count as critical. That list needs to become the actual support triage checklist.

---

## Execution order suggestion

For an agent picking this up cold:

1. Run A1, A2 — fast consistency wins. Pure copy edits driven by code reading.
2. Run B2 (smart filename matching) — likely a "delete the line" PR, three-minute fix.
3. Run B3, B4, B5, B6 — bundle into one "marketing feature matrix audit" PR.
4. Run B1, B7, B8, B9 — each may need a small code change or a copy retreat.
5. Run C1, C3 — cleanup once the matrix audit lands.
6. Leave C4 alone until the domain swap PR.

Do not start D (operational items) without Tom — those are commercial decisions.

---

## Reproduced briefs (for spawned-chip dismissals)

If the spawned task chips are dismissed before they're picked up, the briefs
are preserved in the conversation that created this file. Re-spawn or recreate
from there.

# Demo Simulation Environment — Design Spec

## Problem

We need to demo Onesign Display to a buyer who **holds reliability above all else**. He needs to see (a) how the system actually works, (b) that it keeps working when things go wrong, and (c) that it is simple enough for any staff member to operate mid-service.

A slide deck cannot do this. A live demo against real hardware needs a venue, four TVs, and working wifi — none of which exist in a sales meeting. And a hand-waved mock will be smelled instantly by exactly the kind of buyer who cares about reliability.

## Solution

A self-contained, offline-capable simulation: a **3D room** containing a **3-screen synced video wall** plus **one independent screen on a second set**, with a **sticky phone overlay** in the foreground running the control app. The screens run the *real* rendering and sync code. The buyer can trigger failures himself and watch the system recover.

## Core principle — real code, not a mock

This is the decision everything else hangs off. The demo's credibility comes from reusing production code paths rather than reimplementing them:

| Production asset | How the demo uses it |
|---|---|
| `lib/sync/compute-position.ts` | **Verbatim.** It is a pure function taking `syncedNowMs` — we feed it virtual time. This is the sync proof. |
| `lib/html-menus/*` themes | **Verbatim.** `renderMenu(themeKey, contentJson)` produces the exact HTML the TVs show. |
| Manifest JSON contract | **Verbatim shape** (`app/api/player/manifest/route.ts`). |
| Player behaviours (last-known-good cache, backoff, drift correction, auto-resume) | **Reimplemented faithfully** in a demo screen component, mirroring `app/(public)/player/[token]/page.tsx`. |

We do **not** modify production code to serve the demo. `computeSyncPosition` already accepts time as a parameter, so no refactor is required for the part that matters most.

**Honesty rule:** anything simulated is labelled as simulated. The evidence panel (below) shows the real manifest JSON and cites the source file for each mechanism. Overselling once to this buyer kills the deal; "here is the actual function that does it" wins.

---

## Architecture

Four layers, deliberately decoupled so the scene renderer can be swapped:

```
┌─ Scene layer ──────── photo-backplate  OR  full 3D (interchangeable)
├─ Screen layer ─────── ScreenSurface: real player logic, container-agnostic
├─ Control layer ────── Phone overlay + scenario engine + virtual clock
└─ Transport layer ──── DemoDriver: LocalDriver (default) | LiveDriver (real API)
```

### Transport: the swappable driver

```ts
interface DemoDriver {
  getManifest(token: string): Promise<Manifest>
  saveMenu(menuId: string, content: unknown): Promise<{ error: string | null }>
  assignContent(screenId: string, ref: ContentRef): Promise<void>
  setSyncEnabled(setId: string, on: boolean): Promise<void>
  // …mirrors the real server actions 1:1
}
```

- **`LocalDriver`** — in-memory state, zero network, deterministic, instant reset. **Default for demos.**
- **`LiveDriver`** — hits the real `/api/player/manifest` and real server actions against a Supabase demo tenant.

Same UI, same state machine, same rendering on both. This is the killer move: demo on Local (bulletproof), then when he asks *"yeah, but is that real?"* — flip one toggle, open the network tab, and show the identical thing running against the actual backend. You are not asking him to trust the demo; you are showing him the demo and the product are the same code.

---

## Scene layer — two renderers, one screen layer

Both consume the same `scene.config.ts` and the same `ScreenSurface`. Building the abstraction first de-risks the whole project.

### Option A — Photo backplate (recommended to build first)

The reference image *is* the background. Live iframes are CSS-perspective-transformed (`matrix3d`) onto the screen quads in the photo.

- Photoreal, because it is a photograph
- No WebGL, tiny bundle, runs on anything
- **If the reference is a photo of the buyer's own venue, this is devastating** — "here is your restaurant, with your menus on your screens"
- Limitation: fixed camera, no orbit

### Option B — Full 3D (three.js / R3F)

- `three` + `@react-three/fiber` + `@react-three/drei`
- Screens are `<Html transform occlude="blending">` from drei — real live DOM in 3D space via CSS3DRenderer, with WebGL depth punch-through so bezels and props occlude correctly
- Camera orbit, walk-through, room lighting that shifts with the virtual clock (morning → evening) — which sells *scheduling* viscerally
- Cost: ~600KB–1MB gzipped. Must be `dynamic(() => …, { ssr: false })` so it never touches the marketing bundle

**Known limitation (be honest about it):** CSS3D rasterises DOM then transforms it, so menu text softens at oblique angles. Mitigations: supersample the screens (render at 2× and scale), and provide a **front-on camera preset** for the moments when the menu must be legible. Verify R3F v9 / React 19.2 / Next 16 compatibility at install.

### Scene config — "configurable in position"

Not hardcoded geometry. A parametric config:

```ts
export const sceneConfig = {
  room: { width: 8, depth: 6, height: 2.8 },
  camera: { position: [0, 1.6, 4.2], target: [0, 1.8, -2], fov: 42 },
  screens: [
    { id: 'wall-1', setId: 'set-a', indexInSet: 0, position: [-1.30, 2.05, -2.98], rotation: [0,0,0], size: [1.21, 0.68] },
    { id: 'wall-2', setId: 'set-a', indexInSet: 1, position: [ 0.00, 2.05, -2.98], … },
    { id: 'wall-3', setId: 'set-a', indexInSet: 2, position: [ 1.30, 2.05, -2.98], … },
    { id: 'counter', setId: 'set-b', indexInSet: 0, position: [ 3.10, 1.75, -0.40], rotation: [0,-0.6,0], … },
  ],
  anchors: { counter: […], seating: […], entrance: […] },  // scene-dressing slots
}
```

Plus a **layout editor mode** (`?edit=1`): drag/nudge screens against the reference until they match, then copy out the JSON. That is the "configurable in position based on the reference image" requirement done properly — matched by eye, saved as data.

**Scene dressing prep:** define named anchor slots now (counter, seating, entrance, signage), fill with GLTF props or primitives later. Dressing never touches screen or content code.

> Note: the `survey-redraw` skill already has a three.js room-scene pipeline that derives *dimensionally accurate* rooms from survey photos with known measurements. If the reference is a real venue with any known dimension (door height, counter length), route through that for a true-to-scale room rather than eyeballing it.

---

## Screens & sets — mirrors the real data model

The 3+1 layout maps exactly onto `display_screen_sets`:

| | Set A — "Menu Wall" | Set B — "Counter" |
|---|---|---|
| Screens | 3 (`index_in_set` 0,1,2) | 1 |
| `sync_enabled` | `true` | `false` |
| Role in demo | Synced hero content / spanned menu | Independent menu, own schedule |

This matters: what he sees in the room is a literal picture of the rows in the database. And it sets up the best set-level beat — **assign the counter screen into Set A mid-demo and watch it join the sync mid-cycle**, landing on the correct frame without a restart.

---

## The phone — sticky control surface

A `position: fixed` overlay (draggable, dockable left/right, collapsible) holding a device frame with a working mini-app that **mirrors the real app's information architecture and action names** — same screens, same wording, same state transitions as `/app/*`.

It is a purpose-built demo surface, not an iframe of the real dashboard (which needs auth + Supabase + is far too slow for a live pitch). Under `LiveDriver` it fires the *real* server actions, so the distinction narrows to presentation only.

Additions that earn their place:
- **Mirror-to-screen mode** — a phone on a projector is unreadable; let the phone content also render large
- **Tap trail** — briefly highlight each tap so an audience can follow what the presenter did
- **Action stopwatch** — times "price change → visible on screen" and shows the number. Directly answers *"is it simple?"* with evidence: *"mid-service, from your phone: 11 seconds."*

---

## Time — the virtual clock

Everything time-based reads from an injected clock, never `Date.now()` directly.

```ts
virtualClock.now()      // real time, or warped
virtualClock.setRate(n) // 1× … 600×
virtualClock.jumpTo('11:30')
```

`computeSyncPosition` takes `syncedNowMs` as an argument, so the demo drives the real function with virtual time and the whole sync system warps with it — no production change needed.

**Why this is essential:** you cannot wait until 11am in a sales meeting to prove the lunch menu swaps itself. With time-warp, a full trading day passes in 20 seconds: breakfast → lunch → afternoon → evening, menus changing themselves, room lighting shifting with it. Scheduling becomes something he *watches happen* rather than something you describe.

---

## Scenarios

### Guided beats (keyboard-shortcut driven, no fumbling)

1. **Sync** — three screens as one canvas. Then the proof that matters: **kill one screen mid-playlist and bring it back.** It snaps to the exact correct frame instantly, because position is *computed from a shared epoch*, not sequentially played. Show the clock offset in ms. This is the single most convincing reliability beat we have.
2. **Playlists** — reorder, change durations, switch transition type from the phone; watch it propagate.
3. **Scheduling** — time-warp a full day. Dayparts swap themselves.
4. **Editable menus** — change a price on the phone → real `renderMenu()` → new HTML on the wall. Do it on Set A and Set B independently to prove isolation.
5. **Sets** — move the counter screen into the wall's set; it joins the sync mid-cycle.

### Break-it mode — hand him the laptop

The most persuasive thing we can do for this buyer is **stop performing recovery and let him cause the failure.** A panel of destructive buttons, each with a live recovery timer:

| He triggers | What he sees (real behaviour) |
|---|---|
| Cut the wifi | Screens keep playing from last-known-good manifest (`localStorage`). Retry backoff counter ticks up. |
| Restore the wifi | Reconnect, catch up, resync. Recovery time shown in seconds. |
| Power-cut a screen | Black → boots → auto-resume (real `AUTO_RESUME_KEY` path) → rejoins sync on the correct frame. |
| Kill the server | All screens continue. Nothing blanks. |
| Push a broken menu | Last good render stays on screen; error surfaces in the app, not on the wall. *(Requires fix #2 below — currently this blanks the board.)* |
| Expire signed URLs | 12-hour refresh path fires; media keeps playing. |
| Pause the plan | Screens go to a defined empty state, not garbage. |

Unscripted, self-inflicted, recoverable. Far stronger than "and now watch it recover".

---

## Evidence panel — "behind the glass"

A slide-out panel for the sceptic, showing live and computed (never faked):

- The actual manifest JSON for the selected screen
- `computeSyncPosition` output per screen: slide index, elapsed ms, transition progress
- Measured clock offset and drift per screen, in ms
- Retry state, backoff delay, last successful fetch
- Recovery timings from break-it mode
- Source-file citation per mechanism (`lib/sync/compute-position.ts:46`)

This is what converts an engineer-minded buyer: not the pretty room, but the numbers underneath it.

---

## Real-app gaps this demo exposes

Building the demo surfaces four genuine issues in the HTML-menu path — the area flagged as *"a quick addition, not thoroughly tested"*. Two are reliability bugs worth fixing regardless of the demo.

| # | Issue | Evidence | Fix |
|---|---|---|---|
| 1 | ~~**Menu edits take up to 60s to reach a screen**~~ ✅ **fixed** | `POLL_INTERVAL_MS` was 60s. The poll already hit the lightweight `/api/player/refresh` version check — the latency was purely the interval. | Poll interval dropped to 10s (limiter raised 6→15/min to match); the full manifest is still only fetched when `should_refresh` is true, so per-screen load stays trivial. Worst-case propagation is now ~10s. A Realtime push channel remains the eventual upgrade; the poll stays as its fallback. |
| 2 | ~~**A render failure blanks the board**~~ ✅ **fixed** | `saveAndRenderMenu` wrote `rendered_html: result.html`, which is `null` on failure; the manifest then omits `html_menu` and the screen falls through to nothing, because content resolution is an else-if chain already committed to the menu branch | A failed render now leaves `content_json` and `rendered_html` untouched, records `render_error`, and returns the error to the editor — the last good menu keeps playing. `createMenu` throws rather than creating a menu that would blank a screen. |
| 3 | ~~**Menu swaps flash**~~ ✅ **fixed** | `<HtmlSlide>` swapped `srcDoc` in place — a blank beat on every mid-service price change | Rebuilt as two persistent iframe slots: the incoming document loads hidden and crossfades in (400ms) only once parsed, with rapid-successive-update races handled. Same layering idea as the playlist A/B system. |
| 4 | ~~**Menus depend on Google Fonts at render time**~~ ✅ **fixed** | Theme shell preconnected to `fonts.googleapis.com` / `fonts.gstatic.com` and loaded Cormorant Garamond + Inter over the wire. The theme CSP pinned `font-src` to `fonts.gstatic.com` only, so a self-hosted fallback was not merely absent but *forbidden*. A venue outage silently dropped customer-facing menus to system fonts while the screen otherwise kept playing. | Both families are now self-hosted from `public/fonts/menus` (6 variable-font files, 272 KB, one-year immutable cache) and the CSP is `font-src 'self'`. Verified in Chromium with every external host blocked: fonts load, zero CSP violations, zero external requests. |

All four are now fixed on this branch.

> **Test suite status:** `vitest` is now a declared devDependency with `npm test` / `npm run test:watch` scripts, and the whole suite passes (174 tests). The 11 pre-existing failures were repaired: the ping tests had drifted behind the route's status-transition logic, the stream-manifest tests were leaking the route's per-screen cache between cases (fixed with unique screen ids per test), and the user-management tests were *correct* — the action was leaking raw DB error strings to the client, which is now fixed in the action. CI wiring remains open.

---

## Demo build status (first working cut — `/demo`)

Implemented, verified end-to-end in Chromium (`scripts/demo-e2e.mjs`):

- **Scene** — placeholder venue wall + floor; **Edit layout** mode with mount/drag/resize/rotate/delete; positions stored as wall fractions; drop or load a **reference photo** as the backdrop at any time (positions survive the swap). Layout + all state persist in localStorage.
- **The USB journey** — a mounted display walks the real provisioning arc: dead panel → `NO SIGNAL · HDMI 1` → *Insert Onesign USB* → boot splash → **pairing code on the TV** → claimed from the phone (name + set) → "Connected — waiting for content" → content live. A paired stick auto-resumes through power cuts, exactly like the webOS app's stored-token flow. *(Note: the demo models code-on-TV claiming — Chromecast-style — where today's TV app asks the installer to type the token. The `pairing_code` column already exists on `display_screens`; recommend adopting the demo's flow as the real onboarding.)*
- **ScreenSurface** — a faithful mini-player: manifest fetch against the driver with last-known-good cache "on the stick", exponential backoff, OFFLINE·cached badge with retry countdown, instant-on from cache, push-refresh on `refresh_version` bumps, poll as backstop. Playlist position computed by the **real `computeSyncPosition()`** driven by the virtual clock; menus render in scaled `srcdoc` iframes from the **real `renderMenu()`** via `/api/demo/render-menu`.
- **Control phone** — draggable/collapsible, always on its own "mobile data": pair screens, assign menus/playlists, move screens between sets mid-cycle, per-set **Sync toggle**, menu editors for both Uncle's themes (names + prices) with save-and-publish through the real render pipeline (a failed render keeps the last good version live — same semantics as the fixed production action), and an Activity feed timestamped by the virtual clock.
- **Presenter bar** — virtual clock (1×/60×/600×), venue-wifi cut (W), edit layout (E), **Quick start** (empty room → provisioned 3+1 in one click, for recovery mid-pitch), Reset.
- **Proven beats** (all asserted in the E2E): synced wall; **power-cut a synced screen → boots → rejoins on the correct frame**; phone price edit → real render → live on the counter screen; venue-wifi cut → all screens keep playing cached content under honest OFFLINE badges while the phone stays fully operational.

Still to come: the reference-image scene pass (Phase 2 proper), scheduling/daypart beats on the time-warp, break-it panel as a first-class UI, evidence panel, full 3D room (Phase 5).

---

## Presenter hardening

The demo must be **more reliable than the product it is selling**. A stutter in front of this buyer is fatal.

- **Fully offline.** All assets bundled, no CDN, no fonts over the wire. A demo about offline resilience that needs wifi is an own-goal.
- **Reset to known state in under a second**, bound to a key.
- **Keyboard shortcuts** for every beat; no menu-hunting mid-sentence.
- **Audio off by default.** No autoplay surprises.
- **Quality presets** — cap DPR, pause offscreen screens, limit concurrent video. Must run on the presenting laptop and at 1080p on a projector.
- **Flat mode** — a 2D grid of the same four screens, no WebGL. Instant fallback if the machine struggles, and genuinely better for close-up mechanical explanation.
- **Presenter notes** per scenario, toggleable.

---

## Phasing

| Phase | Deliverable |
|---|---|
| 0 | Decisions, skeleton, `DemoDriver` + `LocalDriver`, virtual clock, flat mode working |
| 1 | `ScreenSurface` (real player logic) + real sync across 3+1 screens, still flat |
| 2 | Scene layer — photo backplate from the reference, screens positioned, layout editor |
| 3 | Phone control surface + menu editing → propagation |
| 4 | Scenarios incl. break-it mode + evidence panel |
| 5 | Full 3D scene + dressing (optional/parallel — flat and backplate already sell) |
| 6 | Presenter hardening, offline packaging, dry run on the actual laptop |

Parallel track: real-app fixes #1–#4.

Flat mode ships in Phase 0 so there is something demonstrable immediately, and it doubles as the permanent fallback.

---

## What I need from the reference image

To build the scene config accurately:

1. **What it is** — the buyer's actual venue, a generic reference, or a mood/style target?
2. **Any known real dimension** — door height, counter length, screen model/size. One known measurement lets us scale the whole room correctly.
3. **Screen geometry** — the 3 screens: landscape or portrait? Bezel-to-bezel video wall, or spaced apart with gaps? Are they one spanned canvas or three independent 16:9 frames?
4. **The 4th screen** — where in the room, and what is it *for* in the story (counter menu, promo, till-side upsell)?
5. **Viewpoint** — customer-entering-the-room, or behind-the-counter staff view?

## Open questions

- **Set A content model:** three independent 16:9 screens showing coordinated content, or one 5760×1080 canvas spanned across three? Changes the theme authoring and the sync story. Current themes are authored at 1920×1080, which suits the former.
- **Does he need to touch it himself?** If yes, break-it mode becomes the centrepiece and the phone needs to be genuinely usable by a stranger, not just by a presenter who knows the path.
- **Live tenant:** do we stand up a real Supabase demo tenant for `LiveDriver`, or is `LocalDriver` + the source-code walkthrough sufficient proof?

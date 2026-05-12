# Onesign Display — LG webOS Wrapper

Minimal native wrapper that loads the hosted Onesign Display player inside an LG TV's webOS app shell. Solves smart-TV sleep issues by running as a native app instead of a browser tab.

## What it is

A ~5 KB shell consisting of:
- `appinfo.json` — webOS app manifest
- `index.html` — entry HTML: setup screen + iframe-loaded player + remote-key handling
- `icon.png` / `largeIcon.png` / `splashBackground.png` — visual assets (you provide)

The wrapper does the **bare minimum**: prompt for a pairing token on first launch, store it locally, then iframe the hosted player at `https://onesign-display.vercel.app/player/<token>`. All keep-awake, fullscreen, media-session, and watchdog logic lives in the hosted player — the wrapper just unlocks the native APIs the browser can't reach.

## Required assets to add before building

Drop these into this folder (`webos-app/`):

| File | Size | Source |
|------|------|--------|
| `icon.png` | 80×80 PNG, transparent background | From the OD icon mark — `public/od-icon.png` rescaled |
| `largeIcon.png` | 130×130 PNG, transparent background | Same source, rescaled |
| `splashBackground.png` | 1920×1080 PNG | Black background with OD wordmark centered |

All three should be square/transparent except `splashBackground.png`. Use the existing brand assets in `/public` as the source.

## Build & install — first-time setup

### 1. Install LG webOS CLI

```powershell
npm install -g @webosose/ares-cli
```

### 2. Enable Developer Mode on the target TV

1. On the LG TV, install the **Developer Mode** app from the LG Content Store
2. Open it, log in with an LG Developer account (create one free at [webostv.developer.lge.com](https://webostv.developer.lge.com/))
3. Enable Dev Mode — the TV will reboot
4. Note the TV's IP address shown in the Developer Mode app
5. Note the **passphrase** shown in the same app

### 3. Register the TV with ares-cli

```powershell
ares-setup-device
```

Select "Add", give it a name like `tv-livingroom`, enter the IP, username `prisoner`, no password, set the SSH key from the passphrase via the Developer Mode app's "Key Server" button.

Test the connection:

```powershell
ares-device-info -d tv-livingroom
```

### 4. Package the app

From the project root (one level above this folder):

```powershell
ares-package webos-app
```

This produces `com.onesignanddigital.display_1.0.0_all.ipk` in the current directory.

### 5. Install on the TV

```powershell
ares-install -d tv-livingroom com.onesignanddigital.display_1.0.0_all.ipk
```

### 6. Launch

```powershell
ares-launch -d tv-livingroom com.onesignanddigital.display
```

Or use the TV remote to find "Onesign Display" in the app launcher.

## Updating the app on an installed TV

Increment `version` in `appinfo.json`, then re-run steps 4 + 5. The installer overwrites in place; the pairing token persists in localStorage so no re-setup needed.

## Notes on production distribution

- **Developer Mode session expires every 50 hours** on consumer LG TVs. Sideloaded apps keep running, but you can't push updates until Dev Mode is renewed. For production fleet deployment, use the LG Content Store route (see `../LG_SELLER_LOUNGE_SUBMISSION.md`).
- **The wrapper rarely needs updating** because the actual player code is served from `onesign-display.vercel.app`. Push a new Vercel deploy and every installed TV picks it up on next refresh.
- **The setup screen and re-pair gesture are intentionally minimal** — they run once per TV install and then never again.

## Testing checklist

Before submitting to the LG Content Store, verify on a real TV:

- [ ] App auto-launches from cold boot (verify `launchOnBoot` in `appinfo.json` if enabling that)
- [ ] Setup screen accepts a token via remote arrow keys + OK button
- [ ] Player loads after token entry and shows assigned content
- [ ] Screen stays on for 4+ hours of continuous playback (after disabling TV's Auto Power Off in Settings → General → Eco)
- [ ] Back button does NOT exit the app accidentally
- [ ] Long-press any remote button for 5 seconds shows the reset confirmation modal
- [ ] Reset modal "Cancel" closes the modal without changing the stored token
- [ ] Reset modal "Reset" clears the token and returns to setup screen
- [ ] Network drop and recovery: pull WiFi for 60s, plug back in — player should reconnect within 30s
- [ ] TV power-cycle: app should be available in launcher on reboot (auto-launch is a separate flag)

## Architecture decisions

**Why iframe the hosted player instead of bundling?** Updates happen via Vercel deploys with zero TV interaction. Offline operation would need bundled assets + sync logic — significant work for a feature most signage clients don't need.

**Why no Luna service calls (e.g. `com.webos.service.tvpower`)?** Consumer LG TVs restrict third-party access to most Luna services. The standard Wake Lock API (which the hosted player already uses) works on WebOS 6+ and degrades gracefully on older sets. Adding Luna calls would add complexity for limited gain.

**Why no offline cache?** The hosted player already keeps a cached manifest in `localStorage` and shows it when the network drops. Bundling assets locally would duplicate that work.

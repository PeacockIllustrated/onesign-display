# scripts/

Helpers for the LG webOS workflow.

## LG Content Store submission

| Script | npm alias | Purpose |
|--------|-----------|---------|
| `generate-lg-assets.mjs` | `npm run lg:assets` | Build launcher icons, splash, and store images from the brand SVGs |
| `verify-lg-submission.mjs` | `npm run lg:verify` | 20-check pre-flight before submitting to Seller Lounge |
| `generate-ux-scenario-pdf.py` | — | Regenerate `webos-app/store-assets/ux-scenario.pdf` for LG QA review |

## LG TV remote control (paired TVs)

For TVs that have **Settings → Network → Network IP Control → ON** with a pairing code.

| Script | npm alias | Purpose |
|--------|-----------|---------|
| `tv-pair.py` | `npm run tv:pair` | One-time: pair with a TV using the webOS websocket. Writes `webos-tv-keys.json` |
| `tv-keepalive.py` | `npm run tv:keepalive` | Long-running daemon — emits invisible mouse jitter every 60s on every paired TV, defeats Auto Power Off |
| `tv-prevent-sleep.py` | — | Attempts to disable sleep settings directly via API (requires LG-signed app — usually denied on consumer TVs) |
| `tv-diagnose.py` | — | SSH into paired TVs and inspect developer environment |
| `tv-install-bypass.py` | — | Install `.ipk` via SFTP + Luna service (bypass for locked-down Dev Mode TVs) |
| `probe-ipctl.py` | — | Probe LG Network IP Control protocols to identify TV firmware |

### TV pairing — one-time setup

1. On each TV: **Settings → Network → Network IP Control → On**. Note the 8-character code displayed.
2. Edit `tv-pair.py` and add the TV's IP and code to the `TVS` list.
3. Run `npm run tv:pair`.
4. The TVs will accept the connection (PROMPT mode) and return a persistent `client_key` saved to `webos-tv-keys.json`.

`webos-tv-keys.json` is gitignored — it contains credentials that grant network control over the paired TVs, so treat it like a password.

### Running the keepalive

```powershell
npm run tv:keepalive
```

Connects to every TV in `webos-tv-keys.json`, opens the pointer input socket on each, and emits an invisible 1-pixel mouse move every 60 seconds. Also polls power state every 30 seconds. Auto-reconnects on network blips. Defeats the 4-hour Auto Power Off timer indefinitely.

**For production deployment:** run on an always-on device on the same LAN as the TVs (a Raspberry Pi, a mini-PC, or a Windows Task Scheduler entry set to "run at startup"). A laptop that goes to sleep will pause the keepalive.

### Sideload (advanced — typically blocked on newer webOS)

`sideload-tvs.ps1` runs the standard ares-cli flow but requires Developer Mode permissions that webOS 26+ TVs increasingly lock down. If it fails with `/media/developer/temp Permission denied`, use Cloud Test Lab or the Content Store install path instead.

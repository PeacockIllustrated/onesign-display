# Screens Player box setup (Android stick + Fully Kiosk)

> **This is the standard way to run a screen.** Every venue gets a Screens Player box, set up and paired in Gateshead before it ships. The TV is only a monitor. A TV's own browser is a best-effort fallback for trials, because TV browsers vary by model and year and most can't be managed remotely. When a screen fails, swap the box rather than diagnosing the TV.
>
> The rest of this guide was written for the H96 Max and applies to any Android stick.

The H96 Max ships with a stock AOSP browser that's too old to render modern CSS (it's typically Chromium 80–90, no auto-updates). Don't use it. Install **Fully Kiosk Browser** instead — it bundles a recent Chromium WebView, gives you proper kiosk lockdown, and is what every digital-signage operator uses for cheap Android sticks.

This is the per-device setup. Allow ~15 minutes per stick the first time, ~5 minutes once you know the steps.

---

## What you need

- The H96 Max stick, plugged into the TV via HDMI
- Wi-Fi credentials for the venue
- A Bluetooth or USB mouse (the H96 remote is fiddly for setup)
- Access to the screen's page in the Onedesign Screens portal (to pair the box with a code)
- Fully Kiosk Browser licence — £40 one-off per device
  Buy at: https://www.fully-kiosk.com → "Get a License"
  (Save the email receipt — it contains the licence key)

---

## 1 · First-time stick prep (5 min)

1. Boot the stick. Skip the launcher tutorial.
2. **Settings → Network** → connect to the venue Wi-Fi.
3. **Settings → Date & Time** → enable automatic time/timezone.
4. **Settings → Device Preferences → About → System Update** → install any pending updates.
5. Open the **Play Store**, sign in with a Google account dedicated to your client devices (or your own — see "Bulk deploy" below).
6. Search **Chrome** and update it (this becomes the system WebView, which Fully Kiosk uses).

---

## 2 · Install Fully Kiosk Browser (3 min)

1. In the Play Store search **Fully Kiosk Browser** by Fully Factory.
2. Install. Open it. Grant the permissions it asks for (network, overlay, device admin — all needed for kiosk mode).
3. **Settings → License** (gear icon → scroll down) → paste the licence key from your purchase email.
   The "PLUS" features unlock immediately.

---

## 3 · Point it at the player and pair it (2 min)

1. **Settings → Web Content Settings → Start URL** → `https://onesign-display.vercel.app/pair`
   (the same URL for every box; no token to type).
2. Start the browser. The box shows a six-character code like `K7Q-29P`.
3. In the portal, open the screen, type the code under **Pair a TV** and press **Pair**.
   The box picks up its screen within a few seconds and remembers it, so `/pair`
   goes straight to the player on every later boot.
4. To move a box to a different screen, open `/pair?new` on it and pair again.
5. **Settings → Web Content Settings → Wait for Internet Access on Start** → ON.
6. **Settings → Web Auto Reload → Auto Reload on Idle** → 0 (disable; the player polls itself).
7. **Settings → Web Auto Reload → Reload on Network Recovery** → ON.
8. **Settings → Remote Administration (PLUS)** → ON, with a password. This lets us reload,
   restart or screenshot the box from the office instead of visiting.

Once it has played its content once, the player keeps a copy on the box, so it carries
on showing the menu (and survives a restart) if the venue's internet drops.

---

## 4 · Lock it down (5 min)

These settings stop guests / staff from exiting the player.

**Settings → Universal Launcher**
- Disable Universal Launcher (you don't want a fallback launcher on screen).

**Settings → Kiosk Mode (PLUS)**
- Enable Kiosk Mode → ON
- Set a Kiosk PIN (four digits — write it down; needed to exit)
- Disable Status Bar → ON
- Disable Address Bar → ON
- Disable Settings Activity → ON

**Settings → Device Management**
- Keep Screen On (when plugged in) → ON
- Force Screen Orientation → Landscape
- Use Immersive Mode → ON

**Settings → Power Management**
- Screen Off Timer → 0 (never)
- Schedule Screen Off → leave blank unless the venue wants night shutdown

**Settings → Auto Launch**
- Launch on Boot → ON
- Auto Launch Delay → 5000 ms (gives Wi-Fi time to come up)

---

## 5 · Set up the TV itself (2 min)

The player can stop the box sleeping, but not the TV. On the TV:

- Turn **off** any sleep timer, eco "auto power off" and "no signal" standby.
- Turn **on** HDMI-CEC (Anynet+ on Samsung, SimpLink on LG, Bravia Sync on Sony), so the TV
  wakes and switches to the box's input when the box powers up.
- Set the input to the box's HDMI port and, where the TV allows, make it the input it starts on.
- Plug the box into mains power with its own adapter, not the TV's USB port (USB power drops
  when the TV goes to standby and the box reboots).

---

## 6 · Test the autostart

1. Reboot the stick (hold power on the remote, or pull the USB and plug back in).
2. After ~30 seconds you should see the player full-screen with the assigned content.
3. If it shows a pairing code again, it was never paired; pair it in the portal.
4. In the portal, the screen's **Device** card should say "Good" and "Works offline: Yes" after it has played for a minute.

---

## 7 · Sanity-check the player

- Trigger a content swap from the admin (edit a price or change the assigned media).
- Within 60 seconds the screen should update.
- If it doesn't, reload manually: PIN → exit → tap reload, then re-enter kiosk.

---

## Bulk deploy (for 5+ devices)

Doing this 30 times by hand is painful. Two options:

**Easy:** Fully Kiosk has a **MDM Cloud** ($1.99/device/month) that lets you push settings + URL to every stick from a web dashboard. Worth it once you cross ~10 devices.

**Free:** Set one stick up perfectly, then **Settings → Backup/Restore → Backup Settings** → save the `.json`. On each new stick, install Fully Kiosk, paste licence, then **Restore Settings** with that file. Only the player URL changes per stick.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Black screen on boot | Start URL not set, or Wi-Fi not yet up | Check Start URL; raise Auto Launch Delay to 10000 ms |
| Player loads but content doesn't change | Paired to the wrong screen, or stick clock skewed | Open `/pair?new` and pair again; force time auto-sync |
| Device card says "At risk" | Browser too old | Update Chrome/WebView from the Play Store, or swap the box |
| Renders fine but fonts look wrong | Google Fonts CDN blocked on venue Wi-Fi | Whitelist `fonts.googleapis.com` + `fonts.gstatic.com`, or report back so we can self-host the fonts |
| Crashes / restarts every few hours | Cheap stick running out of RAM | **Settings → Device Management → Restart App on Crash** → ON; consider upgrading to a more reputable stick (Onn 4K, Mecool KM2 Plus, Walmart Onn Streaming Box) |
| Can't get out of kiosk | You set a PIN and forgot it | Boot into recovery and factory-reset; this is why you should record the PIN |

---

## When NOT to use this approach

If you scale past ~50 deployed devices and want a branded Screens Player experience that doesn't say "Fully Kiosk" anywhere, switch to a Capacitor-built APK that we own. That's a separate piece of work — Tom can flag it when you're ready.

---

## Stick recommendations

The H96 Max works but is the bottom of the barrel. If a venue is buying new, recommend instead (in order of price):

1. **Walmart Onn 4K Streaming Box** (£25) — proper Android TV, auto-updating Chromium, the de-facto signage stick
2. **Mecool KM2 Plus** (£60) — Netflix-certified, more reliable Wi-Fi
3. **Amazon Fire TV Stick 4K** (£45) — works but Fully Kiosk needs sideloading via ADB; bonus only if you already know Fire OS

The H96 family is fine *with Fully Kiosk*. Without it, every model in that price bracket has the same broken-CSS problem.

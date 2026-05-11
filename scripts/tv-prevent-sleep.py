"""Connect to both LG TVs using the saved client_keys and disable every power-
saving / auto-power-off / screen-saver setting we can reach via the webOS API.

This is the equivalent of going into Settings → General → Eco on each TV
and toggling everything OFF — done remotely in one pass.
"""

import asyncio
import json
import os
import ssl
import uuid

import websockets

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEYS_FILE = os.path.join(ROOT, "webos-tv-keys.json")

# Settings we want to query and disable. The webOS settingsservice uses
# category + key pairs. Different webOS versions use different keys — we
# attempt all known variants and report which ones the TV accepted.
SETTINGS_TO_DISABLE = [
    # category, key, target_value, friendly description
    ("option", "powerOnLight", False, "Power-on-light"),
    ("option", "automaticPowerOff", False, "Auto Power Off (4-hour idle shutdown)"),
    ("option", "automaticDisplayOff", False, "Auto Display Off"),
    ("option", "noSignalAutoPowerOff", False, "No Signal Auto Power Off"),
    ("option", "screenOff", False, "Screen Off"),
    ("option", "energySaving", "off", "Energy Saving"),
    ("option", "energySavingStep", "off", "Energy Saving Step"),
    ("option", "energySavingTV", "off", "Energy Saving (TV picture)"),
    ("option", "smartEnergySaving", False, "Smart Energy Saving"),
    ("option", "screenSaver", False, "Screen Saver"),
    ("option", "ECOMode", False, "Eco Mode"),
    ("option", "simplinkAutoPowerOff", False, "SIMPLINK Auto Power Off"),
    ("option", "simplink", False, "SIMPLINK / HDMI-CEC"),
    ("option", "noSignalPowerOff", False, "No Signal Power Off"),
    ("option", "AutoStandby", False, "Auto Standby"),
    ("picture", "energySaving", "off", "Picture Energy Saving"),
    ("picture", "energySavingStep", "off", "Picture Energy Saving Step"),
]


async def control_tv(name, host, client_key):
    label = f"[{name}@{host}]"
    print(f"\n{label} connecting...")
    ssl_ctx = ssl.create_default_context()
    ssl_ctx.check_hostname = False
    ssl_ctx.verify_mode = ssl.CERT_NONE

    try:
        async with websockets.connect(
            f"wss://{host}:3001", ssl=ssl_ctx, max_size=2**24, open_timeout=10
        ) as ws:
            # Register with stored client key
            await ws.send(json.dumps({
                "type": "register",
                "id": "auth_" + uuid.uuid4().hex[:8],
                "payload": {
                    "forcePairing": False,
                    "pairingType": "PROMPT",
                    "client-key": client_key,
                    "manifest": {
                        "manifestVersion": 1,
                        "permissions": ["WRITE_SETTINGS", "READ_POWER_STATE", "CONTROL_POWER"],
                    },
                },
            }))

            # Wait for registered confirmation
            for _ in range(5):
                raw = await asyncio.wait_for(ws.recv(), timeout=15)
                msg = json.loads(raw)
                if msg.get("type") == "registered":
                    print(f"{label} authenticated via stored client_key")
                    break
                if msg.get("type") == "error":
                    print(f"{label} auth failed: {msg.get('payload')}")
                    return

            async def request(uri, payload=None):
                req_id = "req_" + uuid.uuid4().hex[:8]
                await ws.send(json.dumps({
                    "type": "request",
                    "id": req_id,
                    "uri": uri,
                    "payload": payload or {},
                }))
                # Wait for matching response
                for _ in range(10):
                    raw = await asyncio.wait_for(ws.recv(), timeout=8)
                    msg = json.loads(raw)
                    if msg.get("id") == req_id:
                        return msg
                return None

            # 1. Query the current state of each setting we plan to change
            print(f"{label} querying current settings...")
            current = {}
            categories = sorted({c for c, _, _, _ in SETTINGS_TO_DISABLE})
            for cat in categories:
                resp = await request(
                    "ssap://settings/getSystemSettings",
                    {"category": cat, "keys": [k for c, k, _, _ in SETTINGS_TO_DISABLE if c == cat]},
                )
                if resp and resp.get("payload", {}).get("returnValue"):
                    current[cat] = resp["payload"].get("settings", {})
                    print(f"{label}   {cat}: {json.dumps(current[cat])[:200]}")

            # 2. Set each setting (only those the TV recognises will accept)
            print(f"{label} disabling sleep-related settings...")
            changed = []
            for cat, key, target, desc in SETTINGS_TO_DISABLE:
                resp = await request(
                    "ssap://settings/setSystemSettings",
                    {"category": cat, "settings": {key: target}},
                )
                payload = resp.get("payload", {}) if resp else {}
                ok = payload.get("returnValue", False)
                err = payload.get("errorText", "")
                if ok:
                    print(f"{label}   OK   {cat}.{key} -> {target}  ({desc})")
                    changed.append((cat, key, target))
                elif err and "no permission" in err.lower():
                    print(f"{label}   PERM {cat}.{key}  ({desc})")
                elif err and "unsupported" in err.lower():
                    pass  # silent — setting doesn't exist on this firmware
                elif err:
                    print(f"{label}   FAIL {cat}.{key}: {err[:80]}")

            # 3. Wake the screen, just in case it was dimmed
            r = await request("ssap://com.webos.service.tvpower/power/turnOnScreen")
            if r and r.get("payload", {}).get("returnValue"):
                print(f"{label} screen woken via turnOnScreen")

            print(f"{label} done — {len(changed)} settings changed")
            return changed

    except Exception as e:
        print(f"{label} ERROR: {type(e).__name__}: {e}")
        return None


async def main():
    with open(KEYS_FILE) as f:
        keys = json.load(f)
    for name, info in keys.items():
        await control_tv(name, info["host"], info["client_key"])


if __name__ == "__main__":
    asyncio.run(main())

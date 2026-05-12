"""Pair with both LG TVs via webOS websocket using the IP Control PIN, and save
the resulting client_keys to webos-tv-keys.json for later use.

The 8-character codes from "Network IP Control" mode are PINs for webOS's
PROMPT_PIN pairing flow on port 3000. Once paired, we get a client_key (long
hex) that authenticates all future control commands.
"""

import asyncio
import json
import os
import ssl
import sys
import uuid

import websockets

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEYS_FILE = os.path.join(ROOT, "webos-tv-keys.json")

TVS = [
    {"name": "screen1", "host": "192.168.0.39", "pin": "ZXK692SH"},
    {"name": "screen2", "host": "192.168.0.99", "pin": "49Q0E2Z3"},
]

# Standard webOS pairing manifest — declares which permissions we want.
MANIFEST = {
    "manifestVersion": 1,
    "appVersion": "1.1",
    "signed": {
        "created": "20140509",
        "appId": "com.lge.test",
        "vendorId": "com.lge",
        "localizedAppNames": {"": "LG Remote App", "ko-KR": "리모컨", "zxx-XX": ""},
        "localizedVendorNames": {"": "LG Electronics"},
        "permissions": [
            "TEST_SECURE",
            "CONTROL_INPUT_TEXT",
            "CONTROL_MOUSE_AND_KEYBOARD",
            "READ_INSTALLED_APPS",
            "READ_LGE_SDX",
            "READ_NOTIFICATIONS",
            "SEARCH",
            "WRITE_SETTINGS",
            "WRITE_NOTIFICATION_ALERT",
            "CONTROL_POWER",
            "READ_CURRENT_CHANNEL",
            "READ_RUNNING_APPS",
            "READ_UPDATE_INFO",
            "UPDATE_FROM_REMOTE_APP",
            "READ_LGE_TV_INPUT_EVENTS",
            "READ_TV_CURRENT_TIME",
        ],
        "serial": "2f930e2d2cfe083771f68e4fe7bb07",
    },
    "permissions": [
        "LAUNCH",
        "LAUNCH_WEBAPP",
        "APP_TO_APP",
        "CLOSE",
        "TEST_OPEN",
        "TEST_PROTECTED",
        "CONTROL_AUDIO",
        "CONTROL_DISPLAY",
        "CONTROL_INPUT_JOYSTICK",
        "CONTROL_INPUT_MEDIA_RECORDING",
        "CONTROL_INPUT_MEDIA_PLAYBACK",
        "CONTROL_INPUT_TV",
        "CONTROL_POWER",
        "READ_APP_STATUS",
        "READ_CURRENT_CHANNEL",
        "READ_INPUT_DEVICE_LIST",
        "READ_NETWORK_STATE",
        "READ_RUNNING_APPS",
        "READ_TV_CHANNEL_LIST",
        "WRITE_NOTIFICATION_TOAST",
        "READ_POWER_STATE",
        "READ_COUNTRY_INFO",
    ],
    "signatures": [
        {
            "signatureVersion": 1,
            "signature": "eyJhbGdvcml0aG0iOiJSU0EtU0hBMjU2Iiwia2V5SWQiOiJ0ZXN0LXNpZ25pbmctY2VydCIsInNpZ25hdHVyZVZlcnNpb24iOjF9.hrVRgjCwXVvE2OOSpDZ58hR+59aFNwYDyjQgKk3auukd7pcegmE2CzPCa0bJ0ZsRAcKkCTJrWo5iDzNhMBWRyaMOv5zWSrthlf7G128qvIlpMT0YNY+n/FaOHE73uLrS/g7swl3/qH/BGFG2Hu4RlL48eb3lLKqTt2xKHdCs6Cd4RMfJPYnzgvI4BNrFUKsjkcu+WD4OO2A27Pq1n50cMchmcaXadJhGrOqH5YmHdOCj5NSHzJYrsW0HPlpuAx/ECMeIZYDh6RMqaFM2DXzdKX9NmmyqzJ3o/0lkk/N97gfVRLW5hA29yeAwaCViZNCP8iC9aO0q9fQojoa7NQnAtw==",
        }
    ],
}


async def pair_with_tv(tv):
    label = f"[{tv['name']}@{tv['host']}]"
    print(f"\n{label} connecting...")
    ssl_ctx = ssl.create_default_context()
    ssl_ctx.check_hostname = False
    ssl_ctx.verify_mode = ssl.CERT_NONE

    # Try unencrypted first (port 3000); fall back to TLS (port 3001) if needed
    urls = [(f"ws://{tv['host']}:3000", None), (f"wss://{tv['host']}:3001", ssl_ctx)]

    for url, ctx in urls:
        try:
            kwargs = {"ssl": ctx} if ctx else {}
            async with websockets.connect(url, max_size=2**24, **kwargs) as ws:
                print(f"{label} connected via {url}")

                # 1. Initial register with PROMPT_PIN pairing type
                register_id = "register_" + uuid.uuid4().hex[:8]
                register_msg = {
                    "type": "register",
                    "id": register_id,
                    "payload": {
                        "forcePairing": False,
                        "pairingType": "PROMPT",  # try PROMPT first (most common)
                        "manifest": MANIFEST,
                        "client-key": None,
                    },
                }
                await ws.send(json.dumps(register_msg))

                client_key = None
                pin_sent = False
                # Read messages until we get a client-key or terminal error
                while True:
                    try:
                        raw = await asyncio.wait_for(ws.recv(), timeout=20)
                    except asyncio.TimeoutError:
                        print(f"{label} timeout waiting for response")
                        break
                    msg = json.loads(raw)
                    msg_type = msg.get("type")
                    payload = msg.get("payload", {})
                    print(f"{label} <- type={msg_type} payload={json.dumps(payload)[:200]}")

                    if msg_type == "response" and payload.get("pairingType") == "PIN":
                        # TV wants a PIN, send ours
                        if not pin_sent:
                            print(f"{label} TV requested PIN, sending {tv['pin']}...")
                            await ws.send(json.dumps({
                                "type": "request",
                                "id": "set_pin_" + uuid.uuid4().hex[:8],
                                "uri": "ssap://pairing/setPin",
                                "payload": {"pin": tv["pin"]},
                            }))
                            pin_sent = True
                        continue

                    if msg_type == "registered":
                        client_key = payload.get("client-key")
                        print(f"{label} PAIRED - client_key={client_key}")
                        break
                    if msg_type == "error":
                        print(f"{label} ERROR: {payload}")
                        # Continue waiting in case there's more info
                        break

                if client_key:
                    return client_key
        except Exception as e:
            print(f"{label} {url} failed: {type(e).__name__}: {e}")
            continue

    return None


async def main():
    keys = {}
    if os.path.exists(KEYS_FILE):
        with open(KEYS_FILE) as f:
            keys = json.load(f)

    for tv in TVS:
        ck = await pair_with_tv(tv)
        if ck:
            keys[tv["name"]] = {"host": tv["host"], "client_key": ck}

    with open(KEYS_FILE, "w") as f:
        json.dump(keys, f, indent=2)
    print(f"\nKeys saved to {KEYS_FILE}")
    print(json.dumps(keys, indent=2))


if __name__ == "__main__":
    asyncio.run(main())

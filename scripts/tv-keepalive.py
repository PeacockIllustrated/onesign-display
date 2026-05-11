"""Long-running keep-alive daemon for LG webOS TVs.

Connects to each TV via the webOS websocket API using the saved client_key,
opens the pointer input socket, and emits a 1-pixel invisible mouse jitter
every 60 seconds. This counts as "user activity" to the TV's inactivity
timer, defeating Auto Power Off without requiring elevated permissions or
firmware-level setting changes.

Also subscribes to power state and re-acquires the input socket if the TV
drops it. Reconnects automatically on network blips.

Run with: python scripts/tv-keepalive.py
Stop with: Ctrl-C
"""

import asyncio
import json
import logging
import os
import ssl
import sys
import uuid

import websockets

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEYS_FILE = os.path.join(ROOT, "webos-tv-keys.json")

JITTER_INTERVAL_S = 60  # how often to emit a mouse jitter
HEALTH_INTERVAL_S = 30  # how often to query power state (also counts as activity)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
    datefmt="%H:%M:%S",
)


class TvKeepAlive:
    def __init__(self, name, host, client_key):
        self.name = name
        self.host = host
        self.client_key = client_key
        self.log = logging.getLogger(name)
        self.ws = None
        self.pointer_ws = None
        self.next_req = 0

    def _req_id(self):
        self.next_req += 1
        return f"r{self.next_req:04d}"

    async def _send_request(self, uri, payload=None, timeout=10):
        req_id = self._req_id()
        await self.ws.send(json.dumps({
            "type": "request",
            "id": req_id,
            "uri": uri,
            "payload": payload or {},
        }))
        # Read until we find the matching response (skip event subscriptions)
        end = asyncio.get_event_loop().time() + timeout
        while asyncio.get_event_loop().time() < end:
            raw = await asyncio.wait_for(self.ws.recv(), timeout=end - asyncio.get_event_loop().time())
            msg = json.loads(raw)
            if msg.get("id") == req_id:
                return msg
        raise asyncio.TimeoutError(f"no response for {uri}")

    async def _authenticate(self):
        await self.ws.send(json.dumps({
            "type": "register",
            "id": self._req_id(),
            "payload": {
                "forcePairing": False,
                "pairingType": "PROMPT",
                "client-key": self.client_key,
                "manifest": {
                    "manifestVersion": 1,
                    "permissions": ["LAUNCH", "CONTROL_POWER", "READ_POWER_STATE",
                                    "CONTROL_INPUT_MEDIA_PLAYBACK", "CONTROL_MOUSE_AND_KEYBOARD"],
                },
            },
        }))
        for _ in range(10):
            raw = await asyncio.wait_for(self.ws.recv(), timeout=10)
            msg = json.loads(raw)
            if msg.get("type") == "registered":
                return True
            if msg.get("type") == "error":
                self.log.error("auth failed: %s", msg.get("payload"))
                return False
        return False

    async def _open_pointer_socket(self):
        """Fetch the pointer input socket URL and open it."""
        resp = await self._send_request("ssap://com.webos.service.networkinput/getPointerInputSocket")
        payload = resp.get("payload", {})
        if not payload.get("returnValue"):
            raise RuntimeError(f"pointer socket request failed: {payload}")
        socket_path = payload["socketPath"]
        self.log.info("pointer socket: %s", socket_path)
        ssl_ctx = None
        if socket_path.startswith("wss://"):
            ssl_ctx = ssl.create_default_context()
            ssl_ctx.check_hostname = False
            ssl_ctx.verify_mode = ssl.CERT_NONE
        self.pointer_ws = await websockets.connect(
            socket_path, ssl=ssl_ctx, max_size=2**20, open_timeout=10
        )

    async def _jitter_pointer(self):
        """Emit a 1-pixel invisible mouse move + back. Counts as activity."""
        # The pointer socket uses a custom text-frame protocol, not JSON.
        # type:<event>\ndx:<int>\ndy:<int>\ndown:<0/1>\n\n
        await self.pointer_ws.send("type:move\ndx:1\ndy:0\ndown:0\n\n")
        await asyncio.sleep(0.05)
        await self.pointer_ws.send("type:move\ndx:-1\ndy:0\ndown:0\n\n")

    async def _query_power(self):
        resp = await self._send_request(
            "ssap://com.webos.service.tvpower/power/getPowerState", timeout=5
        )
        return resp.get("payload", {}).get("state", "Unknown")

    async def _session(self):
        """One full session: connect, authenticate, open pointer, loop."""
        ssl_ctx = ssl.create_default_context()
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = ssl.CERT_NONE
        self.log.info("connecting to %s", self.host)
        async with websockets.connect(
            f"wss://{self.host}:3001",
            ssl=ssl_ctx,
            max_size=2**24,
            open_timeout=10,
            ping_interval=30,
            ping_timeout=20,
        ) as ws:
            self.ws = ws
            if not await self._authenticate():
                return
            self.log.info("authenticated")

            await self._open_pointer_socket()
            self.log.info("keep-alive active — jitter every %ds, power check every %ds",
                          JITTER_INTERVAL_S, HEALTH_INTERVAL_S)

            ticks = 0
            while True:
                ticks += 1
                if ticks % (JITTER_INTERVAL_S // 5) == 0:
                    try:
                        await self._jitter_pointer()
                    except Exception as e:
                        self.log.warning("jitter failed (%s); reopening pointer", e)
                        try: await self.pointer_ws.close()
                        except Exception: pass
                        await self._open_pointer_socket()
                if ticks % (HEALTH_INTERVAL_S // 5) == 0:
                    try:
                        state = await self._query_power()
                        self.log.info("power state: %s", state)
                    except Exception as e:
                        self.log.warning("power query failed: %s", e)
                await asyncio.sleep(5)

    async def run_forever(self):
        backoff = 5
        while True:
            try:
                await self._session()
                backoff = 5  # successful session, reset backoff
            except asyncio.CancelledError:
                raise
            except Exception as e:
                self.log.warning("session ended (%s: %s); reconnecting in %ds",
                                 type(e).__name__, e, backoff)
                await asyncio.sleep(backoff)
                backoff = min(backoff * 2, 120)


async def main():
    if not os.path.exists(KEYS_FILE):
        print(f"Run scripts/tv-pair.py first to generate {KEYS_FILE}", file=sys.stderr)
        sys.exit(1)
    with open(KEYS_FILE) as f:
        keys = json.load(f)
    if not keys:
        print("No TVs paired.", file=sys.stderr)
        sys.exit(1)

    workers = [TvKeepAlive(name, info["host"], info["client_key"]).run_forever()
               for name, info in keys.items()]
    await asyncio.gather(*workers)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nShutting down...")

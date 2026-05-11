"""Self-hosted keep-alive for LG webOS TVs.

This is the program that gets COPIED TO THE TV and runs there forever.
Pure stdlib Python (no external dependencies) — implements the bits of
RFC 6455 needed to talk to webOS's own websocket at ws://localhost:3000.

Run as: python3 keepalive.py <client_key>

Designed to be daemonized via:
  setsid nohup python3 /media/developer/temp/keepalive.py <KEY> \
    > /media/developer/temp/keepalive.log 2>&1 < /dev/null &
"""

import base64
import hashlib
import json
import logging
import os
import random
import socket
import ssl
import struct
import sys
import time
import uuid

HOST = "127.0.0.1"
PORT = 3001         # webOS 26 only accepts wss:// (TLS) even on loopback
USE_TLS = True
JITTER_INTERVAL_S = 60   # how often to emit a mouse jitter
HEALTH_INTERVAL_S = 30   # how often to query power state (also counts as activity)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("keepalive")


# ────────────────────────────────────────────────────────────────────
# Minimal websocket client — only the parts we need.
# ────────────────────────────────────────────────────────────────────

class WS:
    def __init__(self, host, port, path="/", origin=None, use_tls=USE_TLS):
        raw = socket.create_connection((host, port), timeout=15)
        if use_tls:
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
            # webOS only offers old TLS; relax restrictions
            try:
                ctx.minimum_version = ssl.TLSVersion.TLSv1
            except Exception:
                pass
            ctx.set_ciphers("DEFAULT@SECLEVEL=0")
            self.sock = ctx.wrap_socket(raw, server_hostname=None)
        else:
            self.sock = raw
        self.sock.settimeout(15)
        key = base64.b64encode(os.urandom(16)).decode()
        req = (
            f"GET {path} HTTP/1.1\r\n"
            f"Host: {host}:{port}\r\n"
            f"Upgrade: websocket\r\n"
            f"Connection: Upgrade\r\n"
            f"Sec-WebSocket-Key: {key}\r\n"
            f"Sec-WebSocket-Version: 13\r\n"
        )
        if origin:
            req += f"Origin: {origin}\r\n"
        req += "\r\n"
        self.sock.sendall(req.encode())

        # Read HTTP response headers
        buf = b""
        while b"\r\n\r\n" not in buf:
            chunk = self.sock.recv(4096)
            if not chunk:
                raise RuntimeError("connection closed during handshake")
            buf += chunk
        head, _, rest = buf.partition(b"\r\n\r\n")
        if b"101" not in head.split(b"\r\n", 1)[0]:
            raise RuntimeError(f"bad handshake: {head[:200]!r}")
        self._buf = rest

    def send(self, data, opcode=0x1):
        if isinstance(data, str):
            data = data.encode()
        header = struct.pack("!B", 0x80 | opcode)
        mask = os.urandom(4)
        length = len(data)
        if length < 126:
            header += struct.pack("!B", 0x80 | length)
        elif length < 65536:
            header += struct.pack("!BH", 0x80 | 126, length)
        else:
            header += struct.pack("!BQ", 0x80 | 127, length)
        masked = bytes(b ^ mask[i % 4] for i, b in enumerate(data))
        self.sock.sendall(header + mask + masked)

    def _recv_exact(self, n):
        out = self._buf[:n]
        self._buf = self._buf[n:]
        while len(out) < n:
            chunk = self.sock.recv(min(65536, n - len(out)))
            if not chunk:
                raise RuntimeError("connection closed")
            out += chunk
        return out

    def recv(self):
        """Read one full message (handles fragmentation). Returns bytes."""
        chunks = []
        while True:
            head = self._recv_exact(2)
            fin = head[0] & 0x80
            opcode = head[0] & 0x0F
            masked = head[1] & 0x80
            length = head[1] & 0x7F
            if length == 126:
                length = struct.unpack("!H", self._recv_exact(2))[0]
            elif length == 127:
                length = struct.unpack("!Q", self._recv_exact(8))[0]
            mask = self._recv_exact(4) if masked else None
            payload = self._recv_exact(length)
            if mask:
                payload = bytes(b ^ mask[i % 4] for i, b in enumerate(payload))
            if opcode == 0x9:  # ping → pong
                self.send(payload, opcode=0xA)
                continue
            if opcode in (0xA,):  # pong, ignore
                continue
            if opcode == 0x8:  # close
                raise RuntimeError("server closed connection")
            chunks.append(payload)
            if fin:
                return b"".join(chunks)

    def close(self):
        try:
            self.send(b"", opcode=0x8)
            self.sock.shutdown(socket.SHUT_RDWR)
        except Exception:
            pass
        try:
            self.sock.close()
        except Exception:
            pass


# ────────────────────────────────────────────────────────────────────
# Main keep-alive logic
# ────────────────────────────────────────────────────────────────────

def parse_ws_url(url):
    """ws://host:port/path → (host, port, path, use_tls)"""
    if url.startswith("wss://"):
        rest, tls, default_port = url[6:], True, 443
    elif url.startswith("ws://"):
        rest, tls, default_port = url[5:], False, 80
    else:
        raise ValueError(f"not a websocket URL: {url}")
    hostport, _, path = rest.partition("/")
    if ":" in hostport:
        host, port = hostport.split(":")
        port = int(port)
    else:
        host, port = hostport, default_port
    return host, port, "/" + path, tls


def register(ws, client_key):
    req_id = "auth_" + uuid.uuid4().hex[:8]
    ws.send(json.dumps({
        "type": "register",
        "id": req_id,
        "payload": {
            "forcePairing": False,
            "pairingType": "PROMPT",
            "client-key": client_key,
            "manifest": {
                "manifestVersion": 1,
                "permissions": [
                    "LAUNCH", "CONTROL_POWER", "READ_POWER_STATE",
                    "CONTROL_MOUSE_AND_KEYBOARD", "CONTROL_INPUT_MEDIA_PLAYBACK",
                ],
            },
        },
    }))
    for _ in range(10):
        msg = json.loads(ws.recv())
        if msg.get("type") == "registered":
            return True
        if msg.get("type") == "error":
            log.error("register failed: %s", msg.get("payload"))
            return False
    return False


def request(ws, uri, payload=None, timeout=10):
    req_id = "r_" + uuid.uuid4().hex[:8]
    ws.send(json.dumps({"type": "request", "id": req_id, "uri": uri, "payload": payload or {}}))
    end = time.time() + timeout
    while time.time() < end:
        ws.sock.settimeout(max(0.5, end - time.time()))
        try:
            msg = json.loads(ws.recv())
        except socket.timeout:
            continue
        if msg.get("id") == req_id:
            return msg


def session(client_key):
    log.info("connecting to %s://%s:%d", "wss" if USE_TLS else "ws", HOST, PORT)
    ws = WS(HOST, PORT)
    try:
        if not register(ws, client_key):
            return
        log.info("registered with stored client_key")

        # Open pointer socket
        resp = request(ws, "ssap://com.webos.service.networkinput/getPointerInputSocket")
        payload = (resp or {}).get("payload", {})
        if not payload.get("returnValue"):
            log.error("pointer socket request failed: %s", payload)
            return
        socket_path = payload["socketPath"]
        log.info("pointer socket: %s", socket_path)
        phost, pport, ppath, ptls = parse_ws_url(socket_path)
        # Force loopback for internal traffic, regardless of what host the TV returned
        if phost not in ("127.0.0.1", "localhost"):
            phost = HOST
        pws = WS(phost, pport, path=ppath, use_tls=ptls)
        log.info("pointer socket open — entering keep-alive loop")

        last_jitter = 0.0
        last_health = 0.0
        while True:
            now = time.time()
            if now - last_jitter >= JITTER_INTERVAL_S:
                try:
                    pws.send("type:move\ndx:1\ndy:0\ndown:0\n\n")
                    time.sleep(0.05)
                    pws.send("type:move\ndx:-1\ndy:0\ndown:0\n\n")
                    last_jitter = now
                except Exception as e:
                    log.warning("pointer write failed: %s", e)
                    raise
            if now - last_health >= HEALTH_INTERVAL_S:
                try:
                    r = request(ws, "ssap://com.webos.service.tvpower/power/getPowerState", timeout=5)
                    state = (r or {}).get("payload", {}).get("state", "?")
                    log.info("power state: %s", state)
                    last_health = now
                except Exception as e:
                    log.warning("power query failed: %s", e)
                    raise
            time.sleep(2)
    finally:
        try: ws.close()
        except Exception: pass


def main():
    if len(sys.argv) < 2:
        print("usage: keepalive.py <client_key>", file=sys.stderr)
        sys.exit(2)
    client_key = sys.argv[1]
    log.info("keep-alive starting (pid %d)", os.getpid())
    backoff = 5
    while True:
        try:
            session(client_key)
            backoff = 5
        except KeyboardInterrupt:
            log.info("interrupted, exiting")
            return
        except Exception as e:
            log.warning("session ended (%s: %s); reconnecting in %ds", type(e).__name__, e, backoff)
            time.sleep(backoff)
            backoff = min(backoff * 2, 120)


if __name__ == "__main__":
    main()

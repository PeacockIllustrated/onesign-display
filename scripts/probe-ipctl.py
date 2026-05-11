"""Probe LG Network IP Control protocol on the two TVs to figure out auth flow."""

import socket
import time

TVS = [
    {"name": "screen1", "host": "192.168.0.39", "code": "ZXK692SH"},
    {"name": "screen2", "host": "192.168.0.99", "code": "49Q0E2Z3"},
]


def try_protocol(host, code, send_bytes, label):
    print(f"  [{label}] sending: {send_bytes!r}")
    try:
        with socket.create_connection((host, 9761), timeout=5) as s:
            s.settimeout(3)
            s.sendall(send_bytes)
            time.sleep(0.5)
            try:
                data = s.recv(1024)
                print(f"    response: {data!r}")
                return data
            except socket.timeout:
                print("    (no response within 3s)")
                return None
    except Exception as e:
        print(f"    ERROR: {e}")
        return None


for tv in TVS:
    print(f"\n=== {tv['name']} ({tv['host']}) ===")
    # 1. Raw status query
    try_protocol(tv["host"], tv["code"], b"ka 01 FF\r", "raw-status")
    # 2. Auth with code, then status
    try_protocol(tv["host"], tv["code"], (tv["code"] + "\r").encode(), "code-only")
    # 3. AUTH prefix
    try_protocol(tv["host"], tv["code"], f"AUTH {tv['code']}\r".encode(), "AUTH-prefix")
    # 4. LG SimpLink-style PIN auth (some firmware uses this)
    try_protocol(tv["host"], tv["code"], f"{tv['code']}\n".encode(), "code-lf")
    # 5. Long-form auth (older protocol)
    try_protocol(tv["host"], tv["code"],
                 f"<auth><type>AuthKeyReq</type><value>{tv['code']}</value></auth>\r".encode(),
                 "xml-auth")

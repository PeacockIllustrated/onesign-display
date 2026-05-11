"""Diagnose the stuck /media/developer/temp directory on both LG TVs via asyncssh."""

import asyncio
import os
import sys

import asyncssh

HOME = os.path.expanduser("~")

TVS = [
    {"name": "screen1", "host": "192.168.0.39", "passphrase": "9F06A9"},
    {"name": "screen2", "host": "192.168.0.99", "passphrase": "7B856F"},
]

CMDS = [
    "id",
    "whoami",
    "ls -la /media/developer/",
    "ls -la /media/developer/temp/ 2>&1",
    "stat /media/developer/temp 2>&1",
    "find /media/developer/temp -mindepth 1 2>&1 | head -20",
    "rm -rf /media/developer/temp 2>&1",
    "ls -la /media/developer/",
]


async def run_on(tv):
    print(f"\n=== {tv['name']} ({tv['host']}) ===")
    key_path = os.path.join(HOME, ".ssh", f"{tv['name']}_webos")
    try:
        client_key = asyncssh.read_private_key(key_path, passphrase=tv["passphrase"])
        async with asyncssh.connect(
            tv["host"],
            port=9922,
            username="prisoner",
            client_keys=[client_key],
            known_hosts=None,
            server_host_key_algs=["ssh-rsa", "rsa-sha2-256", "rsa-sha2-512"],
            preferred_auth=["publickey"],
        ) as conn:
            for cmd in CMDS:
                print(f"\n$ {cmd}")
                result = await conn.run(cmd, check=False)
                if result.stdout:
                    print(result.stdout.rstrip())
                if result.stderr:
                    print("STDERR:", result.stderr.rstrip())
                if result.exit_status:
                    print(f"(exit {result.exit_status})")
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")


async def main():
    for tv in TVS:
        await run_on(tv)


if __name__ == "__main__":
    asyncio.run(main())

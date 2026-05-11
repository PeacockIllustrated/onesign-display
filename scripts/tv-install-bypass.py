"""Install the Onesign Display .ipk on both LG TVs, bypassing ares-install's
broken rm step. Uploads the .ipk via SFTP to /media/developer/temp/ and
triggers the install + launch via Luna service calls.
"""

import asyncio
import json
import os
import sys

import asyncssh

HOME = os.path.expanduser("~")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IPK_LOCAL = os.path.join(ROOT, "dist", "com.onesignanddigital.display_1.0.0_all.ipk")
IPK_NAME = "com.onesignanddigital.display_1.0.0_all.ipk"
REMOTE_DIR = "/media/developer/temp"
REMOTE_PATH = f"{REMOTE_DIR}/{IPK_NAME}"
APP_ID = "com.onesignanddigital.display"

TVS = [
    {"name": "screen1", "host": "192.168.0.39", "passphrase": "9F06A9"},
    {"name": "screen2", "host": "192.168.0.99", "passphrase": "7B856F"},
]


async def install_on(tv):
    label = f"[{tv['name']}@{tv['host']}]"
    print(f"\n=== {label} starting ===")
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
            # 1. Clean any stale .ipk inside temp (we have write inside temp, just not on the dir itself)
            print(f"{label} cleaning previous .ipk if any...")
            await conn.run(f"rm -f {REMOTE_DIR}/*.ipk", check=False)

            # 2. Upload the .ipk
            print(f"{label} uploading {IPK_NAME}...")
            async with conn.start_sftp_client() as sftp:
                await sftp.put(IPK_LOCAL, REMOTE_PATH)
            result = await conn.run(f"ls -la {REMOTE_PATH}", check=False)
            print(f"{label} {result.stdout.strip()}")

            # 3. Trigger install via Luna service (this is what ares-install does internally)
            print(f"{label} invoking appInstallService.dev/install...")
            payload = json.dumps({"id": APP_ID, "ipkUrl": REMOTE_PATH, "subscribe": True})
            install_cmd = (
                f"luna-send -n 30 -f luna://com.webos.appInstallService/dev/install "
                f"'{payload}'"
            )
            result = await conn.run(install_cmd, check=False, timeout=120)
            stdout = result.stdout or ""
            stderr = result.stderr or ""
            print(f"{label} install response:")
            print(stdout.strip()[:1200])
            if stderr.strip():
                print(f"{label} STDERR:", stderr.strip()[:400])

            # Check whether install reported success
            if '"statusValue":30' in stdout or '"details"' in stdout and 'state":"installed"' in stdout:
                print(f"{label} install appears successful")
            elif '"returnValue":true' in stdout and "FAILED" not in stdout.upper():
                print(f"{label} install command accepted")
            else:
                print(f"{label} install status unclear — check response above")

            # 4. Confirm by listing installed apps
            print(f"{label} verifying installation...")
            result = await conn.run(
                f"luna-send -n 1 -f luna://com.webos.applicationManager/dev/listApps '{{}}'",
                check=False, timeout=30,
            )
            installed = APP_ID in (result.stdout or "")
            print(f"{label} app present in listApps: {installed}")

            # 5. Launch
            print(f"{label} launching app...")
            launch_payload = json.dumps({"id": APP_ID})
            launch_cmd = (
                f"luna-send -n 1 -f luna://com.webos.applicationManager/launch "
                f"'{launch_payload}'"
            )
            result = await conn.run(launch_cmd, check=False, timeout=30)
            print(f"{label} launch response: {(result.stdout or '').strip()[:400]}")

            return installed

    except Exception as e:
        print(f"{label} ERROR: {type(e).__name__}: {e}")
        return False


async def main():
    if not os.path.exists(IPK_LOCAL):
        print(f"ERROR: .ipk not found at {IPK_LOCAL}")
        print("Run: npm run lg:package")
        sys.exit(1)
    print(f"Source .ipk: {IPK_LOCAL} ({os.path.getsize(IPK_LOCAL)} bytes)")

    results = []
    for tv in TVS:
        ok = await install_on(tv)
        results.append((tv["name"], ok))

    print("\n=== Summary ===")
    for name, ok in results:
        print(f"  {name}: {'OK' if ok else 'FAILED'}")


if __name__ == "__main__":
    asyncio.run(main())

"""Deploy the on-board keep-alive to each paired LG TV.

For each TV in webos-tv-keys.json:
  1. SSH in as prisoner
  2. Kill any previous keepalive.py instance
  3. Upload scripts/tv-onboard-keepalive.py → /media/developer/temp/keepalive.py
  4. Launch it as a detached daemon (setsid + nohup, fully disowned)
  5. Verify it's running by checking the log file

After this runs successfully, you can disconnect the laptop. The keep-alive
runs on the TV itself and survives SSH disconnect, network outages, and
laptop sleep. It only stops if the TV reboots — in which case rerun this
deploy script.
"""

import asyncio
import json
import os
import sys

import asyncssh

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEYS_FILE = os.path.join(ROOT, "webos-tv-keys.json")
SOURCE = os.path.join(ROOT, "scripts", "tv-onboard-keepalive.py")
REMOTE_DIR = "/media/developer/temp"
REMOTE_SCRIPT = f"{REMOTE_DIR}/keepalive.py"
REMOTE_LOG = f"{REMOTE_DIR}/keepalive.log"
REMOTE_PIDFILE = f"{REMOTE_DIR}/keepalive.pid"

SSH_KEYS = {
    "screen1": {"host": "192.168.0.39", "key": "screen1_webos", "passphrase": "9F06A9"},
    "screen2": {"host": "192.168.0.99", "key": "screen2_webos", "passphrase": "7B856F"},
}


async def deploy(name, client_key):
    info = SSH_KEYS[name]
    label = f"[{name}@{info['host']}]"
    print(f"\n{label} deploying...")
    home = os.path.expanduser("~")
    key = asyncssh.read_private_key(
        os.path.join(home, ".ssh", info["key"]),
        passphrase=info["passphrase"],
    )

    async with asyncssh.connect(
        info["host"], port=9922, username="prisoner",
        client_keys=[key], known_hosts=None,
        server_host_key_algs=["ssh-rsa", "rsa-sha2-256", "rsa-sha2-512"],
        preferred_auth=["publickey"],
    ) as c:

        # 1. Kill any existing keepalive
        print(f"{label} killing previous instance if any...")
        await c.run(
            "if [ -f " + REMOTE_PIDFILE + " ]; then "
            "  kill $(cat " + REMOTE_PIDFILE + ") 2>/dev/null || true; "
            "  rm -f " + REMOTE_PIDFILE + "; "
            "fi; "
            "pkill -f keepalive.py 2>/dev/null || true",
            check=False, timeout=10,
        )

        # 2. Upload the script
        print(f"{label} uploading {os.path.basename(SOURCE)}...")
        async with c.start_sftp_client() as sftp:
            await sftp.put(SOURCE, REMOTE_SCRIPT)
        await c.run(f"chmod 755 {REMOTE_SCRIPT}", check=False)

        # 3. Start as a detached daemon. Pipe stdin from /dev/null, pipe
        #    stdout/stderr to a log file, setsid creates a new session,
        #    nohup ignores HUP, & backgrounds, disown removes the job.
        cmd = (
            f"setsid nohup /usr/bin/python3 -u {REMOTE_SCRIPT} {client_key} "
            f"> {REMOTE_LOG} 2>&1 < /dev/null & "
            f"echo $! > {REMOTE_PIDFILE}"
        )
        print(f"{label} launching daemon...")
        result = await c.run(cmd, check=False, timeout=10)
        if result.stderr:
            print(f"{label} stderr: {result.stderr.strip()}")

        # 4. Give it a moment to start, then verify
        await asyncio.sleep(3)
        r = await c.run(f"cat {REMOTE_PIDFILE}", check=False)
        pid = r.stdout.strip()
        r2 = await c.run(f"ps -p {pid} -o pid,comm 2>/dev/null || ps | grep {pid} | grep -v grep", check=False)
        print(f"{label} pid={pid}  status: {r2.stdout.strip() or '(not visible in ps)'}")

        # 5. Tail the log to confirm it actually connected
        r3 = await c.run(f"tail -20 {REMOTE_LOG} 2>/dev/null", check=False)
        if r3.stdout.strip():
            print(f"{label} log:")
            for line in r3.stdout.strip().splitlines():
                print(f"{label}   {line}")
        else:
            print(f"{label} (no log output yet)")

        return pid


async def main():
    if not os.path.exists(KEYS_FILE):
        print(f"Run scripts/tv-pair.py first to create {KEYS_FILE}", file=sys.stderr)
        sys.exit(1)
    with open(KEYS_FILE) as f:
        keys = json.load(f)

    results = []
    for name, info in keys.items():
        try:
            pid = await deploy(name, info["client_key"])
            results.append((name, pid))
        except Exception as e:
            print(f"[{name}] ERROR: {type(e).__name__}: {e}")
            results.append((name, None))

    print("\n=== Summary ===")
    for name, pid in results:
        print(f"  {name}: {'pid=' + str(pid) if pid else 'FAILED'}")
    print("\nKeep-alive is now running on the TVs themselves.")
    print("You can disconnect the laptop — the daemons continue running.")
    print(f"To check status later, SSH in and `cat {REMOTE_LOG}`.")
    print(f"To stop, SSH in and `kill $(cat {REMOTE_PIDFILE})`.")


if __name__ == "__main__":
    asyncio.run(main())

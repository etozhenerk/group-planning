#!/usr/bin/env python3
"""Bound operations on the temporary simulator owned by this CI test script."""

import os
import re
import subprocess
import sys


def run(command, device, timeout):
    subprocess.run(
        ["xcrun", "simctl", command, device] + (["-b"] if command == "bootstatus" else []),
        check=True,
        timeout=timeout,
    )


def boot(device):
    for attempt in range(1, 3):
        print(f"Booting CI simulator {device}, attempt {attempt}/2", flush=True)
        try:
            run("bootstatus", device, 180)
            return 0
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as error:
            print(f"Simulator boot did not complete: {error}", file=sys.stderr, flush=True)
        if attempt == 1:
            try:
                run("shutdown", device, 30)
            except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as error:
                print(f"Simulator shutdown: {error}", file=sys.stderr, flush=True)
    return 1


def remove(device):
    for command in ("shutdown", "delete"):
        try:
            run(command, device, 30)
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as error:
            print(f"Simulator cleanup: {error}", file=sys.stderr, flush=True)
    return 0


def main():
    if os.environ.get("CI") != "true":
        sys.exit("This helper only manages temporary CI devices.")
    if len(sys.argv) != 3 or sys.argv[1] not in ("boot", "remove"):
        sys.exit("Usage: ci-simulator.py boot|remove <owned-device-UUID>")
    if not re.fullmatch(r"[A-Fa-f0-9]{8}(?:-[A-Fa-f0-9]{4}){3}-[A-Fa-f0-9]{12}", sys.argv[2]):
        sys.exit("Expected the UUID of the simulator created by this CI script.")
    return boot(sys.argv[2]) if sys.argv[1] == "boot" else remove(sys.argv[2])


if __name__ == "__main__":
    sys.exit(main())

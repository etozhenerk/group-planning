#!/bin/sh
# Shared by the test scripts. Local tests reuse a booted device; CI owns its device.
somewhere_simulator=
somewhere_simulator_owned=false
somewhere_simulator_lock=

somewhere_release_simulator() {
    if [ "$somewhere_simulator_owned" = true ] && [ -n "$somewhere_simulator" ]; then
        python3 ./scripts/ci-simulator.py remove "$somewhere_simulator" || true
    fi
    if [ -n "$somewhere_simulator_lock" ]; then
        rmdir "$somewhere_simulator_lock" 2>/dev/null || true
    fi
}

somewhere_prepare_simulator() {
    if [ -z "${SOMEWHERE_SIMULATOR_ID:-}" ] && [ "${CI:-false}" = true ]; then
        somewhere_simulator=$(xcrun simctl create "somewhere-ci-tests-$$" \
            com.apple.CoreSimulator.SimDeviceType.iPhone-17 \
            com.apple.CoreSimulator.SimRuntime.iOS-26-0)
        somewhere_simulator_owned=true
    else
        somewhere_simulator=$(xcrun simctl list devices booted --json | /usr/bin/python3 -c '
import json, os, sys
wanted=os.environ.get("SOMEWHERE_SIMULATOR_ID")
devices=[d for runtime,items in json.load(sys.stdin)["devices"].items()
    if runtime.endswith(".iOS-26-0") for d in items
    if d.get("isAvailable") and d["state"] == "Booted" and (not wanted or d["udid"] == wanted)]
if len(devices) != 1:
    sys.exit("Boot one iOS 26 simulator; if several are open, set SOMEWHERE_SIMULATOR_ID to its UDID.")
print(devices[0]["udid"])
')
    fi
    somewhere_candidate_lock="${TMPDIR:-/tmp}/somewhere-ios-tests-$somewhere_simulator.lock"
    if ! mkdir "$somewhere_candidate_lock" 2>/dev/null; then
        printf 'Tests are already running on simulator %s. Wait for them to finish.\n' "$somewhere_simulator" >&2
        return 1
    fi
    somewhere_simulator_lock=$somewhere_candidate_lock
    printf 'Testing sequentially on simulator %s\n' "$somewhere_simulator"
    if [ "$somewhere_simulator_owned" = true ]; then
        python3 ./scripts/ci-simulator.py boot "$somewhere_simulator"
    else
        xcrun simctl bootstatus "$somewhere_simulator" -b
    fi
}

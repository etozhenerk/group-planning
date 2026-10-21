#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
sh scripts/check-toolchain.sh
somewhere_adb="${ANDROID_HOME:-$ANDROID_SDK_ROOT}/platform-tools/adb"
somewhere_devices=$("$somewhere_adb" devices)
somewhere_emulators=$(printf '%s\n' "$somewhere_devices" | awk '$1 ~ /^emulator-/ {n++} END {print n+0}')
if [ "$somewhere_emulators" -gt 1 ]; then
    printf 'More than one emulator is open; reuse a single device before testing.\n' >&2
    exit 1
fi
if [ -z "${ANDROID_SERIAL:-}" ]; then
    somewhere_online=$(printf '%s\n' "$somewhere_devices" | awk '$2 == "device" {print $1}')
    somewhere_count=$(printf '%s\n' "$somewhere_online" | awk 'NF {n++} END {print n+0}')
    if [ "$somewhere_count" -ne 1 ]; then
        printf 'Select an already running device with ANDROID_SERIAL. No device will be created.\n' >&2
        exit 1
    fi
    export ANDROID_SERIAL="$somewhere_online"
fi
"$somewhere_adb" -s "$ANDROID_SERIAL" get-state
./gradlew --no-daemon :app:connectedDebugAndroidTest

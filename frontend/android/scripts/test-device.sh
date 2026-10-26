#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
sh scripts/check-toolchain.sh
somewhere_adb="${ANDROID_HOME:-$ANDROID_SDK_ROOT}/platform-tools/adb"
somewhere_devices=$("$somewhere_adb" devices)
if [ -n "${ANDROID_SERIAL:-}" ]; then
    somewhere_selected=$(printf '%s\n' "$somewhere_devices" | awk -v serial="$ANDROID_SERIAL" '$1 == serial && $2 == "device" {n++} END {print n+0}')
    if [ "$somewhere_selected" -ne 1 ]; then
        printf 'ANDROID_SERIAL must name an already online device. No device will be started.\n' >&2
        exit 1
    fi
else
    somewhere_emulators=$(printf '%s\n' "$somewhere_devices" | awk '$1 ~ /^emulator-/ {n++} END {print n+0}')
    somewhere_online=$(printf '%s\n' "$somewhere_devices" | awk '$2 == "device" {print $1}')
    somewhere_count=$(printf '%s\n' "$somewhere_online" | awk 'NF {n++} END {print n+0}')
    if [ "$somewhere_count" -ne 1 ] || [ "$somewhere_emulators" -gt 1 ]; then
        printf 'Select one existing online device with ANDROID_SERIAL. No device will be started.\n' >&2
        exit 1
    fi
    ANDROID_SERIAL="$somewhere_online"
fi
export ANDROID_SERIAL
"$somewhere_adb" -s "$ANDROID_SERIAL" get-state
./gradlew --no-daemon :app:connectedDebugAndroidTest

#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
sh scripts/check-toolchain.sh
somewhere_adb="${ANDROID_HOME:-$ANDROID_SDK_ROOT}/platform-tools/adb"
somewhere_devices=$("$somewhere_adb" devices)
somewhere_count=$(printf '%s\n' "$somewhere_devices" | awk '$2 == "device" {n++} END {print n+0}')
somewhere_emulators=$(printf '%s\n' "$somewhere_devices" | awk '$1 ~ /^emulator-/ {n++} END {print n+0}')
if [ "$somewhere_count" -ne 1 ] || [ "$somewhere_emulators" -gt 1 ]; then
    printf 'Reuse exactly one online device. This script never creates or starts an emulator.\n' >&2
    exit 1
fi
export ANDROID_SERIAL=$(printf '%s\n' "$somewhere_devices" | awk '$2 == "device" {print $1}')
somewhere_temporary=$(mktemp -d "${TMPDIR:-/tmp}/somewhere-android-ui.XXXXXX")
somewhere_remote="/data/local/tmp/somewhere-android-ui-$$.json"
somewhere_fixture=
somewhere_port=
cleanup() {
    somewhere_status=$?
    trap - EXIT
    "$somewhere_adb" -s "$ANDROID_SERIAL" shell rm -f "$somewhere_remote" >/dev/null 2>&1 || true
    if [ -n "$somewhere_port" ]; then
        "$somewhere_adb" -s "$ANDROID_SERIAL" reverse --remove "tcp:$somewhere_port" >/dev/null 2>&1 || true
    fi
    if [ -n "$somewhere_fixture" ]; then
        kill -TERM "$somewhere_fixture" 2>/dev/null || true
        if ! wait "$somewhere_fixture"; then
            cat "$somewhere_temporary/fixture.log" >&2
            somewhere_status=1
        fi
    fi
    rm -rf "$somewhere_temporary"
    exit "$somewhere_status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
(cd ../../backend && "${GO_BIN:-go}" test -c -o "$somewhere_temporary/httpapi.test" ./internal/httpapi)
SOMEWHERE_ANDROID_FIXTURE=1 SOMEWHERE_ANDROID_FIXTURE_CONFIG="$somewhere_temporary/config.json" \
    "$somewhere_temporary/httpapi.test" -test.run '^TestAndroidFixture$' -test.v -test.timeout 0 \
    > "$somewhere_temporary/fixture.log" 2>&1 &
somewhere_fixture=$!
somewhere_attempt=0
while [ ! -f "$somewhere_temporary/config.json" ]; do
    if ! kill -0 "$somewhere_fixture" 2>/dev/null || [ "$somewhere_attempt" -ge 100 ]; then
        cat "$somewhere_temporary/fixture.log" >&2
        exit 1
    fi
    somewhere_attempt=$((somewhere_attempt + 1))
    sleep 0.1
done
somewhere_port=$(python3 -c 'import json,sys,urllib.parse; print(urllib.parse.urlparse(json.load(open(sys.argv[1]))["origin"]).port)' "$somewhere_temporary/config.json")
"$somewhere_adb" -s "$ANDROID_SERIAL" reverse "tcp:$somewhere_port" "tcp:$somewhere_port" >/dev/null
"$somewhere_adb" -s "$ANDROID_SERIAL" push "$somewhere_temporary/config.json" "$somewhere_remote" >/dev/null
"$somewhere_adb" -s "$ANDROID_SERIAL" shell chmod 600 "$somewhere_remote"
./gradlew --no-daemon -PsomewhereTestBuildType=qa \
    "-Pandroid.testInstrumentationRunnerArguments.fixturePath=$somewhere_remote" \
    -Pandroid.testInstrumentationRunnerArguments.class=dev.groupplanning.android.EntryUiTests \
    :app:connectedQaAndroidTest

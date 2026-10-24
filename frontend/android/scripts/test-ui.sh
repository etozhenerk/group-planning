#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
sh scripts/check-toolchain.sh
somewhere_scope=${1:-all}
case "$somewhere_scope" in
    all|persistence|calendar|auth|polls|places|tasks|saved) ;;
    *) printf 'Usage: sh scripts/test-ui.sh [all|persistence|calendar|auth|polls|places|tasks|saved]\n' >&2; exit 2 ;;
esac
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
SOMEWHERE_ANDROID_FIXTURE=1 SOMEWHERE_ANDROID_FIXTURE_SCOPE="$somewhere_scope" SOMEWHERE_ANDROID_FIXTURE_CONFIG="$somewhere_temporary/config.json" \
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
if [ "$somewhere_scope" = all ]; then
    ./gradlew --no-daemon -PsomewhereTestBuildType=qa \
        "-Pandroid.testInstrumentationRunnerArguments.fixturePath=$somewhere_remote" \
        -Pandroid.testInstrumentationRunnerArguments.class=dev.groupplanning.android.EntryUiTests,dev.groupplanning.android.InvitationUiTests,dev.groupplanning.android.FeedUiTests,dev.groupplanning.android.CalendarUiTests,dev.groupplanning.android.PlacePollUiTests,dev.groupplanning.android.PreparationTaskUiTests,dev.groupplanning.android.DatePollUiTests,dev.groupplanning.android.SavedInvitationsUiTests \
        :app:connectedQaAndroidTest
fi

if [ "$somewhere_scope" = calendar ] || [ "$somewhere_scope" = auth ] || [ "$somewhere_scope" = polls ] || [ "$somewhere_scope" = saved ] || [ "$somewhere_scope" = places ] || [ "$somewhere_scope" = tasks ]; then
    somewhere_classes=dev.groupplanning.android.CalendarUiTests
    if [ "$somewhere_scope" = saved ]; then somewhere_classes=dev.groupplanning.android.SavedInvitationsUiTests; fi
    if [ "$somewhere_scope" = tasks ]; then somewhere_classes=dev.groupplanning.android.PreparationTaskUiTests; fi
    if [ "$somewhere_scope" = places ]; then somewhere_classes=dev.groupplanning.android.PlacePollUiTests; fi
    if [ "$somewhere_scope" = polls ]; then somewhere_classes=dev.groupplanning.android.DatePollUiTests; fi
    if [ "$somewhere_scope" = auth ]; then
        somewhere_classes='dev.groupplanning.android.EntryUiTests#onboardingSlidesBackSkipAndLogin,dev.groupplanning.android.InvitationUiTests#publicInvitationPersistsWithoutLoginOrAutomaticResponse'
    fi
    ./gradlew --no-daemon -PsomewhereTestBuildType=qa \
        "-Pandroid.testInstrumentationRunnerArguments.fixturePath=$somewhere_remote" \
        "-Pandroid.testInstrumentationRunnerArguments.class=$somewhere_classes" \
        :app:connectedQaAndroidTest
    exit 0
fi

# Separate instrumentation processes prove disk restoration, not Activity recreation.
./gradlew --no-daemon -PsomewhereTestBuildType=qa :app:installQa :app:installQaAndroidTest
somewhere_package=dev.groupplanning.android.uitesthost
somewhere_output=/sdcard/Android/data/$somewhere_package/files/process-death
for somewhere_stage in prepareProcessDeath restoreAfterProcessDeath; do
    "$somewhere_adb" -s "$ANDROID_SERIAL" shell am instrument -w -r \
        -e fixturePath "$somewhere_remote" \
        -e additionalTestOutputDir "$somewhere_output" \
        -e class "dev.groupplanning.android.FeedPersistenceUiTests#$somewhere_stage" \
        "$somewhere_package.test/androidx.test.runner.AndroidJUnitRunner" \
        > "$somewhere_temporary/$somewhere_stage.log"
    cat "$somewhere_temporary/$somewhere_stage.log"
    grep -q 'OK (1 test)' "$somewhere_temporary/$somewhere_stage.log"
    "$somewhere_adb" -s "$ANDROID_SERIAL" shell am force-stop "$somewhere_package"
    if "$somewhere_adb" -s "$ANDROID_SERIAL" shell pidof "$somewhere_package"; then
        printf 'QA process remained alive after force-stop.\n' >&2
        exit 1
    fi
done
mkdir -p app/build/outputs/process-death
"$somewhere_adb" -s "$ANDROID_SERIAL" pull "$somewhere_output/." app/build/outputs/process-death/ >/dev/null
"$somewhere_adb" -s "$ANDROID_SERIAL" shell rm -rf "$somewhere_output"

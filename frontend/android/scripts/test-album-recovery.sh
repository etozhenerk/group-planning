#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
sh scripts/check-toolchain.sh
: "${ANDROID_SERIAL:?Select an already online QA test device with ANDROID_SERIAL}"
somewhere_adb="${ANDROID_HOME:-$ANDROID_SDK_ROOT}/platform-tools/adb"
somewhere_package=dev.groupplanning.android.uitesthost
somewhere_runner="$somewhere_package.test/androidx.test.runner.AndroidJUnitRunner"
somewhere_class=dev.groupplanning.android.AlbumRecoveryDeviceTests
somewhere_discard_class=dev.groupplanning.android.AlbumDiscardRecoveryDeviceTests
somewhere_seed_pid=
somewhere_output="${SOMEWHERE_ALBUM_OUTPUT:-app/build/outputs/album-recovery}"
"$somewhere_adb" -s "$ANDROID_SERIAL" get-state
if [ "${SOMEWHERE_ALBUM_SKIP_BUILD:-false}" != true ]; then
    ./gradlew --no-daemon --max-workers=2 -PsomewhereTestBuildType=qa \
        :app:assembleQa :app:assembleQaAndroidTest
fi
cleanup() {
    "$somewhere_adb" -s "$ANDROID_SERIAL" shell am force-stop "$somewhere_package"
    if [ -n "$somewhere_seed_pid" ]; then wait "$somewhere_seed_pid" || true; fi
}
trap cleanup EXIT
"$somewhere_adb" -s "$ANDROID_SERIAL" install -r -t app/build/outputs/apk/qa/app-qa.apk
"$somewhere_adb" -s "$ANDROID_SERIAL" install -r -t app/build/outputs/apk/androidTest/qa/app-qa-androidTest.apk
mkdir -p "$somewhere_output"
"$somewhere_adb" -s "$ANDROID_SERIAL" shell am instrument -w -r \
    -e class "$somewhere_class#activeJournalAndMalformedJournalCannotDeletePendingRows,$somewhere_class#pendingPredicateOnDeleteProtectsPublishedRows,$somewhere_discard_class" \
    "$somewhere_runner" > "$somewhere_output/predicates.log" 2>&1
cat "$somewhere_output/predicates.log"
rg -q '^OK \(5 tests\)' "$somewhere_output/predicates.log"
for somewhere_mode in pending partial published; do
    "$somewhere_adb" -s "$ANDROID_SERIAL" shell am instrument -w -r \
        -e class "$somewhere_class#prepareAndHoldForForceStop" -e recoveryMode "$somewhere_mode" \
        "$somewhere_runner" > "$somewhere_output/$somewhere_mode-seed.log" 2>&1 &
    somewhere_seed_pid=$!
    somewhere_ready=false
    somewhere_attempt=0
    while [ "$somewhere_attempt" -lt 60 ]; do
        somewhere_marker=$("$somewhere_adb" -s "$ANDROID_SERIAL" shell run-as "$somewhere_package" \
            cat no_backup/qa-album-recovery/ready 2>/dev/null || true)
        if [ "$somewhere_marker" = "$somewhere_mode" ]; then somewhere_ready=true; break; fi
        somewhere_attempt=$((somewhere_attempt + 1))
        sleep 1
    done
    if [ "$somewhere_ready" != true ]; then
        cat "$somewhere_output/$somewhere_mode-seed.log"
        exit 1
    fi
    "$somewhere_adb" -s "$ANDROID_SERIAL" shell am force-stop "$somewhere_package"
    wait "$somewhere_seed_pid" || true
    somewhere_seed_pid=
    "$somewhere_adb" -s "$ANDROID_SERIAL" shell am instrument -w -r \
        -e class "$somewhere_class#restartBeginRecoversOnlyPendingAndPreservesPublished" \
        "$somewhere_runner" > "$somewhere_output/$somewhere_mode-restart.log" 2>&1
    cat "$somewhere_output/$somewhere_mode-restart.log"
    rg -q '^OK \(1 test\)' "$somewhere_output/$somewhere_mode-restart.log"
done

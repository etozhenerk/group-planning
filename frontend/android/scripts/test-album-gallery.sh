#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
sh scripts/check-toolchain.sh
: "${ANDROID_SERIAL:?Select an already online test device with ANDROID_SERIAL}"
somewhere_adb="${ANDROID_HOME:-$ANDROID_SDK_ROOT}/platform-tools/adb"
"$somewhere_adb" -s "$ANDROID_SERIAL" get-state
./gradlew --no-daemon -PsomewhereTestBuildType=qa :app:assembleQa :app:assembleQaAndroidTest
trap '"$somewhere_adb" -s "$ANDROID_SERIAL" shell am force-stop dev.groupplanning.android.uitesthost' EXIT
"$somewhere_adb" -s "$ANDROID_SERIAL" install -r -t app/build/outputs/apk/qa/app-qa.apk
"$somewhere_adb" -s "$ANDROID_SERIAL" install -r -t app/build/outputs/apk/androidTest/qa/app-qa-androidTest.apk
mkdir -p app/build/outputs/album-gallery
somewhere_log="app/build/outputs/album-gallery/instrumentation.log"
"$somewhere_adb" -s "$ANDROID_SERIAL" shell am instrument -w -r \
    -e class dev.groupplanning.android.AlbumGalleryDeviceTests \
    dev.groupplanning.android.uitesthost.test/androidx.test.runner.AndroidJUnitRunner \
    > "$somewhere_log" 2>&1
cat "$somewhere_log"
rg -q '^OK \(2 tests\)' "$somewhere_log"

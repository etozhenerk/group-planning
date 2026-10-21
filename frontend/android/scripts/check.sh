#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
sh scripts/check-toolchain.sh
./gradlew --no-daemon clean formatCheck :app:assembleDebug :app:assembleRelease :app:lintDebug :app:lintRelease :app:testDebugUnitTest :app:assembleDebugAndroidTest
./gradlew --no-daemon -PsomewhereTestBuildType=qa :app:assembleQa :app:assembleQaAndroidTest

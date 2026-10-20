#!/bin/sh
set -eu

cd "$(dirname "$0")/.."
sh scripts/check-toolchain.sh
. ./Config/toolchain.env

somewhere_simulator=$(xcrun simctl create "somewhere-tests-$$" \
    com.apple.CoreSimulator.SimDeviceType.iPhone-17 \
    com.apple.CoreSimulator.SimRuntime.iOS-26-0)

cleanup() {
    xcrun simctl shutdown "$somewhere_simulator" >/dev/null 2>&1 || true
    xcrun simctl delete "$somewhere_simulator" >/dev/null 2>&1 || true
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

xcrun simctl boot "$somewhere_simulator"
xcrun simctl bootstatus "$somewhere_simulator" -b

xcodebuild \
    -project Somewhere.xcodeproj \
    -scheme Somewhere \
    -configuration Debug \
    -sdk "$SOMEWHERE_IOS_SIMULATOR_SDK" \
    -destination "platform=iOS Simulator,id=$somewhere_simulator" \
    -derivedDataPath .build/TestDerivedData \
    -resultBundlePath ".build/TestResults-$(date -u +%Y%m%dT%H%M%S)-$$.xcresult" \
    -parallel-testing-enabled NO \
    CODE_SIGNING_ALLOWED=YES CODE_SIGN_IDENTITY=- CODE_SIGN_STYLE=Manual \
    test

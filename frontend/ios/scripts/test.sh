#!/bin/sh
set -eu

cd "$(dirname "$0")/.."
sh scripts/check-toolchain.sh
sh scripts/check-emoji.sh
. ./Config/toolchain.env

. ./scripts/simulator.sh
cleanup() { somewhere_release_simulator; }
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
somewhere_prepare_simulator

xcodebuild -jobs "${SOMEWHERE_XCODE_JOBS:-2}" \
    -project Somewhere.xcodeproj \
    -scheme Somewhere \
    -configuration Debug \
    -sdk "$SOMEWHERE_IOS_SIMULATOR_SDK" \
    -destination "platform=iOS Simulator,id=$somewhere_simulator" \
    -derivedDataPath .build/TestDerivedData \
    -resultBundlePath ".build/TestResults-$(date -u +%Y%m%dT%H%M%S)-$$.xcresult" \
    -parallel-testing-enabled NO \
    ONLY_ACTIVE_ARCH=YES CODE_SIGNING_ALLOWED=YES CODE_SIGN_IDENTITY=- CODE_SIGN_STYLE=Manual \
    test

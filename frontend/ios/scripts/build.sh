#!/bin/sh
set -eu

cd "$(dirname "$0")/.."
sh scripts/check-toolchain.sh
. ./Config/toolchain.env

somewhere_configuration=${1:-Debug}
case "$somewhere_configuration" in
    Debug|Release) ;;
    *) printf 'Usage: sh scripts/build.sh [Debug|Release]\n' >&2; exit 2 ;;
esac

xcodebuild \
    -project Somewhere.xcodeproj \
    -scheme Somewhere \
    -configuration "$somewhere_configuration" \
    -sdk "$SOMEWHERE_IOS_SIMULATOR_SDK" \
    -destination 'generic/platform=iOS Simulator' \
    -derivedDataPath .build/DerivedData \
    CODE_SIGNING_ALLOWED=NO \
    clean build analyze

#!/bin/sh
set -eu

cd "$(dirname "$0")/.."
sh scripts/check-toolchain.sh
sh scripts/check-emoji.sh
. ./Config/toolchain.env

somewhere_configuration=${1:-Debug}
somewhere_action=${2:-all}
case "$somewhere_configuration" in
    Debug|Release) ;;
    *) printf 'Usage: sh scripts/build.sh [Debug|Release] [all|build|analyze]\n' >&2; exit 2 ;;
esac
case "$somewhere_action" in
    all) set -- clean build analyze ;;
    build) set -- clean build ;;
    analyze) set -- analyze ;;
    *) printf 'Expected all, build or analyze.\n' >&2; exit 2 ;;
esac

xcodebuild -jobs "${SOMEWHERE_XCODE_JOBS:-2}" \
    -project Somewhere.xcodeproj \
    -scheme Somewhere \
    -configuration "$somewhere_configuration" \
    -sdk "$SOMEWHERE_IOS_SIMULATOR_SDK" \
    -destination 'generic/platform=iOS Simulator' \
    -derivedDataPath .build/DerivedData \
    CODE_SIGNING_ALLOWED=NO \
    "$@"

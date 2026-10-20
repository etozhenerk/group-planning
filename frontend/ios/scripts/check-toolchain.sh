#!/bin/sh
set -eu

cd "$(dirname "$0")/.."
. ./Config/toolchain.env

somewhere_expected_xcode=$(printf 'Xcode %s\nBuild version %s' "$(cat .xcode-version)" "$SOMEWHERE_IOS_XCODE_BUILD")
somewhere_actual_xcode=$(xcodebuild -version)

if [ "$somewhere_actual_xcode" != "$somewhere_expected_xcode" ]; then
    printf 'Expected %s; found %s. Set DEVELOPER_DIR to the pinned Xcode.\n' "$somewhere_expected_xcode" "$somewhere_actual_xcode" >&2
    exit 1
fi

somewhere_swift=$(xcrun swift --version)
case "$somewhere_swift" in
    *"Apple Swift version $SOMEWHERE_IOS_SWIFT_COMPILER ("*) ;;
    *) printf 'Unexpected Swift compiler: %s\n' "$somewhere_swift" >&2; exit 1 ;;
esac

if [ "$(xcrun swift-format --version)" != "$SOMEWHERE_IOS_FORMATTER" ]; then
    printf 'Expected swift-format %s.\n' "$SOMEWHERE_IOS_FORMATTER" >&2
    exit 1
fi

xcrun --sdk "$SOMEWHERE_IOS_SIMULATOR_SDK" --show-sdk-path >/dev/null
printf 'iOS toolchain OK: Xcode %s, Swift %s, swift-format %s.\n' "$(cat .xcode-version)" "$SOMEWHERE_IOS_SWIFT_COMPILER" "$SOMEWHERE_IOS_FORMATTER"

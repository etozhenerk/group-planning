#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
sh scripts/check-toolchain.sh
. ./Config/toolchain.env

somewhere_go=${GO_BIN:-go}
somewhere_filter=
somewhere_scope=
case "${1:-all}" in
    all) ;;
    invitation) somewhere_filter=-only-testing:SomewhereUITests/InvitationUITests; somewhere_scope=invitation ;;
    feed) somewhere_filter=-only-testing:SomewhereUITests/FeedUITests; somewhere_scope=feed ;;
    *) printf 'Usage: sh scripts/test-ui.sh [all|invitation|feed]\n' >&2; exit 2 ;;
esac
somewhere_temporary=$(mktemp -d "${TMPDIR:-/tmp}/somewhere-ios-ui.XXXXXX")
. ./scripts/simulator.sh
somewhere_fixture=
cleanup() {
    somewhere_status=$?
    trap - EXIT
    if [ -n "$somewhere_fixture" ]; then
        kill -TERM "$somewhere_fixture" 2>/dev/null || true
        if ! wait "$somewhere_fixture"; then
            cat "$somewhere_temporary/fixture.log" >&2
            somewhere_status=1
        fi
    fi
    somewhere_release_simulator
    rm -rf "$somewhere_temporary"
    exit "$somewhere_status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
somewhere_prepare_simulator

(cd ../../backend && "$somewhere_go" test -c -o "$somewhere_temporary/httpapi.test" ./internal/httpapi)
SOMEWHERE_IOS_FIXTURE_SCOPE="$somewhere_scope" SOMEWHERE_IOS_FIXTURE=1 SOMEWHERE_IOS_FIXTURE_CONFIG="$somewhere_temporary/config.json" \
    "$somewhere_temporary/httpapi.test" -test.run '^TestIOSFixture$' -test.v -test.timeout 0 \
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


xcodebuild -jobs "${SOMEWHERE_XCODE_JOBS:-2}" -project Somewhere.xcodeproj -scheme SomewhereUI -configuration Debug \
    -sdk "$SOMEWHERE_IOS_SIMULATOR_SDK" \
    -destination "platform=iOS Simulator,id=$somewhere_simulator" \
    -derivedDataPath .build/UITestDerivedData \
    CODE_SIGNING_ALLOWED=YES CODE_SIGN_IDENTITY=- CODE_SIGN_STYLE=Manual build-for-testing
xcrun simctl uninstall "$somewhere_simulator" dev.groupplanning.ios.uitesthost >/dev/null 2>&1 || true
xcrun simctl install "$somewhere_simulator" .build/UITestDerivedData/Build/Products/Debug-iphonesimulator/SomewhereUITestHost.app
somewhere_container=$(xcrun simctl get_app_container "$somewhere_simulator" dev.groupplanning.ios.uitesthost data)
cp "$somewhere_temporary/config.json" "$somewhere_container/tmp/ui-fixture.json"
chmod 600 "$somewhere_container/tmp/ui-fixture.json"

xcodebuild -jobs "${SOMEWHERE_XCODE_JOBS:-2}" -project Somewhere.xcodeproj -scheme SomewhereUI -configuration Debug \
    -sdk "$SOMEWHERE_IOS_SIMULATOR_SDK" \
    -destination "platform=iOS Simulator,id=$somewhere_simulator" \
    -derivedDataPath .build/UITestDerivedData \
    -resultBundlePath ".build/UIResults-$(date -u +%Y%m%dT%H%M%S)-$$.xcresult" \
    -parallel-testing-enabled NO \
    CODE_SIGNING_ALLOWED=YES CODE_SIGN_IDENTITY=- CODE_SIGN_STYLE=Manual test-without-building ${somewhere_filter:+"$somewhere_filter"}

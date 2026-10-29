#!/bin/sh
set -eu
cd /Users/misha/Documents/Codex/projects/group-planning/frontend/ios
somewhere_candidate="$PWD/.build/chat-keyboard-author"
export SOMEWHERE_SIMULATOR_ID=31262733-50DC-46A5-938E-4C462D70F109
. ./scripts/simulator.sh
somewhere_temporary=$(mktemp -d "${TMPDIR:-/tmp}/somewhere-keyboard-review.XXXXXX")
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
somewhere_minimization=$(xcrun simctl spawn "$somewhere_simulator" defaults read com.apple.keyboard.preferences AutomaticMinimizationEnabled)
if [ "$somewhere_minimization" != 0 ]; then
    printf 'Enable the authorized simulator software keyboard before this run; preserve its setting for restoration.\n' >&2
    exit 1
fi
SOMEWHERE_IOS_FIXTURE_SCOPE=accessibility SOMEWHERE_IOS_FIXTURE=1 \
    SOMEWHERE_IOS_FIXTURE_CONFIG="$somewhere_temporary/config.json" \
    "$somewhere_candidate/fixture.test" -test.run '^TestIOSFixture$' -test.v -test.timeout 0 \
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
xcrun simctl uninstall "$somewhere_simulator" dev.groupplanning.ios.uitesthost >/dev/null 2>&1 || true
xcrun simctl install "$somewhere_simulator" "$somewhere_candidate/Products/Debug-iphonesimulator/SomewhereUITestHost.app"
somewhere_container=$(xcrun simctl get_app_container "$somewhere_simulator" dev.groupplanning.ios.uitesthost data)
cp "$somewhere_temporary/config.json" "$somewhere_container/tmp/ui-fixture.json"
chmod 600 "$somewhere_container/tmp/ui-fixture.json"
if [ "$#" -eq 0 ]; then
    set -- -only-testing:SomewhereUITests/ChatKeyboardDismissalUITests
fi
xcodebuild -jobs 2 \
    -xctestrun "$somewhere_candidate/Products/SomewhereUI_iphonesimulator27.1-arm64.xctestrun" \
    -destination "platform=iOS Simulator,id=$somewhere_simulator" \
    -resultBundlePath "/Users/misha/Documents/Codex/projects/group-planning/openspec/changes/meeting-experience-refresh/qa/2026-10-29-keyboard-outside-ios-independent/IndependentKeyboard.xcresult" \
    -parallel-testing-enabled NO -collect-test-diagnostics never \
    test-without-building "$@"

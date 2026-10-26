#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
sh scripts/check-toolchain.sh
sh scripts/check-emoji.sh
. ./Config/toolchain.env

somewhere_go=${GO_BIN:-go}
somewhere_filter=
somewhere_auth_filter=
somewhere_scope=
case "${1:-all}" in
    covers-large) somewhere_filter=-only-testing:SomewhereUITests/CoverUITests/testLargeTextAndSystemPickerCancellation; somewhere_scope=accessibility ;;
    sheet-gestures) somewhere_filter=-only-testing:SomewhereUITests/ChatSheetGestureUITests; somewhere_scope=accessibility ;;
    sheet-media) somewhere_filter=-only-testing:SomewhereUITests/ChatMediaSheetUITests; somewhere_scope=accessibility ;;
    sheet-navigation) somewhere_filter=-only-testing:SomewhereUITests/ChatShareListUITests; somewhere_scope=accessibility ;;
    sheet-motion) somewhere_filter=-only-testing:SomewhereUITests/ChatSheetMotionUITests; somewhere_scope=accessibility ;;
    design) somewhere_filter=-only-testing:SomewhereUITests/DesignExperienceUITests; somewhere_scope=accessibility ;;
    media) somewhere_filter=-only-testing:SomewhereUITests/MediaExperienceUITests; somewhere_scope=accessibility ;;
    memories) somewhere_filter=-only-testing:SomewhereUITests/ExperienceUITests/testMemoryStackGridAndFullScreenPreserveIndex; somewhere_scope=accessibility ;;
    experience) somewhere_filter=-only-testing:SomewhereUITests/ExperienceUITests; somewhere_scope=accessibility ;;
    account) somewhere_filter=-only-testing:SomewhereUITests/AccountDeletionUITests; somewhere_scope=account ;;
    all) somewhere_filter=-skip-testing:SomewhereUITests/ChatSheetMotionUITests ;;
    auth) somewhere_filter=-only-testing:SomewhereUITests/EntryUITests/testOnboardingAndLoginFailure; somewhere_auth_filter=-only-testing:SomewhereUITests/InvitationUITests/testAnonymousColdAndWarmInvitationWithoutPrivateContent; somewhere_scope=auth ;;
    onboarding-large) somewhere_filter=-only-testing:SomewhereUITests/EntryUITests/testOnboardingAtLargeText; somewhere_scope=accessibility ;;
    invitation) somewhere_filter=-only-testing:SomewhereUITests/InvitationUITests; somewhere_scope=invitation ;;
    saved) somewhere_filter=-only-testing:SomewhereUITests/SavedInvitationsUITests; somewhere_scope=saved ;;
    covers) somewhere_filter=-only-testing:SomewhereUITests/CoverUITests; somewhere_scope=covers ;;
    tasks) somewhere_filter=-only-testing:SomewhereUITests/PreparationTaskUITests; somewhere_scope=tasks ;;
    places) somewhere_filter=-only-testing:SomewhereUITests/PlacePollUITests; somewhere_scope=places ;;
    polls) somewhere_filter=-only-testing:SomewhereUITests/DatePollUITests; somewhere_scope=polls ;;
    calendar) somewhere_filter=-only-testing:SomewhereUITests/CalendarUITests; somewhere_scope=calendar ;;
    feed) somewhere_filter=-only-testing:SomewhereUITests/FeedUITests; somewhere_scope=feed ;;
    accessibility) somewhere_filter=-only-testing:SomewhereUITests/AccessibilityUITests; somewhere_scope=accessibility ;;
    pickers) somewhere_filter=-only-testing:SomewhereUITests/AccessibilityUITests/testCreationAndPickers; somewhere_scope=accessibility ;;
    startup) somewhere_filter=-only-testing:SomewhereUITests/AccessibilityUITests/testLoadingBrandAndReturn; somewhere_scope=accessibility ;;
    *) printf 'Usage: sh scripts/test-ui.sh [all|design|sheet-gestures|sheet-media|sheet-navigation|sheet-motion|media|memories|experience|account|auth|onboarding-large|invitation|feed|calendar|polls|places|tasks|covers|covers-large|saved|accessibility|pickers|startup]\n' >&2; exit 2 ;;
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

case "${1:-all}" in
    all|sheet-media|media|covers|covers-large)
        somewhere_photo=../../openspec/changes/meeting-experience-refresh/assets/boardgame.png
        printf 'QA_PHOTO_SOURCE=%s\n' "$somewhere_photo"
        shasum -a 256 "$somewhere_photo"
        xcrun simctl addmedia "$somewhere_simulator" "$somewhere_photo"
        ;;
esac

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
    ONLY_ACTIVE_ARCH=YES CODE_SIGNING_ALLOWED=YES CODE_SIGN_IDENTITY=- CODE_SIGN_STYLE=Manual build-for-testing
xcrun simctl uninstall "$somewhere_simulator" dev.groupplanning.ios.uitesthost >/dev/null 2>&1 || true
xcrun simctl install "$somewhere_simulator" .build/UITestDerivedData/Build/Products/Debug-iphonesimulator/SomewhereUITestHost.app
somewhere_container=$(xcrun simctl get_app_container "$somewhere_simulator" dev.groupplanning.ios.uitesthost data)
cp "$somewhere_temporary/config.json" "$somewhere_container/tmp/ui-fixture.json"
chmod 600 "$somewhere_container/tmp/ui-fixture.json"
if [ "${1:-all}" = "sheet-media" ] || [ "${1:-all}" = "all" ]; then
    python3 scripts/seed-ui-document.py "$somewhere_container/Documents"
fi

xcodebuild -jobs "${SOMEWHERE_XCODE_JOBS:-2}" -project Somewhere.xcodeproj -scheme SomewhereUI -configuration Debug \
    -sdk "$SOMEWHERE_IOS_SIMULATOR_SDK" \
    -destination "platform=iOS Simulator,id=$somewhere_simulator" \
    -derivedDataPath .build/UITestDerivedData \
    -resultBundlePath ".build/UIResults-$(date -u +%Y%m%dT%H%M%S)-$$.xcresult" \
    -parallel-testing-enabled NO -collect-test-diagnostics never \
    ONLY_ACTIVE_ARCH=YES CODE_SIGNING_ALLOWED=YES CODE_SIGN_IDENTITY=- CODE_SIGN_STYLE=Manual test-without-building ${somewhere_filter:+"$somewhere_filter"} ${somewhere_auth_filter:+"$somewhere_auth_filter"}

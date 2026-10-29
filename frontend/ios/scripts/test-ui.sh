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
somewhere_chat=0
somewhere_native_filters=0
case "${1:-all}" in
    chat-keyboard) somewhere_filter=-only-testing:SomewhereUITests/ChatKeyboardDismissalUITests; somewhere_scope=accessibility ;;
    album-download) somewhere_filter=-only-testing:SomewhereUITests/AlbumDownloadUITests; somewhere_auth_filter=-only-testing:SomewhereUITests/ExperienceUITests/testMemoryStackGridAndFullScreenPreserveIndex; somewhere_scope=accessibility ;;
    native-usability) somewhere_native_filters=1; somewhere_scope=accessibility ;;
    help) somewhere_filter=-only-testing:SomewhereUITests/HelpDisclosureUITests; somewhere_scope=accessibility ;;
    native-navigation) somewhere_filter=-only-testing:SomewhereUITests/NativeNavigationUITests; somewhere_auth_filter=-only-testing:SomewhereUITests/ExperienceUITests/testMemoryStackGridAndFullScreenPreserveIndex; somewhere_scope=accessibility ;;
    media-native) somewhere_filter=-only-testing:SomewhereUITests/NativeMediaFlowUITests; somewhere_scope=accessibility ;;
    sheet-stability) somewhere_filter=-only-testing:SomewhereUITests/ChatSheetStabilityUITests; somewhere_auth_filter=-only-testing:SomewhereUITests/ChatSheetGuardUITests; somewhere_scope=chat; somewhere_chat=1 ;;
    sheet-pending) somewhere_filter=-only-testing:SomewhereUITests/ChatSheetStabilityUITests/testPendingAcknowledgementAndReadersKeepGeometry; somewhere_scope=chat; somewhere_chat=1 ;;
    support) somewhere_filter=-only-testing:SomewhereUITests/SupportFormUITests; somewhere_scope=accessibility ;;
    sheet-task) somewhere_filter=-only-testing:SomewhereUITests/ChatSheetGestureUITests/testTaskDraftSurvivesSheetSwipe; somewhere_scope=accessibility ;;
    chat-sync) somewhere_filter=-only-testing:SomewhereUITests/ChatSyncUITests; somewhere_scope=chat; somewhere_chat=1 ;;
    telegram-chat) somewhere_filter=-only-testing:SomewhereUITests/TelegramChatUITests; somewhere_scope=accessibility ;;
    covers-large) somewhere_filter=-only-testing:SomewhereUITests/CoverUITests/testLargeTextAndSystemPickerCancellation; somewhere_scope=accessibility ;;
    sheet-gestures) somewhere_filter=-only-testing:SomewhereUITests/ChatSheetGestureUITests; somewhere_scope=accessibility ;;
    sheet-media) somewhere_filter=-only-testing:SomewhereUITests/ChatMediaSheetUITests; somewhere_scope=accessibility ;;
    sheet-navigation) somewhere_filter=-only-testing:SomewhereUITests/ChatShareListUITests; somewhere_scope=accessibility ;;
    meeting-info) somewhere_filter=-only-testing:SomewhereUITests/MeetingInfoUITests; somewhere_scope=accessibility ;;
    sheet-motion) somewhere_filter=-only-testing:SomewhereUITests/ChatSheetMotionUITests; somewhere_scope=accessibility ;;
    design) somewhere_filter=-only-testing:SomewhereUITests/DesignExperienceUITests; somewhere_scope=accessibility ;;
    media) somewhere_filter=-only-testing:SomewhereUITests/MediaExperienceUITests; somewhere_scope=accessibility ;;
    memories) somewhere_filter=-only-testing:SomewhereUITests/ExperienceUITests/testMemoryStackGridAndFullScreenPreserveIndex; somewhere_scope=accessibility ;;
    experience) somewhere_filter=-only-testing:SomewhereUITests/ExperienceUITests; somewhere_scope=accessibility ;;
    account) somewhere_filter=-only-testing:SomewhereUITests/AccountDeletionUITests; somewhere_scope=account ;;
    profile) somewhere_filter=-only-testing:SomewhereUITests/ProfileFieldsUITests; somewhere_scope=profile ;;
    all) somewhere_filter=-skip-testing:SomewhereUITests/ChatSheetMotionUITests; somewhere_chat=1 ;;
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
    *) printf 'Usage: sh scripts/test-ui.sh [all|chat-keyboard|album-download|sheet-stability|sheet-pending|sheet-task|support|native-usability|help|media-native|native-navigation|chat-sync|telegram-chat|design|meeting-info|sheet-gestures|sheet-media|sheet-navigation|sheet-motion|media|memories|experience|account|profile|auth|onboarding-large|invitation|feed|calendar|polls|places|tasks|covers|covers-large|saved|accessibility|pickers|startup]\n' >&2; exit 2 ;;
esac
somewhere_temporary=$(mktemp -d "${TMPDIR:-/tmp}/somewhere-ios-ui.XXXXXX")
. ./scripts/simulator.sh
somewhere_fixture=
somewhere_control_written=0
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
    if [ "$somewhere_control_written" = "1" ]; then
        rm -f .build/chat-fixture-control.json
        if [ -f "$somewhere_temporary/previous-chat-control.json" ]; then
            cp "$somewhere_temporary/previous-chat-control.json" .build/chat-fixture-control.json
            chmod 600 .build/chat-fixture-control.json
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
    all|native-usability|sheet-media|media|media-native|covers|covers-large)
        somewhere_photo=../../openspec/changes/meeting-experience-refresh/assets/boardgame.png
        printf 'QA_PHOTO_SOURCE=%s\n' "$somewhere_photo"
        shasum -a 256 "$somewhere_photo"
        xcrun simctl addmedia "$somewhere_simulator" "$somewhere_photo"
        ;;
esac

if [ -n "${SOMEWHERE_IOS_FIXTURE_BINARY:-}" ]; then
    cp "$SOMEWHERE_IOS_FIXTURE_BINARY" "$somewhere_temporary/httpapi.test"
else
    (cd ../../backend && "$somewhere_go" test -c -o "$somewhere_temporary/httpapi.test" ./internal/httpapi)
fi
if [ "$somewhere_chat" = "1" ]; then
    export SOMEWHERE_IOS_CHAT_REALTIME=1 SOMEWHERE_IOS_CHAT_READ_STATE=1
fi
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

if [ "$somewhere_chat" = "1" ]; then
    mkdir -p .build
    if [ -f .build/chat-fixture-control.json ]; then
        cp .build/chat-fixture-control.json "$somewhere_temporary/previous-chat-control.json"
        chmod 600 "$somewhere_temporary/previous-chat-control.json"
    fi
    cp "$somewhere_temporary/config.json" .build/chat-fixture-control.json
    chmod 600 .build/chat-fixture-control.json
    somewhere_control_written=1
fi

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
if [ "${1:-all}" = "sheet-media" ] || [ "${1:-all}" = "media-native" ] || [ "${1:-all}" = "native-usability" ] || [ "${1:-all}" = "all" ]; then
    python3 scripts/seed-ui-document.py "$somewhere_container/Documents"
fi

if [ "$somewhere_native_filters" = "1" ]; then
    set -- -only-testing:SomewhereUITests/NativeMediaFlowUITests \
        -only-testing:SomewhereUITests/NativeNavigationUITests \
        -only-testing:SomewhereUITests/HelpDisclosureUITests \
        -only-testing:SomewhereUITests/ChatShareListUITests \
        -only-testing:SomewhereUITests/ChatMediaSheetUITests \
        -only-testing:SomewhereUITests/ExperienceUITests/testMemoryStackGridAndFullScreenPreserveIndex
else
    set -- ${somewhere_filter:+"$somewhere_filter"} ${somewhere_auth_filter:+"$somewhere_auth_filter"}
fi

xcodebuild -jobs "${SOMEWHERE_XCODE_JOBS:-2}" -project Somewhere.xcodeproj -scheme SomewhereUI -configuration Debug \
    -sdk "$SOMEWHERE_IOS_SIMULATOR_SDK" \
    -destination "platform=iOS Simulator,id=$somewhere_simulator" \
    -derivedDataPath .build/UITestDerivedData \
    -resultBundlePath ".build/UIResults-$(date -u +%Y%m%dT%H%M%S)-$$.xcresult" \
    -parallel-testing-enabled NO -collect-test-diagnostics never \
    ONLY_ACTIVE_ARCH=YES CODE_SIGNING_ALLOWED=YES CODE_SIGN_IDENTITY=- CODE_SIGN_STYLE=Manual test-without-building "$@"

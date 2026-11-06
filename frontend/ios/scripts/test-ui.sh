#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
if [ "${1:-all}" = "all" ]; then
    # Revocation deletes the shared fixture actor; give that case its own server.
    # Each child acquires and releases the same simulator lock independently.
    somewhere_all_status=0
    sh scripts/test-ui.sh all-main || somewhere_all_status=$?
    sh scripts/test-ui.sh album-preload-failure || somewhere_all_status=$?
    exit "$somewhere_all_status"
fi
sh scripts/check-toolchain.sh
sh scripts/check-emoji.sh
. ./Config/toolchain.env

somewhere_go=${GO_BIN:-go}
somewhere_filter=
somewhere_auth_filter=
somewhere_scope=
somewhere_chat=0
somewhere_native_filters=0
somewhere_baseline=0
somewhere_followup=0
somewhere_selectors=0
case "${1:-all}" in
    qa-selectors) somewhere_selectors=1; somewhere_scope=accessibility; somewhere_chat=1 ;;
    qa-followup) somewhere_followup=1; somewhere_scope=accessibility; somewhere_chat=1 ;;
    qa-baseline) somewhere_baseline=1; somewhere_scope=accessibility; somewhere_chat=1 ;;
    qa-isolation) somewhere_filter=-only-testing:SomewhereUITests/QAIsolationUITests; somewhere_scope=accessibility ;;
    creation-field-hit) somewhere_filter=-only-testing:SomewhereUITests/CreationFieldHitUITests; somewhere_scope=accessibility ;;
    creation-field-hit-more) somewhere_filter=-only-testing:SomewhereUITests/CreationFieldHitUITests/testPlaceAndDescriptionPaddingFocusesTheirOwnEditor; somewhere_scope=accessibility ;;
    creation-large-visual) somewhere_filter=-only-testing:SomewhereUITests/AccessibilityUITests/testCreationAtLargestText; somewhere_scope=accessibility ;;
    navigation-type) somewhere_filter=-only-testing:SomewhereUITests/NavigationTextUITests; somewhere_scope=accessibility ;;
    album-preload-failure) somewhere_filter=-only-testing:SomewhereUITests/AlbumPreloadFailureUITests; somewhere_scope=accessibility ;;
    chat-keyboard-return) somewhere_filter=-only-testing:SomewhereUITests/ChatKeyboardDismissalUITests/testFirstTapSendsAndOpensActionsWithoutStealingSheetFocus; somewhere_scope=accessibility ;;
    chat-keyboard) somewhere_filter=-only-testing:SomewhereUITests/ChatKeyboardDismissalUITests; somewhere_scope=accessibility ;;
    chat-keyboard-geometry) somewhere_filter=-only-testing:SomewhereUITests/ChatKeyboardDismissalUITests/testOutsideTapPreservesSelectionAndEmojiSearchFocus; somewhere_scope=chat; somewhere_chat=1 ;;
    avatar-ack) somewhere_filter=-only-testing:SomewhereUITests/AvatarAcknowledgementUITests/testRealtimeAndLostReplyKeepPhoto; somewhere_scope=chat; somewhere_chat=1; export SOMEWHERE_NATIVE_AVATAR_FIXTURE=1 SOMEWHERE_NATIVE_AVATAR_CHECK=realtime ;;
    avatar-ack-http) somewhere_filter=-only-testing:SomewhereUITests/AvatarAcknowledgementUITests/testHTTPAndLostReplyKeepPhoto; somewhere_scope=calendar; export SOMEWHERE_NATIVE_AVATAR_FIXTURE=1 SOMEWHERE_NATIVE_AVATAR_CHECK=http ;;
    avatar-fallback) somewhere_filter=-only-testing:SomewhereUITests/AvatarAcknowledgementUITests/testProfileWithoutPhotoKeepsInitial; somewhere_scope=chat; somewhere_chat=1; export SOMEWHERE_NATIVE_AVATAR_CHECK=fallback ;;
    chat-controls) somewhere_scope=accessibility ;;
    experience-revocation) somewhere_filter=-only-testing:SomewhereUITests/ExperienceAccessibilityUITests/testRevokedSessionCannotReopenCachedMemories; somewhere_scope=accessibility ;;
    experience-recovery) somewhere_filter=-only-testing:SomewhereUITests/ExperienceAccessibilityUITests/testProfileFailureIsNotMissingDataAndRetryRestoresFields; somewhere_auth_filter=-only-testing:SomewhereUITests/ExperienceAccessibilityUITests/testRevokedSessionCannotReopenCachedMemories; somewhere_scope=accessibility ;;
    profile-a11y) somewhere_filter=-only-testing:SomewhereUITests/ExperienceAccessibilityUITests/testProfileFieldsAtLargestTextAndRealVoiceOver; somewhere_auth_filter=-only-testing:SomewhereUITests/ExperienceAccessibilityUITests/testProfileFailureIsNotMissingDataAndRetryRestoresFields; somewhere_scope=accessibility ;;
    experience-a11y) somewhere_filter=-only-testing:SomewhereUITests/ExperienceAccessibilityUITests; somewhere_scope=accessibility ;;
    media-batch) somewhere_filter=-only-testing:SomewhereUITests/NativeMediaBatchUITests; somewhere_scope=accessibility ;;
    album-download) somewhere_filter=-only-testing:SomewhereUITests/AlbumDownloadUITests; somewhere_auth_filter=-only-testing:SomewhereUITests/ExperienceUITests/testMemoryStackGridAndFullScreenPreserveIndex; somewhere_scope=accessibility ;;
    album-access) somewhere_filter=-only-testing:SomewhereUITests/AlbumAccessUITests; somewhere_scope=calendar ;;
    native-usability) somewhere_native_filters=1; somewhere_scope=accessibility ;;
    help) somewhere_filter=-only-testing:SomewhereUITests/HelpDisclosureUITests; somewhere_scope=accessibility ;;
    common-about) somewhere_filter=-only-testing:SomewhereUITests/DesignExperienceUITests/testHelpAndAboutMatchApprovedLayout; somewhere_scope=accessibility ;;
    common-navigation) somewhere_filter=-only-testing:SomewhereUITests/NativeNavigationUITests/testTabsKeepOneStableBarAcrossSections; somewhere_auth_filter=-only-testing:SomewhereUITests/NativeNavigationUITests/testTabsWithSystemReducedMotion; somewhere_scope=accessibility ;;
    native-navigation) somewhere_filter=-only-testing:SomewhereUITests/NativeNavigationUITests; somewhere_auth_filter=-only-testing:SomewhereUITests/ExperienceUITests/testMemoryStackGridAndFullScreenPreserveIndex; somewhere_scope=accessibility ;;
    media-native) somewhere_filter=-only-testing:SomewhereUITests/NativeMediaFlowUITests; somewhere_scope=accessibility ;;
    sheet-stability) somewhere_filter=-only-testing:SomewhereUITests/ChatSheetStabilityUITests; somewhere_auth_filter=-only-testing:SomewhereUITests/ChatSheetGuardUITests; somewhere_scope=chat; somewhere_chat=1 ;;
    sheet-pending) somewhere_filter=-only-testing:SomewhereUITests/ChatSheetStabilityUITests/testPendingAcknowledgementAndReadersKeepGeometry; somewhere_scope=chat; somewhere_chat=1 ;;
    support) somewhere_filter=-only-testing:SomewhereUITests/SupportFormUITests; somewhere_scope=accessibility ;;
    support-voiceover) somewhere_filter=-only-testing:SomewhereUITests/SupportVoiceOverUITests; somewhere_scope=accessibility ;;
    sheet-task) somewhere_filter=-only-testing:SomewhereUITests/ChatSheetGestureUITests/testTaskDraftSurvivesSheetSwipe; somewhere_scope=accessibility ;;
    chat-sync) somewhere_filter=-only-testing:SomewhereUITests/ChatSyncUITests; somewhere_scope=chat; somewhere_chat=1 ;;
    readers-a11y) somewhere_filter=-only-testing:SomewhereUITests/ChatReadersAccessibilityUITests; somewhere_scope=chat; somewhere_chat=1 ;;
    telegram-chat) somewhere_filter=-only-testing:SomewhereUITests/TelegramChatUITests; somewhere_scope=accessibility ;;
    covers-large) somewhere_filter=-only-testing:SomewhereUITests/CoverUITests/testLargeTextAndSystemPickerCancellation; somewhere_scope=accessibility ;;
    sheet-date-settings) somewhere_filter=-only-testing:SomewhereUITests/ChatSheetGestureUITests/testDateSettingsSurviveSheetSwipe; somewhere_scope=accessibility ;;
    sheet-gestures) somewhere_filter=-only-testing:SomewhereUITests/ChatSheetGestureUITests; somewhere_scope=accessibility ;;
    sheet-media) somewhere_filter=-only-testing:SomewhereUITests/ChatMediaSheetUITests; somewhere_scope=accessibility ;;
    sheet-navigation) somewhere_filter=-only-testing:SomewhereUITests/ChatShareListUITests; somewhere_scope=accessibility ;;
    meeting-info) somewhere_filter=-only-testing:SomewhereUITests/MeetingInfoUITests; somewhere_scope=accessibility ;;
    sheet-motion) somewhere_filter=-only-testing:SomewhereUITests/ChatSheetMotionUITests; somewhere_scope=accessibility ;;
    design-forms) somewhere_filter=-only-testing:SomewhereUITests/DesignExperienceUITests/testActionFormsMatchApprovedLayout; somewhere_scope=accessibility ;;
    design) somewhere_filter=-only-testing:SomewhereUITests/DesignExperienceUITests; somewhere_scope=accessibility ;;
    media) somewhere_filter=-only-testing:SomewhereUITests/MediaExperienceUITests; somewhere_scope=accessibility ;;
    memories) somewhere_filter=-only-testing:SomewhereUITests/ExperienceUITests/testMemoryStackGridAndFullScreenPreserveIndex; somewhere_scope=accessibility ;;
    experience) somewhere_filter=-only-testing:SomewhereUITests/ExperienceUITests; somewhere_scope=accessibility ;;
    account) somewhere_filter=-only-testing:SomewhereUITests/AccountDeletionUITests; somewhere_scope=account ;;
    profile) somewhere_filter=-only-testing:SomewhereUITests/ProfileFieldsUITests; somewhere_scope=profile ;;
    all-main) somewhere_filter=-skip-testing:SomewhereUITests/ChatSheetMotionUITests; somewhere_auth_filter=-skip-testing:SomewhereUITests/AlbumPreloadFailureUITests; somewhere_chat=1 ;;
    auth) somewhere_filter=-only-testing:SomewhereUITests/EntryUITests/testOnboardingAndLoginFailure; somewhere_auth_filter=-only-testing:SomewhereUITests/InvitationUITests/testAnonymousColdAndWarmInvitationWithoutPrivateContent; somewhere_scope=auth ;;
    onboarding-large) somewhere_filter=-only-testing:SomewhereUITests/EntryUITests/testOnboardingAtLargeText; somewhere_scope=accessibility ;;
    invitation) somewhere_filter=-only-testing:SomewhereUITests/InvitationUITests; somewhere_scope=invitation ;;
    invitation-layout) somewhere_filter=-only-testing:SomewhereUITests/InvitationViewportUITests; somewhere_scope=auth ;;
    saved) somewhere_filter=-only-testing:SomewhereUITests/SavedInvitationsUITests; somewhere_scope=saved ;;
    saved-error) somewhere_filter=-only-testing:SomewhereUITests/SavedInvitationsUITests/testListErrorRetryAndLargeText; somewhere_scope=saved ;;
    covers) somewhere_filter=-only-testing:SomewhereUITests/CoverUITests; somewhere_scope=covers ;;
    tasks) somewhere_filter=-only-testing:SomewhereUITests/PreparationTaskUITests; somewhere_scope=tasks ;;
    places) somewhere_filter=-only-testing:SomewhereUITests/PlacePollUITests; somewhere_scope=places ;;
    polls) somewhere_filter=-only-testing:SomewhereUITests/DatePollUITests; somewhere_scope=polls ;;
    calendar) somewhere_filter=-only-testing:SomewhereUITests/CalendarUITests; somewhere_scope=calendar ;;
    calendar-large) somewhere_filter=-only-testing:SomewhereUITests/CalendarUITests/testCalendarLargeText; somewhere_scope=calendar ;;
    native-pdf-delayed) somewhere_filter=-only-testing:SomewhereUITests/NativePDFDelayedUITests; somewhere_scope=accessibility ;;
    native-vibe-delayed) somewhere_filter=-only-testing:SomewhereUITests/NativeVibeUploadUITests/testDelayedConfirmationKeepsVibePreviewUntilReleased; somewhere_scope=accessibility ;;
    native-vibe-upload) somewhere_filter=-only-testing:SomewhereUITests/NativeVibeUploadUITests/testConfirmedVibePhotoClosesPreviewAndAppearsOnce; somewhere_scope=accessibility ;;
    native-picker-photo-more) somewhere_filter=-only-testing:SomewhereUITests/NativePickerSelectionUITests/testAddingMorePhotosThenCancelKeepsTheSelectedPreview; somewhere_scope=accessibility ;;
    native-picker-selection) somewhere_filter=-only-testing:SomewhereUITests/NativePickerSelectionUITests; somewhere_scope=accessibility ;;
    native-empty-invite) somewhere_filter=-only-testing:SomewhereUITests/NativeEmptyInviteUITests; somewhere_scope=calendar ;;
    album-offline-sweep) somewhere_filter=-only-testing:SomewhereUITests/AlbumOfflineSweepUITests; somewhere_scope=calendar ;;
    album-preload) somewhere_filter=-only-testing:SomewhereUITests/AlbumPreloadUITests; somewhere_scope=calendar ;;
    album-save-many) somewhere_filter=-only-testing:SomewhereUITests/AlbumPreloadUITests/testSaveAll103PhotosThroughPhotoKit; somewhere_scope=calendar ;;
    account-survivor) somewhere_filter=-only-testing:SomewhereUITests/AccountDeletionUITests/testOtherParticipantKeepsMeetingAndAnonymizedHistoryAfterOwnerDeletion; somewhere_scope=calendar ;;
    feed) somewhere_filter=-only-testing:SomewhereUITests/FeedUITests; somewhere_scope=feed; somewhere_chat=1 ;;
    accessibility) somewhere_filter=-only-testing:SomewhereUITests/AccessibilityUITests; somewhere_scope=accessibility ;;
    touch-targets) somewhere_filter=-only-testing:SomewhereUITests/AccessibilityUITests/testPeriodAndCancelExposeTheirWholeVisibleTouchTargets; somewhere_scope=accessibility ;;
    pickers) somewhere_filter=-only-testing:SomewhereUITests/AccessibilityUITests/testCreationAndPickers; somewhere_scope=accessibility ;;
    startup) somewhere_filter=-only-testing:SomewhereUITests/AccessibilityUITests/testLoadingBrandAndReturn; somewhere_scope=accessibility ;;
    *) printf 'Usage: sh scripts/test-ui.sh [native-pdf-delayed|native-vibe-delayed|native-vibe-upload|native-picker-photo-more|native-picker-selection|native-empty-invite|album-offline-sweep|chat-keyboard-return|album-preload-failure|all|qa-selectors|qa-followup|qa-baseline|qa-isolation|creation-field-hit|creation-field-hit-more|creation-large-visual|navigation-type|chat-keyboard|chat-keyboard-geometry|chat-controls|avatar-ack|avatar-ack-http|avatar-fallback|experience-a11y|profile-a11y|experience-recovery|experience-revocation|media-batch|album-download|album-access|sheet-stability|sheet-pending|sheet-task|support|support-voiceover|native-usability|help|media-native|native-navigation|common-navigation|common-about|chat-sync|readers-a11y|telegram-chat|design|design-forms|meeting-info|sheet-date-settings|sheet-gestures|sheet-media|sheet-navigation|sheet-motion|media|memories|experience|account|profile|auth|onboarding-large|invitation|invitation-layout|feed|calendar|polls|places|tasks|covers|covers-large|saved|accessibility|touch-targets|pickers|startup]\n' >&2; exit 2 ;;
esac
somewhere_temporary=$(mktemp -d "${TMPDIR:-/tmp}/somewhere-ios-ui.XXXXXX")
. ./scripts/simulator.sh
. ./scripts/software-keyboard.sh
somewhere_fixture=
somewhere_control_written=0
somewhere_original_content_size=
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
    if [ -n "$somewhere_original_content_size" ]; then
        if xcrun simctl ui "$somewhere_simulator" content_size "$somewhere_original_content_size"; then
            printf 'QA_CONTENT_SIZE_RESTORED=%s\n' "$somewhere_original_content_size"
        else
            somewhere_status=1
        fi
    fi
    if ! somewhere_restore_software_keyboard; then somewhere_status=1; fi
    somewhere_release_simulator
    rm -rf "$somewhere_temporary"
    exit "$somewhere_status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
somewhere_prepare_simulator
if [ "${1:-all}" = navigation-type ]; then
    somewhere_original_content_size=$(xcrun simctl ui "$somewhere_simulator" content_size)
    xcrun simctl ui "$somewhere_simulator" content_size accessibility-extra-extra-extra-large
fi
somewhere_prepare_software_keyboard

case "${1:-all}" in
    all-main|native-vibe-delayed|native-vibe-upload|native-picker-photo-more|native-picker-selection|native-usability|chat-controls|experience-a11y|profile-a11y|experience-recovery|experience-revocation|media-batch|sheet-media|media|media-native|covers|covers-large)
        somewhere_photo=../../openspec/changes/meeting-experience-refresh/assets/boardgame.png
        printf 'QA_PHOTO_SOURCE=%s\n' "$somewhere_photo"
        shasum -a 256 "$somewhere_photo"
        xcrun simctl addmedia "$somewhere_simulator" "$somewhere_photo"
        ;;
esac

if [ "${1:-all}" = "media-batch" ]; then
    xcrun simctl addmedia "$somewhere_simulator" \
        ../../openspec/changes/meeting-experience-refresh/assets/friends.png \
        ../../openspec/changes/meeting-experience-refresh/assets/dinner.png
fi

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

mkdir -p .build
if [ -f .build/chat-fixture-control.json ]; then
    cp .build/chat-fixture-control.json "$somewhere_temporary/previous-chat-control.json"
    chmod 600 "$somewhere_temporary/previous-chat-control.json"
fi
cp "$somewhere_temporary/config.json" .build/chat-fixture-control.json
chmod 600 .build/chat-fixture-control.json
somewhere_control_written=1

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
if [ "${1:-all}" = "native-pdf-delayed" ] || [ "${1:-all}" = "native-picker-selection" ] || [ "${1:-all}" = "sheet-media" ] || [ "${1:-all}" = "media-native" ] || [ "${1:-all}" = "native-usability" ] || [ "${1:-all}" = "chat-controls" ] || [ "${1:-all}" = "all-main" ]; then
    python3 scripts/seed-ui-document.py "$somewhere_container/Documents"
fi

if [ "$somewhere_selectors" = "1" ]; then
    set -- -only-testing:SomewhereUITests/ExperienceUITests/testNavigationProfileDocumentsAndFeedbackDraft \
        -only-testing:SomewhereUITests/FeedUITests/testConversationHistoryRetryBackgroundAndSettings \
        -only-testing:SomewhereUITests/SupportFormUITests/testKeyboardDismissalValidationAndFeedbackSubmission
elif [ "$somewhere_followup" = "1" ]; then
    set -- -only-testing:SomewhereUITests/CalendarUITests/testDisplayToggleKeepsItsPosition \
        -only-testing:SomewhereUITests/InvitationUITests/testAnonymousColdAndWarmInvitationWithoutPrivateContent \
        -only-testing:SomewhereUITests/SavedInvitationsUITests/testEmptyTabKeepsCalendarSelection \
        -only-testing:SomewhereUITests/ExperienceUITests/testNavigationProfileDocumentsAndFeedbackDraft \
        -only-testing:SomewhereUITests/ExperienceUITests/testSupportSendsToFixtureAndShowsReceipt \
        -only-testing:SomewhereUITests/FeedUITests/testConversationHistoryRetryBackgroundAndSettings
elif [ "$somewhere_baseline" = "1" ]; then
    set -- -only-testing:SomewhereUITests/QAIsolationUITests \
        -only-testing:SomewhereUITests/ChatSyncUITests \
        -only-testing:SomewhereUITests/ChatSheetGuardUITests/testOrdinaryRevokedPreviewKeepsPrivacyAndRejoin \
        -only-testing:SomewhereUITests/DesignExperienceUITests/testHelpAndAboutMatchApprovedLayout \
        -only-testing:SomewhereUITests/DesignExperienceUITests/testListProfileAndCreationMatchApprovedLayout \
        -only-testing:SomewhereUITests/NativeNavigationUITests/testEdgeBackKeepsCalendarAndMessageDraft \
        -only-testing:SomewhereUITests/ExperienceUITests/testEmojiSelectionAndAttachmentCancellationKeepDraft \
        -only-testing:SomewhereUITests/ExperienceUITests/testNavigationProfileDocumentsAndFeedbackDraft \
        -only-testing:SomewhereUITests/ExperienceUITests/testSupportSendsToFixtureAndShowsReceipt
elif [ "${1:-all}" = "common-navigation" ]; then
    set -- "$somewhere_filter" "$somewhere_auth_filter" \
        -only-testing:SomewhereUITests/NativeNavigationUITests/testProfileLinksReturnAndAccountActionsAreAtBottom
elif [ "$somewhere_native_filters" = "1" ]; then
    set -- -only-testing:SomewhereUITests/NativeMediaFlowUITests \
        -only-testing:SomewhereUITests/NativeNavigationUITests \
        -only-testing:SomewhereUITests/HelpDisclosureUITests \
        -only-testing:SomewhereUITests/ChatShareListUITests \
        -only-testing:SomewhereUITests/ChatMediaSheetUITests \
        -only-testing:SomewhereUITests/ExperienceUITests/testMemoryStackGridAndFullScreenPreserveIndex
elif [ "${1:-all}" = "chat-controls" ]; then
    set -- -only-testing:SomewhereUITests/TelegramChatUITests \
        -only-testing:SomewhereUITests/ExperienceUITests/testEmojiSelectionAndAttachmentCancellationKeepDraft \
        -only-testing:SomewhereUITests/ChatMediaSheetUITests
else
    set -- ${somewhere_filter:+"$somewhere_filter"} ${somewhere_auth_filter:+"$somewhere_auth_filter"}
fi

if [ "${SOMEWHERE_IOS_SKIP_VOICEOVER:-0}" = "1" ]; then
    printf 'QA_VOICEOVER=excluded-by-explicit-user-request\n'
    set -- "$@" -skip-testing:SomewhereUITests/SupportVoiceOverUITests \
        -skip-testing:SomewhereUITests/ChatReadersAccessibilityUITests \
        -skip-testing:SomewhereUITests/ExperienceAccessibilityUITests
fi

xcodebuild -jobs "${SOMEWHERE_XCODE_JOBS:-2}" -project Somewhere.xcodeproj -scheme SomewhereUI -configuration Debug \
    -sdk "$SOMEWHERE_IOS_SIMULATOR_SDK" \
    -destination "platform=iOS Simulator,id=$somewhere_simulator" \
    -derivedDataPath .build/UITestDerivedData \
    -resultBundlePath ".build/UIResults-$(date -u +%Y%m%dT%H%M%S)-$$.xcresult" \
    -parallel-testing-enabled NO -collect-test-diagnostics never \
    ONLY_ACTIVE_ARCH=YES CODE_SIGNING_ALLOWED=YES CODE_SIGN_IDENTITY=- CODE_SIGN_STYLE=Manual test-without-building "$@"

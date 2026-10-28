#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
sh scripts/check-toolchain.sh
somewhere_scope=${1:-all}
case "$somewhere_scope" in
    all|account|profile|persistence|calendar|auth|polls|places|tasks|covers|saved|experience|media|chat) ;;
    *) printf 'Usage: sh scripts/test-ui.sh [all|account|profile|persistence|calendar|auth|polls|places|tasks|covers|saved|experience|media|chat]\n' >&2; exit 2 ;;
esac
somewhere_adb="${ANDROID_HOME:-$ANDROID_SDK_ROOT}/platform-tools/adb"
somewhere_devices=$("$somewhere_adb" devices)
if [ -n "${ANDROID_SERIAL:-}" ]; then
    somewhere_selected=$(printf '%s\n' "$somewhere_devices" | awk -v serial="$ANDROID_SERIAL" '$1 == serial && $2 == "device" {n++} END {print n+0}')
    if [ "$somewhere_selected" -ne 1 ]; then
        printf 'ANDROID_SERIAL must name an already online device. No device will be started.\n' >&2
        exit 1
    fi
else
    somewhere_count=$(printf '%s\n' "$somewhere_devices" | awk '$2 == "device" {n++} END {print n+0}')
    somewhere_emulators=$(printf '%s\n' "$somewhere_devices" | awk '$1 ~ /^emulator-/ {n++} END {print n+0}')
    if [ "$somewhere_count" -ne 1 ] || [ "$somewhere_emulators" -gt 1 ]; then
        printf 'Select one existing online device with ANDROID_SERIAL. No device will be started.\n' >&2
        exit 1
    fi
    ANDROID_SERIAL=$(printf '%s\n' "$somewhere_devices" | awk '$2 == "device" {print $1}')
fi
export ANDROID_SERIAL
somewhere_temporary=$(mktemp -d "${TMPDIR:-/tmp}/somewhere-android-ui.XXXXXX")
somewhere_remote="/data/local/tmp/somewhere-android-ui-$$.json"
somewhere_fixture=
somewhere_port=
somewhere_evidence_ready=0
somewhere_ui_output="/sdcard/Android/data/dev.groupplanning.android.uitesthost/files/ui-$$"
if [ "$somewhere_scope" = media ]; then
    somewhere_ui_output="/data/user/0/dev.groupplanning.android.uitesthost/files/ui-$$"
fi
cleanup() {
    somewhere_status=$?
    trap - EXIT
    mkdir -p "app/build/outputs/ui/$somewhere_scope-$$"
    if [ "$somewhere_scope" = media ] && [ "$somewhere_evidence_ready" = 1 ]; then
        if "$somewhere_adb" -s "$ANDROID_SERIAL" exec-out run-as dev.groupplanning.android.uitesthost \
            tar -C "$somewhere_ui_output" -cf - . > "$somewhere_temporary/evidence.tar" &&
            tar -xf "$somewhere_temporary/evidence.tar" -C "app/build/outputs/ui/$somewhere_scope-$$/"; then
            :
        else
            somewhere_status=1
        fi
        "$somewhere_adb" -s "$ANDROID_SERIAL" shell run-as dev.groupplanning.android.uitesthost \
            rm -rf "$somewhere_ui_output" >/dev/null 2>&1 || true
    else
        "$somewhere_adb" -s "$ANDROID_SERIAL" pull "$somewhere_ui_output/." "app/build/outputs/ui/$somewhere_scope-$$/" >/dev/null 2>&1 || true
        "$somewhere_adb" -s "$ANDROID_SERIAL" shell rm -rf "$somewhere_ui_output" >/dev/null 2>&1 || true
    fi
    "$somewhere_adb" -s "$ANDROID_SERIAL" shell rm -f "$somewhere_remote" >/dev/null 2>&1 || true
    if [ -n "$somewhere_port" ]; then
        "$somewhere_adb" -s "$ANDROID_SERIAL" reverse --remove "tcp:$somewhere_port" >/dev/null 2>&1 || true
    fi
    if [ -n "$somewhere_fixture" ]; then
        kill -TERM "$somewhere_fixture" 2>/dev/null || true
        if ! wait "$somewhere_fixture"; then
            cat "$somewhere_temporary/fixture.log" >&2
            somewhere_status=1
        fi
    fi
    rm -rf "$somewhere_temporary"
    exit "$somewhere_status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
(cd ../../backend && "${GO_BIN:-go}" test -c -o "$somewhere_temporary/httpapi.test" ./internal/httpapi)
somewhere_fixture_scope=$somewhere_scope
if [ "$somewhere_scope" = experience ] || [ "$somewhere_scope" = media ] || [ "$somewhere_scope" = chat ]; then somewhere_fixture_scope=calendar; fi
somewhere_chat=0
if [ "$somewhere_scope" = all ] || [ "$somewhere_scope" = chat ]; then somewhere_chat=1; fi
SOMEWHERE_ANDROID_CHAT_REALTIME="$somewhere_chat" SOMEWHERE_ANDROID_CHAT_READ_STATE="$somewhere_chat" \
SOMEWHERE_ANDROID_FIXTURE=1 SOMEWHERE_ANDROID_FIXTURE_SCOPE="$somewhere_fixture_scope" SOMEWHERE_ANDROID_FIXTURE_CONFIG="$somewhere_temporary/config.json" \
    "$somewhere_temporary/httpapi.test" -test.run '^TestAndroidFixture$' -test.v -test.timeout 0 \
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
somewhere_port=$(python3 -c 'import json,sys,urllib.parse; print(urllib.parse.urlparse(json.load(open(sys.argv[1]))["origin"]).port)' "$somewhere_temporary/config.json")
"$somewhere_adb" -s "$ANDROID_SERIAL" reverse "tcp:$somewhere_port" "tcp:$somewhere_port" >/dev/null
"$somewhere_adb" -s "$ANDROID_SERIAL" push "$somewhere_temporary/config.json" "$somewhere_remote" >/dev/null
"$somewhere_adb" -s "$ANDROID_SERIAL" shell chmod 600 "$somewhere_remote"
# Run InvitationUiTests before the extra RSVP withdrawal check: its initial
# unanswered invitation is part of that scenario. Design captures precede uploads.
# Private evidence avoids Android 16 external-storage ownership races after reinstall.
# This scope installs only the QA target and uses the same AndroidJUnitRunner cases.
if [ "$somewhere_scope" = media ]; then
    ./gradlew --no-daemon -PsomewhereTestBuildType=qa :app:installQa :app:installQaAndroidTest
    somewhere_evidence_ready=1
    "$somewhere_adb" -s "$ANDROID_SERIAL" shell am instrument -w -r \
        -e fixturePath "$somewhere_remote" \
        -e additionalTestOutputDir "$somewhere_ui_output" \
        -e class dev.groupplanning.android.MediaUploadUiTests,dev.groupplanning.android.PhotoPickerUiTests,dev.groupplanning.android.ExperienceUiTests,dev.groupplanning.android.AccountDeletionUiTests,dev.groupplanning.android.TelegramChatUiTests#settingsAndShareReturnThroughOneInformationSheet \
        dev.groupplanning.android.uitesthost.test/androidx.test.runner.AndroidJUnitRunner \
        > "$somewhere_temporary/instrumentation.log"
    cat "$somewhere_temporary/instrumentation.log"
    mkdir -p "app/build/outputs/ui/$somewhere_scope-$$"
    cp "$somewhere_temporary/instrumentation.log" "app/build/outputs/ui/$somewhere_scope-$$/"
    grep -q '^OK (8 tests)' "$somewhere_temporary/instrumentation.log"
    exit 0
fi

if [ "$somewhere_scope" = all ]; then
    ./gradlew --no-daemon -PsomewhereTestBuildType=qa \
        "-Pandroid.testInstrumentationRunnerArguments.fixturePath=$somewhere_remote" \
        "-Pandroid.testInstrumentationRunnerArguments.additionalTestOutputDir=$somewhere_ui_output" \
        -Pandroid.testInstrumentationRunnerArguments.class=dev.groupplanning.android.TelegramChatUiTests,dev.groupplanning.android.EmojiSearchUiTests,dev.groupplanning.android.ChatQueueUiTests,dev.groupplanning.android.ChatReadUiTests,dev.groupplanning.android.ChatReadLiveUiTests,dev.groupplanning.android.ProfileFieldsUiTests,dev.groupplanning.android.ComposerMenuLifecycleUiTests,dev.groupplanning.android.EmojiDockLifecycleUiTests,dev.groupplanning.android.ReactionFeedbackLifecycleUiTests,dev.groupplanning.android.ReactionPickerLifecycleUiTests,dev.groupplanning.android.ReactionPopupLifecycleUiTests,dev.groupplanning.android.MotionPreferenceUiTests,dev.groupplanning.android.ExperienceUiTests,dev.groupplanning.android.EntryUiTests,dev.groupplanning.android.AccountDeletionUiTests,dev.groupplanning.android.InvitationUiTests,dev.groupplanning.android.DesignVisualUiTests,dev.groupplanning.android.ChatActionSheetUiTests,dev.groupplanning.android.ChatActionRevocationUiTests,dev.groupplanning.android.MediaUploadUiTests,dev.groupplanning.android.PhotoPickerUiTests,dev.groupplanning.android.FeedUiTests,dev.groupplanning.android.CalendarUiTests,dev.groupplanning.android.PlacePollUiTests,dev.groupplanning.android.PreparationTaskUiTests,dev.groupplanning.android.DatePollUiTests,dev.groupplanning.android.SavedInvitationsUiTests,dev.groupplanning.android.CoverUiTests,dev.groupplanning.android.CoverProcessingTests \
        :app:connectedQaAndroidTest
fi

if [ "$somewhere_scope" = chat ] || [ "$somewhere_scope" = media ] || [ "$somewhere_scope" = experience ] || [ "$somewhere_scope" = profile ] || [ "$somewhere_scope" = account ] || [ "$somewhere_scope" = calendar ] || [ "$somewhere_scope" = auth ] || [ "$somewhere_scope" = polls ] || [ "$somewhere_scope" = saved ] || [ "$somewhere_scope" = places ] || [ "$somewhere_scope" = tasks ] || [ "$somewhere_scope" = covers ]; then
    somewhere_classes=dev.groupplanning.android.CalendarUiTests
    if [ "$somewhere_scope" = chat ]; then somewhere_classes=dev.groupplanning.android.TelegramChatUiTests,dev.groupplanning.android.EmojiSearchUiTests,dev.groupplanning.android.ChatQueueUiTests,dev.groupplanning.android.ChatReadUiTests,dev.groupplanning.android.ChatReadLiveUiTests; fi
    if [ "$somewhere_scope" = experience ]; then somewhere_classes=dev.groupplanning.android.TelegramChatUiTests,dev.groupplanning.android.ExperienceUiTests,dev.groupplanning.android.DesignVisualUiTests,dev.groupplanning.android.ChatActionSheetUiTests,dev.groupplanning.android.ChatActionRevocationUiTests,dev.groupplanning.android.MediaUploadUiTests,dev.groupplanning.android.PhotoPickerUiTests; fi
    if [ "$somewhere_scope" = account ]; then somewhere_classes=dev.groupplanning.android.AccountDeletionUiTests; fi
    if [ "$somewhere_scope" = media ]; then somewhere_classes=dev.groupplanning.android.MediaUploadUiTests,dev.groupplanning.android.PhotoPickerUiTests,dev.groupplanning.android.ExperienceUiTests,dev.groupplanning.android.AccountDeletionUiTests,dev.groupplanning.android.TelegramChatUiTests#settingsAndShareReturnThroughOneInformationSheet; fi
    if [ "$somewhere_scope" = profile ]; then somewhere_classes=dev.groupplanning.android.ProfileFieldsUiTests; fi
    if [ "$somewhere_scope" = saved ]; then somewhere_classes=dev.groupplanning.android.SavedInvitationsUiTests; fi
    if [ "$somewhere_scope" = covers ]; then somewhere_classes=dev.groupplanning.android.CoverUiTests,dev.groupplanning.android.CoverProcessingTests; fi
    if [ "$somewhere_scope" = tasks ]; then somewhere_classes=dev.groupplanning.android.PreparationTaskUiTests; fi
    if [ "$somewhere_scope" = places ]; then somewhere_classes=dev.groupplanning.android.PlacePollUiTests; fi
    if [ "$somewhere_scope" = polls ]; then somewhere_classes=dev.groupplanning.android.DatePollUiTests; fi
    if [ "$somewhere_scope" = auth ]; then
        somewhere_classes='dev.groupplanning.android.EntryUiTests#onboardingSlidesBackSkipAndLogin,dev.groupplanning.android.InvitationUiTests#publicInvitationPersistsWithoutLoginOrAutomaticResponse'
    fi
    ./gradlew --no-daemon -PsomewhereTestBuildType=qa \
        "-Pandroid.testInstrumentationRunnerArguments.fixturePath=$somewhere_remote" \
        "-Pandroid.testInstrumentationRunnerArguments.additionalTestOutputDir=$somewhere_ui_output" \
        "-Pandroid.testInstrumentationRunnerArguments.class=$somewhere_classes" \
        :app:connectedQaAndroidTest
    exit 0
fi

# Separate instrumentation processes prove disk restoration, not Activity recreation.
./gradlew --no-daemon -PsomewhereTestBuildType=qa :app:installQa :app:installQaAndroidTest
somewhere_package=dev.groupplanning.android.uitesthost
somewhere_output=/sdcard/Android/data/$somewhere_package/files/process-death
for somewhere_stage in prepareProcessDeath restoreAfterProcessDeath; do
    "$somewhere_adb" -s "$ANDROID_SERIAL" shell am instrument -w -r \
        -e fixturePath "$somewhere_remote" \
        -e additionalTestOutputDir "$somewhere_output" \
        -e class "dev.groupplanning.android.FeedPersistenceUiTests#$somewhere_stage" \
        "$somewhere_package.test/androidx.test.runner.AndroidJUnitRunner" \
        > "$somewhere_temporary/$somewhere_stage.log"
    cat "$somewhere_temporary/$somewhere_stage.log"
    grep -q 'OK (1 test)' "$somewhere_temporary/$somewhere_stage.log"
    "$somewhere_adb" -s "$ANDROID_SERIAL" shell am force-stop "$somewhere_package"
    if "$somewhere_adb" -s "$ANDROID_SERIAL" shell pidof "$somewhere_package"; then
        printf 'QA process remained alive after force-stop.\n' >&2
        exit 1
    fi
done
mkdir -p app/build/outputs/process-death
"$somewhere_adb" -s "$ANDROID_SERIAL" pull "$somewhere_output/." app/build/outputs/process-death/ >/dev/null
"$somewhere_adb" -s "$ANDROID_SERIAL" shell rm -rf "$somewhere_output"

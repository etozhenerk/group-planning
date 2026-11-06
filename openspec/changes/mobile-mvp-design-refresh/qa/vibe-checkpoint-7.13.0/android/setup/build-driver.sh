#!/bin/sh
set -eu
# This script is deliberately inert until the reviewer receives the frozen candidate.
[ "${RUN_FROZEN_VIBE:-}" = 1 ] || { echo 'Prepared only: frozen handoff required' >&2; exit 64; }
[ "$#" = 2 ] || { echo 'Usage: build-driver.sh CANDIDATE QA_OUTPUT' >&2; exit 64; }
repo_root=$(pwd)
setup_dir="$repo_root/openspec/changes/mobile-mvp-design-refresh/qa/vibe-checkpoint-7.13.0/android/setup"
candidate_file=$1
qa_output=$2
mkdir -p "$qa_output"
node "$setup_dir/check-candidate.mjs" "$candidate_file" "$qa_output/source-artifact-before.json"
review_copy=$(mktemp -d /private/tmp/android-vibe713-review-XXXXXX)
mkdir -p "$review_copy/frontend"
cp -cR "$repo_root/frontend/android" "$review_copy/frontend/android"
ln -s "$repo_root/contracts" "$review_copy/contracts"
cp "$setup_dir/VibeCheckpointSmoke.kt" "$review_copy/frontend/android/app/src/androidTestQa/java/dev/groupplanning/android/VibeCheckpointSmoke.kt"
(
  cd "$review_copy/frontend/android"
  JAVA_HOME=/Users/misha/Library/Java/JavaVirtualMachines/jdk-17.0.21+9/Contents/Home \
  ANDROID_HOME=/Users/misha/Library/Android/sdk \
  ./gradlew --no-daemon --max-workers=2 -PsomewhereTestBuildType=qa :app:assembleQaAndroidTest
) > "$qa_output/driver-build.log" 2>&1
printf '%s\n' "$review_copy/frontend/android/app/build/outputs/apk/androidTest/qa/app-qa-androidTest.apk" > "$qa_output/driver-apk-path.txt"
# Never install any app APK from review_copy. Only candidate.artifact is the product under review.

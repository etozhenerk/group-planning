#!/bin/sh
set -eu
cd /Users/misha/Documents/Codex/projects/group-planning/frontend/ios
export SOMEWHERE_SIMULATOR_ID=31262733-50DC-46A5-938E-4C462D70F109
. ./scripts/simulator.sh
cleanup() { somewhere_release_simulator; }
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
somewhere_prepare_simulator
xcodebuild -jobs 2 -project Somewhere.xcodeproj -scheme Somewhere \
    -configuration Debug -sdk iphonesimulator27.1 \
    -destination "platform=iOS Simulator,id=$somewhere_simulator" \
    -derivedDataPath .build/AlbumIndependentBuild \
    -resultBundlePath .build/AlbumIndependent-20261029.xcresult \
    -parallel-testing-enabled NO -collect-test-diagnostics never \
    -only-testing:SomewhereTests/AlbumDownloadTests \
    -only-testing:SomewhereTests/AlbumFileBufferTests \
    -only-testing:SomewhereTests/SessionAlbumSourceTests \
    -only-testing:SomewhereTests/AlbumTemporaryFilesTests \
    -only-testing:SomewhereTests/URLSessionTransportTests \
    SOMEWHERE_APP_BUNDLE_IDENTIFIER=dev.groupplanning.ios.unittesthost \
    ONLY_ACTIVE_ARCH=YES CODE_SIGNING_ALLOWED=YES CODE_SIGN_IDENTITY=- \
    CODE_SIGN_STYLE=Manual clean test

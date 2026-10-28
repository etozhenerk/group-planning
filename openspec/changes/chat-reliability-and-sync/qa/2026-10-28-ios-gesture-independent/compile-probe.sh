#!/bin/sh
set -eu
somewhere_tmp=/tmp/somewhere-ios-independent-20261028
somewhere_dev=/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer
xcrun --sdk iphonesimulator swiftc -emit-library -swift-version 5 -module-name SomewhereUITests -target arm64-apple-ios17.0-simulator -sdk "$somewhere_dev/SDKs/iPhoneSimulator27.1.sdk" -F "$somewhere_dev/Library/Frameworks" -I "$somewhere_dev/usr/lib" -L "$somewhere_dev/usr/lib" -framework XCTest -lXCTestSwiftSupport -Xlinker -rpath -Xlinker "$somewhere_dev/Library/Frameworks" -Xlinker -rpath -Xlinker "$somewhere_dev/usr/lib" -module-cache-path "$somewhere_tmp/module-cache" openspec/changes/chat-reliability-and-sync/qa/2026-10-28-ios-gesture-independent/IndependentGestureReview.swift -o "$somewhere_tmp/IndependentRunner.app/PlugIns/SomewhereUITests.xctest/SomewhereUITests"
codesign --force --sign - "$somewhere_tmp/IndependentRunner.app/PlugIns/SomewhereUITests.xctest"
codesign --force --sign - "$somewhere_tmp/IndependentRunner.app"

#!/bin/sh
set -eu

if [ -z "${JAVA_HOME:-}" ] || [ ! -x "$JAVA_HOME/bin/java" ]; then
    printf 'Set JAVA_HOME to a JDK 17 installation.\n' >&2
    exit 1
fi
somewhere_version=$("$JAVA_HOME/bin/java" -version 2>&1 | head -n 1)
case "$somewhere_version" in
    *'version "17.'*) ;;
    *) printf 'Expected JDK 17; got %s\n' "$somewhere_version" >&2; exit 1 ;;
esac

somewhere_sdk=${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}
if [ -z "$somewhere_sdk" ] || [ ! -f "$somewhere_sdk/platforms/android-36/android.jar" ] || [ ! -d "$somewhere_sdk/build-tools/36.0.0" ]; then
    printf 'Set ANDROID_HOME to an SDK with platforms;android-36 and build-tools;36.0.0.\n' >&2
    exit 1
fi

printf 'Android toolchain: %s; platform 36, build tools 36.0.0\n' "$somewhere_version"

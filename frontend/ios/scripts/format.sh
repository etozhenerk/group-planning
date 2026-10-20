#!/bin/sh
set -eu

cd "$(dirname "$0")/.."
sh scripts/check-toolchain.sh

case "${1:---check}" in
    --check) xcrun swift-format lint --configuration .swift-format --strict --recursive Somewhere SomewhereTests SomewhereUITestSupport SomewhereUITests ;;
    --write) xcrun swift-format format --configuration .swift-format --in-place --recursive Somewhere SomewhereTests SomewhereUITestSupport SomewhereUITests ;;
    *) printf 'Usage: sh scripts/format.sh [--check|--write]\n' >&2; exit 2 ;;
esac

#!/bin/sh
# Report unformatted Go files and preserve a non-zero CI result.
set -eu
files=$(gofmt -l .)
if [ -n "$files" ]; then
    printf '%s\n' "$files"
    exit 1
fi

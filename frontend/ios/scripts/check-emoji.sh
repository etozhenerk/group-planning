#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
cmp ../../contracts/emoji/emoji-ru.json Somewhere/Resources/emoji-ru.json || {
    printf 'Emoji resource is stale: copy contracts/emoji/emoji-ru.json to Somewhere/Resources/emoji-ru.json.\n' >&2
    exit 1
}

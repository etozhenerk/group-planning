#!/bin/sh
set -eu

cd "$(dirname "$0")/.."

format_go() {
    go run -mod=readonly -modfile=tools/go.mod mvdan.cc/gofumpt -extra "$@" .
}

space_go() {
    go run -mod=readonly -modfile=tools/go.mod github.com/bombsimon/wsl/v5/cmd/wsl \
        -default none -enable after-block,return,leading-whitespace,trailing-whitespace "$@" ./...
}

case "${1:---check}" in
    --write)
        format_go -w
        space_go -fix
        format_go -w
        ;;
    --check)
        unformatted=$(format_go -l)

        if [ -n "$unformatted" ]; then
            printf '%s\n' "$unformatted" >&2
            printf '%s\n' 'Run sh scripts/format.sh --write' >&2
            exit 1
        fi

        space_go
        ;;
    *)
        printf '%s\n' 'Usage: sh scripts/format.sh [--check|--write]' >&2
        exit 2
        ;;
esac

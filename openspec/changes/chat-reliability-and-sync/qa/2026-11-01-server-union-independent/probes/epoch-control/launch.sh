#!/bin/sh
set -eu
: "${SOMEWHERE_BROWSER_DIST:?supply exact preserved current web artifact directory}"
SOMEWHERE_BROWSER_ADDR="${SOMEWHERE_BROWSER_ADDR:-127.0.0.1:8538}"
export SOMEWHERE_BROWSER_ADDR SOMEWHERE_BROWSER_DIST
export SOMEWHERE_BROWSER_FIXTURE=1 SOMEWHERE_BROWSER_CHAT_REALTIME=1 SOMEWHERE_BROWSER_CHAT_READ_STATE=1
SOMEWHERE_BROWSER_QA_EPOCH_CONTROL="$(cat /tmp/somewhere-sdd-epoch-overlay/control-token)"
export SOMEWHERE_BROWSER_QA_EPOCH_CONTROL
exec /tmp/somewhere-sdd-epoch-overlay/browser-epoch-v2.test -test.run '^TestBrowserFixture$' -test.v -test.timeout 45m

#!/bin/sh
set -eu
somewhere_qa=/Users/misha/Documents/Codex/projects/group-planning/openspec/changes/mobile-mvp-design-refresh/qa/final/ios-r11/gap-first
somewhere_group=$1
shift
somewhere_output="$somewhere_qa/groups/$somewhere_group"
mkdir -p "$somewhere_output"
cd /Users/misha/Documents/Codex/projects/group-planning/frontend/ios
export SOMEWHERE_SIMULATOR_ID=31262733-50DC-46A5-938E-4C462D70F109 SOMEWHERE_IOS_SKIP_VOICEOVER=0
. ./scripts/simulator.sh
. ./scripts/software-keyboard.sh
somewhere_temporary=$(mktemp -d /private/tmp/ios-final-r10-own-fixture.XXXXXX)
somewhere_control=/private/tmp/invitation-ios-independent-7.4/frontend/ios/.build/chat-fixture-control.json
somewhere_fixture=
somewhere_video=
somewhere_control_written=0
cleanup() {
 somewhere_status=$?
 trap - EXIT
 if [ -n "$somewhere_video" ]; then kill -INT "$somewhere_video" 2>/dev/null || true;wait "$somewhere_video" || true;fi
 if [ -n "$somewhere_fixture" ]; then kill -TERM "$somewhere_fixture" 2>/dev/null || true;if ! wait "$somewhere_fixture";then somewhere_status=1;fi;fi
 if [ "$somewhere_control_written" = 1 ];then rm -f "$somewhere_control";if [ -f "$somewhere_temporary/previous-control.json" ];then cp "$somewhere_temporary/previous-control.json" "$somewhere_control";chmod 600 "$somewhere_control";fi;fi
 if ! somewhere_restore_software_keyboard;then somewhere_status=1;fi
 somewhere_release_simulator
 printf 'QA_OWN_FIXTURE_AND_SIMULATOR_LOCK_RELEASED=1\n'
 exit "$somewhere_status"
}
trap cleanup EXIT
trap 'exit 143' TERM
trap 'exit 130' INT
somewhere_prepare_simulator
somewhere_prepare_software_keyboard
SOMEWHERE_IOS_FIXTURE_SCOPE=accessibility SOMEWHERE_IOS_CHAT_REALTIME=1 SOMEWHERE_IOS_CHAT_READ_STATE=1 SOMEWHERE_IOS_FIXTURE=1 SOMEWHERE_IOS_FIXTURE_CONFIG="$somewhere_temporary/config.json" "${SOMEWHERE_QA_FIXTURE_BINARY:-/private/tmp/native-invitation-fixture-7.4-r2b/httpapi.test}" -test.run '^TestIOSFixture$' -test.v -test.timeout 0 > "$somewhere_output/fixture.log" 2>&1 &
somewhere_fixture=$!
somewhere_attempt=0
while [ ! -f "$somewhere_temporary/config.json" ];do
 if ! kill -0 "$somewhere_fixture" 2>/dev/null || [ "$somewhere_attempt" -ge 100 ];then exit 2;fi
 somewhere_attempt=$((somewhere_attempt+1));sleep 0.1
done
chmod 600 "$somewhere_temporary/config.json"
python3 - "$somewhere_temporary/config.json" "$somewhere_output/fixture-provenance.json" "${SOMEWHERE_QA_FIXTURE_BINARY:-/private/tmp/native-invitation-fixture-7.4-r2b/httpapi.test}" <<'PYFIX'
import sys,json,hashlib,datetime,base64
from pathlib import Path
p=Path(sys.argv[1]);x=json.loads(p.read_text());b=Path(sys.argv[3])
Path(sys.argv[2]).write_text(json.dumps({'startedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'kind':'own isolated memory fixture; no production deliveries','origin':x['origin'],'fixtureBinary':str(b),'fixtureSHA256':hashlib.sha256(b.read_bytes()).hexdigest(),'configSHA256':hashlib.sha256(p.read_bytes()).hexdigest(),'certificateSHA256':hashlib.sha256(base64.b64decode(x['certificate'])).hexdigest(),'scenarioNames':sorted(x['cases']),'fixtureScope':'accessibility','realtime':True,'readState':True,'credentialsNotPublished':True},ensure_ascii=False,indent=2))
PYFIX
if [ -f "$somewhere_control" ];then cp "$somewhere_control" "$somewhere_temporary/previous-control.json";chmod 600 "$somewhere_temporary/previous-control.json";fi
cp "$somewhere_temporary/config.json" "$somewhere_control";chmod 600 "$somewhere_control";somewhere_control_written=1
xcrun simctl install "$somewhere_simulator" /private/tmp/mobile-final-ios-r11/SomewhereUITestHost.app
somewhere_container=$(xcrun simctl get_app_container "$somewhere_simulator" dev.groupplanning.ios.uitesthost data)
cp "$somewhere_temporary/config.json" "$somewhere_container/tmp/ui-fixture.json";chmod 600 "$somewhere_container/tmp/ui-fixture.json"
case "$somewhere_group" in
 vibe|media) xcrun simctl addmedia "$somewhere_simulator" ../../openspec/changes/meeting-experience-refresh/assets/boardgame.png ../../openspec/changes/meeting-experience-refresh/assets/friends.png ../../openspec/changes/meeting-experience-refresh/assets/dinner.png;python3 scripts/seed-ui-document.py "$somewhere_container/Documents";;
 help) python3 scripts/seed-ui-document.py "$somewhere_container/Documents";;
esac
if [ "$somewhere_group" = offline ];then
 xcrun simctl io "$somewhere_simulator" recordVideo --codec=h264 --force "$somewhere_output/offline-runtime.mp4" > "$somewhere_output/video.log" 2>&1 &
 somewhere_video=$!
fi
xcodebuild -jobs 2 -xctestrun "$somewhere_qa/runtime.xctestrun" -destination "platform=iOS Simulator,id=$somewhere_simulator" -parallel-testing-enabled NO -collect-test-diagnostics never -resultBundlePath "$somewhere_output/runtime.xcresult" "$@" test-without-building

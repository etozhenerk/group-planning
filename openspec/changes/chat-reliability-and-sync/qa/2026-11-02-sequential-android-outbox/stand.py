from pathlib import Path
import os, subprocess, json, time, signal, xml.etree.ElementTree as ET

ROOT = Path('/Users/misha/Documents/Codex/projects/group-planning')
HERE = Path(__file__).parent
OUT = HERE / 'reconcile'
PRIVATE = Path('/tmp/somewhere-android-after-commit-20261102')
ADB = '/Users/misha/Library/Android/sdk/platform-tools/adb'
PKG = 'dev.groupplanning.android.uitesthost'
CONFIG = PRIVATE / 'reconcile-config.json'
MARKER = PRIVATE / 'cold-start'
REMOTE = '/data/local/tmp/somewhere-android-ui-' + str(os.getpid()) + '.json'
EVIDENCE = '/sdcard/Android/data/' + PKG + '/files/sdd-after-commit-' + str(os.getpid())

def adb(*args, check=True):
    p = subprocess.run([ADB, '-s', 'emulator-5554', *args], capture_output=True, timeout=90)
    if check:
        assert p.returncode == 0, (args, p.stderr.decode(errors='replace'))
    return p.stdout

CONFIG.unlink(missing_ok=True)
MARKER.unlink(missing_ok=True)
subprocess.run(['go', 'test', '-c', '-overlay=' + str(PRIVATE / 'overlay-reconcile.json'), '-o', str(PRIVATE / 'reconcile.test'), './internal/httpapi'], cwd=ROOT / 'backend', check=True)
env = os.environ.copy()
env.update(SOMEWHERE_ANDROID_FIXTURE='1', SOMEWHERE_ANDROID_FIXTURE_SCOPE='persistence', SOMEWHERE_ANDROID_FIXTURE_CONFIG=str(CONFIG), SOMEWHERE_ANDROID_CHAT_REALTIME='0', SOMEWHERE_ANDROID_CHAT_READ_STATE='0', SOMEWHERE_SDD_COLD_START_MARKER=str(MARKER))
port = None
with (OUT / 'fixture.log').open('wb') as log:
    server = subprocess.Popen([str(PRIVATE / 'reconcile.test'), '-test.run=^TestAndroidFixture$', '-test.v', '-test.timeout=0'], env=env, stdout=log, stderr=subprocess.STDOUT)
    try:
        for _ in range(100):
            if CONFIG.exists(): break
            assert server.poll() is None
            time.sleep(.1)
        assert CONFIG.exists()
        from urllib.parse import urlparse
        port = urlparse(json.loads(CONFIG.read_text())['origin']).port
        adb('reverse', 'tcp:' + str(port), 'tcp:' + str(port))
        adb('push', str(CONFIG), REMOTE)
        adb('shell', 'chmod', '600', REMOTE)
        result = adb('shell', 'am', 'instrument', '-w', '-r', '-e', 'fixturePath', REMOTE, '-e', 'additionalTestOutputDir', EVIDENCE, '-e', 'class', 'dev.groupplanning.android.FeedPersistenceUiTests#prepareProcessDeath', PKG + '.test/androidx.test.runner.AndroidJUnitRunner')
        (OUT / 'prepare.log').write_bytes(result)
        assert b'OK (1 test)' in result
        adb('shell', 'am', 'force-stop', PKG)
        assert not adb('shell', 'pidof', PKG, check=False).strip()
        # A new authenticated bootstrap can now observe the already committed message.
        # Unlike the legacy fault, feed does not stay503 until another POST.
        MARKER.touch()
        adb('shell', 'cmd', 'locale', 'set-app-locales', PKG, '--locales', 'ru-RU')
        adb('shell', 'am', 'start', '-W', '-n', PKG + '/dev.groupplanning.android.MainActivity', '--es', 'scenario', 'feed-persistence')
        xml_remote = '/data/local/tmp/somewhere-sdd-after-commit.xml'
        expected_message = '\u0421\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435 \u043f\u0435\u0440\u0435\u0436\u0438\u0432\u0451\u0442 \u043f\u0435\u0440\u0435\u0437\u0430\u043f\u0443\u0441\u043a'
        expected_draft = '\u0418 \u0447\u0435\u0440\u043d\u043e\u0432\u0438\u043a \u0442\u043e\u0436\u0435'
        retry = '\u041f\u043e\u0432\u0442\u043e\u0440\u0438\u0442\u044c'
        matched = False
        for _ in range(15):
            adb('shell', 'uiautomator', 'dump', xml_remote)
            xml = adb('exec-out', 'cat', xml_remote)
            nodes = list(ET.fromstring(xml).iter('node'))
            texts = [n.get('text', '') for n in nodes]
            matched = texts.count(expected_message) == 1 and expected_draft in texts and retry not in texts
            if matched: break
            time.sleep(.2)
        (OUT / 'restored.xml').write_bytes(xml)
        (OUT / 'restored.png').write_bytes(adb('exec-out', 'screencap', '-p'))
        adb('shell', 'rm', '-f', xml_remote)
        assert matched, [t for t in texts if t]
        (OUT / 'result.json').write_text(json.dumps({'status': 'passed', 'genuineProcessStop': True, 'coldStartCanonicalMessageCount': 1, 'draftRetained': True, 'recovery': 'authenticated HTTP bootstrap reconciles committed intent without duplicate POST', 'scope': 'only lost-ACK cold start; not all nine queue cases'}, indent=2))
    finally:
        adb('shell', 'am', 'force-stop', PKG, check=False)
        adb('pull', EVIDENCE + '/.', str(OUT / 'prepare-actual'), check=False)
        adb('shell', 'rm', '-rf', EVIDENCE, check=False)
        adb('shell', 'rm', '-f', REMOTE, check=False)
        if port: adb('reverse', '--remove', 'tcp:' + str(port), check=False)
        server.send_signal(signal.SIGTERM)
        assert server.wait(timeout=30) == 0

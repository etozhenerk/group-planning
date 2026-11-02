from pathlib import Path
import subprocess, os, signal, time, json

E = Path(__file__).parent
B = Path('/tmp/somewhere-sequential-sdk-20261102')
B.mkdir(mode=0o700, exist_ok=True)
env = os.environ.copy()
env.update(SOMEWHERE_ANDROID_FIXTURE='1', SOMEWHERE_ANDROID_FIXTURE_SCOPE='chat', SOMEWHERE_ANDROID_FIXTURE_CONFIG=str(B / 'connection.json'), SOMEWHERE_ANDROID_CHAT_REALTIME='1', SOMEWHERE_ANDROID_CHAT_READ_STATE='1', SOMEWHERE_SDK_TRACE=str(B / 'protocol.jsonl'))
finish = False
def stop(*_):
    global finish
    finish = True
signal.signal(signal.SIGTERM, stop)
signal.signal(signal.SIGINT, stop)
configured = False
server = None
def run(script, *args):
    return subprocess.run(['python3', str(E / script), *args], check=True)
with (B / 'fixture.log').open('wb') as log:
    try:
        server = subprocess.Popen(['/tmp/somewhere-android-rsvp-sdk-20261102/httpapi.test', '-test.run=^TestAndroidFixture$', '-test.v', '-test.timeout=0'], env=env, stdout=log, stderr=subprocess.STDOUT)
        for _ in range(100):
            if (B / 'connection.json').exists(): break
            assert server.poll() is None
            time.sleep(.1)
        assert (B / 'connection.json').exists()
        run('manual.py', 'baseline')
        run('manual.py', 'configure')
        configured = True
        run('driver.py', 'setup-v2')
        run('driver.py', 'start-long-break')
        print('SYNTHETIC FIVE-MINUTE OUTAGE STARTED', flush=True)
        while not finish and not (B / 'finish').exists():
            assert server.poll() is None
            time.sleep(.2)
    finally:
        if configured:
            run('cleanup.py')
        if server is not None and server.poll() is None:
            server.send_signal(signal.SIGTERM)
            server.wait(timeout=30)
        (E / 'supervisor-result.json').write_text(json.dumps({'fixtureExit': None if server is None else server.returncode, 'qaCleanupCalled': configured}, indent=2))

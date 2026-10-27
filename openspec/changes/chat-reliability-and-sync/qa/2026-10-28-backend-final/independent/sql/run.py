import datetime
import hashlib
import json
import pathlib
import re
import subprocess

ROOT = pathlib.Path('/Users/misha/Documents/Codex/projects/group-planning')
HERE = pathlib.Path(__file__).parent
HOST = 'somewhere-admin@158.160.246.254'
OPTIONS = ['-i', str(ROOT / 'infra/local/somewhere-admin'), '-o', 'BatchMode=yes',
           '-o', 'StrictHostKeyChecking=yes', '-o', 'ConnectTimeout=8',
           '-o', 'UserKnownHostsFile=' + str(ROOT / 'infra/local/known_hosts')]
BINARY = pathlib.Path('/tmp/chat-backend-final-independent-c789/postgres-read.test')
EXPECTED = 'ac308f714c93bf886f20d8be18792ead19c47a7ced70578d904436126c1fb58b'
assert hashlib.sha256(BINARY.read_bytes()).hexdigest() == EXPECTED
started = datetime.datetime.now(datetime.timezone.utc).isoformat()
remote = subprocess.check_output(
    ['ssh', *OPTIONS, HOST, 'mktemp -d /tmp/codex-chat-read-XXXXXXXX'], text=True
).strip()
assert re.fullmatch(r'/tmp/codex-chat-read-[A-Za-z0-9]{8}', remote)
code = 1
removed = False
try:
    subprocess.run(['scp', *OPTIONS, str(BINARY), HOST + ':' + remote + '/postgres-read.test'], check=True)
    subprocess.run(['ssh', *OPTIONS, HOST, 'chmod 755 ' + remote + ' ' + remote + '/postgres-read.test'], check=True)
    with (HERE / 'sql-live.log').open('wb') as log:
        run = subprocess.run(
            ['ssh', *OPTIONS, HOST, 'python3 - ' + remote + '/postgres-read.test'],
            input=(HERE / 'remote-check.py').read_bytes(), stdout=log, stderr=subprocess.STDOUT)
        code = run.returncode
finally:
    cleanup = subprocess.run(['ssh', *OPTIONS, HOST, 'rm -f ' + remote + '/postgres-read.test && rmdir ' + remote])
    removed = cleanup.returncode == 0
    receipt = {'startedAt': started, 'finishedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
               'backendCommit': 'c789772bce4e3af45e47ade9a68cd10b7d9dee0c',
               'binarySHA256': EXPECTED, 'remoteTemporaryDirectory': remote,
               'removedOwnTemporaryDirectory': removed, 'exitCode': code}
    log = HERE / 'sql-live.log'
    if log.exists():
        receipt['logSHA256'] = hashlib.sha256(log.read_bytes()).hexdigest()
        receipt['databaseCleanupConfirmed'] = '"removedOwnTemporaryDatabase": true' in log.read_text()
    (HERE / 'receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps(receipt))
raise SystemExit(code if code else (0 if removed else 1))

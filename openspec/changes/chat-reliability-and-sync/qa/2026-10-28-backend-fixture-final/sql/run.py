import datetime
import hashlib
import json
import pathlib
import re
import subprocess

ROOT = pathlib.Path('/Users/misha/Documents/Codex/projects/group-planning')
HERE = pathlib.Path(__file__).parent
HOST = 'somewhere-admin@158.160.246.254'
OPTIONS = ['-i', str(ROOT / 'infra/local/somewhere-admin'), '-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes',
           '-o', 'StrictHostKeyChecking=yes', '-o', 'ConnectTimeout=8',
           '-o', 'UserKnownHostsFile=' + str(ROOT / 'infra/local/known_hosts')]
BINARY = pathlib.Path('/tmp/somewhere-backend-fixture-final-20261028/postgres-read.test')
EXPECTED = '9c652a909431f1572c13f4d075a7918ec085b1402f1a35b126f7008cfcbd281f'
assert hashlib.sha256(BINARY.read_bytes()).hexdigest() == EXPECTED
EXTRA = pathlib.Path('/tmp/somewhere-backend-fixture-final-20261028/repeat-realtime.test')
EXTRA_HASH = '28db4e72152d9563bd260d362b8d27c6469c1731be71be09a6350292d728cb3a'
assert hashlib.sha256(EXTRA.read_bytes()).hexdigest() == EXTRA_HASH
started = datetime.datetime.now(datetime.timezone.utc).isoformat()
remote = subprocess.check_output(
    ['ssh', *OPTIONS, HOST, 'mktemp -d /tmp/codex-chat-independent-XXXXXXXX'], text=True
).strip()
assert re.fullmatch(r'/tmp/codex-chat-independent-[A-Za-z0-9]{8}', remote)
code = 1
removed = False
try:
    subprocess.run(['scp', *OPTIONS, str(BINARY), str(EXTRA), HOST + ':' + remote + '/'], check=True)
    subprocess.run(['ssh', *OPTIONS, HOST, 'chmod 755 ' + remote + ' ' + remote + '/postgres-read.test ' + remote + '/repeat-realtime.test'], check=True)
    with (HERE / 'sql-live.log').open('wb') as log:
        run = subprocess.run(
            ['ssh', *OPTIONS, HOST, 'python3 - ' + remote + '/postgres-read.test'],
            input=(HERE / 'remote-check.py').read_bytes(), stdout=log, stderr=subprocess.STDOUT)
        code = run.returncode
finally:
    cleanup = subprocess.run(['ssh', *OPTIONS, HOST, 'rm -f ' + remote + '/postgres-read.test ' + remote + '/repeat-realtime.test && rmdir ' + remote])
    removed = cleanup.returncode == 0
    receipt = {'startedAt': started, 'finishedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
               'productionSourceHash': '3a3816f7d71b858a5d5e98a7e510ecb6da4c9f57188db5a9b44247bb2da9d96f',
               'binarySHA256': EXPECTED, 'extraBinarySHA256': EXTRA_HASH, 'remoteTemporaryDirectory': remote,
               'removedOwnTemporaryDirectory': removed, 'exitCode': code}
    log = HERE / 'sql-live.log'
    if log.exists():
        receipt['logSHA256'] = hashlib.sha256(log.read_bytes()).hexdigest()
        receipt['databaseCleanupConfirmed'] = '"removedOwnTemporaryDatabase": true' in log.read_text()
    (HERE / 'receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps(receipt))
raise SystemExit(code if code else (0 if removed else 1))

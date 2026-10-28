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
BINARY = pathlib.Path('/tmp/sql-cleanup-20261028/postgres-read.test')
EXPECTED = '4939e6ce875388117eca63e0f7fa9b87624cf958b06bef489f3de9bf255a3647'
assert hashlib.sha256(BINARY.read_bytes()).hexdigest() == EXPECTED
started = datetime.datetime.now(datetime.timezone.utc).isoformat()
remote = subprocess.check_output(
    ['ssh', *OPTIONS, HOST, 'mktemp -d /tmp/codex-chat-cleanup-XXXXXXXX'], text=True
).strip()
assert re.fullmatch(r'/tmp/codex-chat-cleanup-[A-Za-z0-9]{8}', remote)
code = 1
removed = False
try:
    subprocess.run(['scp', *OPTIONS, str(BINARY), HOST + ':' + remote + '/'], check=True)
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
               'backendCommit': '0fb96472',
               'binarySHA256': EXPECTED, 'remoteTemporaryDirectory': remote,
               'removedOwnTemporaryDirectory': removed, 'exitCode': code}
    log = HERE / 'sql-live.log'
    if log.exists():
        receipt['logSHA256'] = hashlib.sha256(log.read_bytes()).hexdigest()
        receipt['databaseCleanupConfirmed'] = '"removedOwnTemporaryDatabase": true' in log.read_text()
    (HERE / 'receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps(receipt))
raise SystemExit(code if code else (0 if removed else 1))

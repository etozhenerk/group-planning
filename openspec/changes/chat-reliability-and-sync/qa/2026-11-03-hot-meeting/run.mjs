import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { spawn } from 'node:child_process';

const directory = dirname(fileURLToPath(import.meta.url));
const root = resolve(directory, '../../../../..');
const bundle = {
  base: await readFile(resolve(root, 'openspec/changes/deployment-and-store-release/qa/2026-11-03-database-portability/verify.py'), 'utf8'),
  socket: await readFile(resolve(directory, 'socket_client.py'), 'utf8'),
  profile: await readFile(resolve(directory, 'profile.py'), 'utf8'),
  key: Buffer.from('k'.repeat(32)).toString('base64'),
  binary: process.argv[3] ?? null,
};
const bootstrap = `import json,sys
bundle=json.load(sys.stdin)
scope={'__name__':'sdd_hot_profile'}
exec(compile(bundle['socket'],'socket_client.py','exec'),scope)
exec(compile(bundle['profile'],'hot-profile-fixture.py','exec'),scope)
source=bundle['base']
anchor="def launch(endpoint, ca='server.crt'):"
assert source.count(anchor)==1
source=source.replace(anchor,"def launch(endpoint, ca='server.crt', direct=False):")
anchor="                environment = ["
assert source.count(anchor)==1
source=source.replace(anchor,"                if direct:"+chr(10)+"                    database_url='host=/var/run/postgresql dbname='+database+' user=somewhere sslmode=disable'"+chr(10)+anchor)
if bundle.get('binary'):
    original="Path('/opt/somewhere/backend/current/somewhere-api').resolve()"
    assert source.count(original)==1
    source=source.replace(original,"Path("+repr(bundle['binary'])+").resolve()")
anchor='            stop(second)'+chr(10)+'            for log in logs:'
assert source.count(anchor)==1
source=source.replace(anchor,'            hot_profile(locals())'+chr(10)+anchor)
anchor="'SOMEWHERE_YANDEX_CLIENT_SECRET=synthetic-provider-secret']"
assert source.count(anchor)==1
source=source.replace(anchor,"'SOMEWHERE_YANDEX_CLIENT_SECRET=synthetic-provider-secret','SOMEWHERE_CHAT_SYNC_KEY="+bundle['key']+"','SOMEWHERE_CHAT_READ_STATE=true']")
base={'__name__':'sdd_base','hot_profile':scope['hot_profile']}
exec(compile(source,'isolated_fixture.py','exec'),base)
scope['base']=base
base['main']()
`;
const encoded = Buffer.from(bootstrap).toString('base64');
const argument = `sudo python3 -c "import base64;exec(base64.b64decode('${encoded}'))"`;
const log = process.argv[2];
if (!log) throw new Error('Usage: node run.mjs /absolute/path/to/new.log');
await writeFile(log, '', { flag: 'wx' });
const { appendFile } = await import('node:fs/promises');
const child = spawn('ssh', ['-i', 'infra/local/somewhere-admin', '-o', 'IdentitiesOnly=yes', '-o', 'BatchMode=yes',
  '-o', 'ConnectTimeout=8', '-o', 'StrictHostKeyChecking=yes', '-o', 'UserKnownHostsFile=infra/local/known_hosts',
  'somewhere-admin@158.160.246.254', argument], { cwd: root, stdio: ['pipe', 'pipe', 'pipe'] });
let writes = Promise.resolve();
for (const output of [child.stdout, child.stderr]) output.on('data', (bytes) => {
  writes = writes.then(() => appendFile(log, bytes));
  process.stdout.write(bytes);
});
child.stdin.end(JSON.stringify(bundle));
const code = await new Promise((resolveExit) => child.on('close', resolveExit));
await writes;
process.exitCode = code ?? 1;

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const directory = dirname(fileURLToPath(import.meta.url));
const root = resolve(directory, '../../../../..');
const [log, output] = process.argv.slice(2);
if (!log || !output) throw new Error('Usage: node query_probe.mjs live-profile.log new-output.json');
let liveLog = '';
for (let attempt = 0; attempt < 60; attempt += 1) {
  liveLog = await readFile(log, 'utf8');
  if (liveLog.includes('"cleanup":')) throw new Error('Profile already terminated; do not query a removed fixture');
  if (liveLog.includes('"stage": "100_websockets_subscribed"')) break;
  await new Promise((resolveWait) => setTimeout(resolveWait, 1_000));
}
if (!liveLog.includes('"stage": "100_websockets_subscribed"')) throw new Error('Fixture not ready for SQL probe');
const first = JSON.parse(liveLog.split('\n')[0]);
const source = await readFile(resolve(root, 'backend/internal/storage/postgres/feed_window.go'), 'utf8');
const queries = {};
for (const name of ['feedInitialSQL', 'feedAfterSQL', 'feedBeforeSQL', 'feedTailSQL', 'feedEntrySQL', 'feedRequestSQL']) {
  const match = source.match(new RegExp(`${name}\\s*=\\s*\x60([^\x60]+)\x60`));
  if (!match) throw new Error(`Missing production query ${name}`);
  queries[name] = match[1];
}
const program = Buffer.from(await readFile(resolve(directory, 'query_probe.py'), 'utf8')).toString('base64');
const command = `sudo python3 -c "import base64;exec(base64.b64decode('${program}'))"`;
const child = spawn('ssh', ['-i', 'infra/local/somewhere-admin', '-o', 'IdentitiesOnly=yes', '-o', 'BatchMode=yes',
  '-o', 'ConnectTimeout=8', '-o', 'StrictHostKeyChecking=yes', '-o', 'UserKnownHostsFile=infra/local/known_hosts',
  'somewhere-admin@158.160.246.254', command], { cwd: root, stdio: ['pipe', 'pipe', 'pipe'] });
let stdout = '', stderr = '';
child.stdout.on('data', (bytes) => { stdout += bytes; });
child.stderr.on('data', (bytes) => { stderr += bytes; });
child.stdin.end(JSON.stringify({ database: first.test_database, marker: first.test_marker, queries, empty: process.argv[4] === 'empty' }));
const code = await new Promise((resolveExit) => child.on('close', resolveExit));
if (code) throw new Error(`SQL probe failed: ${stderr}`);
const result = JSON.parse(stdout);
await writeFile(output, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ result: result.result, history: result.history_at_start,
  queries: result.queries.map(({ query, p95_planning_execution_ms, maximum_feed_rows_examined }) =>
    ({ query, p95_planning_execution_ms, maximum_feed_rows_examined })) }));

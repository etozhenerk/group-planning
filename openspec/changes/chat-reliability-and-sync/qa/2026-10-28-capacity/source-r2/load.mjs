import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { setTimeout as delay } from 'node:timers/promises';

// Engineering harness. No application UI or production configuration is used.
const require = createRequire(`${process.cwd()}/package.json`);
const { Centrifuge } = require('centrifuge');
const { ws: WebSocket } = require(`${process.cwd()}/node_modules/playwright-core/lib/utilsBundle.js`);
const [configPath, outputPath, mode = 'hot', steadyInput = '900', burstInput = '60'] = process.argv.slice(2);
if (!configPath || !outputPath || !['hot', 'distributed'].includes(mode)) throw new Error('Arguments: private-config result hot|distributed [steady-seconds burst-seconds]');
const config = JSON.parse(await readFile(configPath, 'utf8'));
if (new URL(config.url).hostname !== '127.0.0.1') throw new Error('Only isolated loopback fixture allowed');
const steadySeconds = Number(steadyInput);
const burstSeconds = Number(burstInput);
const halfRTT = 75;
const errors = [];
const samples = [];
const sends = new Map();
const requests = { snapshots: 0, catchups: 0, posts: 0 };
const clients = [];
const startedAt = new Date().toISOString();
let stopping = false;
let failed = false;

const fail = (kind, detail) => {
  failed = true;
  if (errors.length < 40) errors.push({ kind, detail: String(detail).slice(0, 180), elapsed_ms: performance.now() });
};
const api = async (user, pathname, options = {}) => {
  await delay(halfRTT);
  const response = await fetch(`${config.url}/api/v1${pathname}`, {
    ...options, signal: AbortSignal.timeout(15_000),
    headers: { Authorization: `Bearer ${user.Token}`, 'Content-Type': 'application/json', ...options.headers },
  });
  const result = await response.json();
  await delay(halfRTT);
  if (!response.ok) throw new Error(`HTTP ${response.status} ${result.error?.code ?? ''}`);
  return result;
};
const stats = async () => (await fetch(`${config.url}/__capacity/stats`)).json();
const observe = (client, entry) => {
  const message = sends.get(entry?.client_request_id);
  if (!message || message.seen.has(client.index)) return;
  message.seen.add(client.index);
  samples.push(performance.now() - message.start);
  if (message.seen.size === message.expected) message.last = performance.now();
};
const catchup = async (client) => {
  client.dirty = true;
  if (client.running || stopping) return;
  client.running = true;
  try {
    while (client.dirty && !stopping) {
      client.dirty = false;
      let more = true;
      while (more && !stopping) {
        requests.catchups++;
        const data = await api(client.user, `/meetings/${client.meeting}/sync?limit=100&cursor=${encodeURIComponent(client.cursor)}`);
        if (data.mode !== 'changes') throw new Error('Expected change page');
        for (const change of data.changes) observe(client, change.projection?.entry);
        client.cursor = data.next_cursor;
        more = data.has_more;
      }
    }
  } catch (error) { fail('catchup', error.message); }
  finally { client.running = false; }
};
const connect = async (user, index) => {
  const meeting = mode === 'hot' ? config.hot_meeting : user.Meeting;
  requests.snapshots++;
  const snapshot = await api(user, `/meetings/${meeting}/sync?limit=50`);
  const client = { user, index, meeting, cursor: snapshot.change_cursor, running: false, dirty: false, sdk: null };
  class NativeSocket extends WebSocket {
    constructor(url, protocols) { super(url, protocols, { headers: { Authorization: `Bearer ${user.Token}` } }); }
  }
  const sdk = new Centrifuge(`${config.url.replace('http:', 'ws:')}/api/v1/realtime`, { websocket: NativeSocket });
  client.sdk = sdk;
  clients.push(client);
  sdk.on('error', ({ type, error }) => fail('sdk', `${type}:${error.code}`));
  sdk.on('disconnected', ({ code }) => { if (!stopping) fail('disconnect', code); });
  const sub = sdk.newSubscription(`meeting:${meeting}`);
  sub.on('publication', () => { void delay(halfRTT).then(() => catchup(client)); });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Subscribe timeout')), 12_000);
    sub.on('subscribed', () => { clearTimeout(timeout); resolve(); });
    sub.on('error', ({ error }) => { clearTimeout(timeout); reject(new Error(`Subscription ${error.code}`)); });
    sub.subscribe(); sdk.connect();
  });
  await catchup(client);
};
const send = async (number, stage) => {
  const user = config.users[number % config.users.length];
  const meeting = mode === 'hot' ? config.hot_meeting : user.Meeting;
  const id = randomUUID();
  const message = { start: performance.now(), ack: null, last: null, expected: mode === 'hot' ? 100 : 10, seen: new Set(), stage };
  sends.set(id, message);
  try {
    requests.posts++;
    await api(user, `/meetings/${meeting}/messages`, {
      method: 'POST', headers: { 'Idempotency-Key': id }, body: JSON.stringify({ text: `Нагрузочный тест ${number}`, client_request_id: id }),
    });
    message.ack = performance.now();
  } catch (error) { fail('post', error.message); }
};
const runStage = async (seconds, rate, label) => {
  const start = performance.now();
  const pending = new Set();
  const base = sends.size;
  for (let n = 0; n < seconds * rate; n++) {
    if (failed) break;
    await delay(Math.max(0, start + n * 1000 / rate - performance.now()));
    const operation = send(base + n, label);
    pending.add(operation); void operation.finally(() => pending.delete(operation));
    if (n % (rate * 60) === 0) console.log(JSON.stringify({ stage: label, sent: sends.size, received: samples.length, elapsed_s: Math.round((performance.now() - start) / 1000) }));
  }
  await Promise.all(pending);
};
const quantiles = (values) => {
  const sorted = [...values].sort((a,b) => a-b);
  const at = (p) => sorted.length ? sorted[Math.min(sorted.length-1, Math.ceil(sorted.length*p)-1)] : null;
  return { count: sorted.length, p50_ms: at(.5), p95_ms: at(.95), p99_ms: at(.99), max_ms: at(1) };
};

let before, after, idleRequests;
try {
  for (let index = 0; index < 100; index += 10) await Promise.all(config.users.slice(index,index+10).map((user, offset) => connect(user,index+offset)));
  before = await stats();
  if (before.clients !== 100) throw new Error(`Expected 100 clients, got ${before.clients}`);
  const idleBefore = requests.catchups;
  await delay(2_000);
  idleRequests = requests.catchups - idleBefore;
  if (idleRequests) throw new Error('Unexpected idle catchups');
  console.log(JSON.stringify({ ready: 100, mode, steadySeconds, burstSeconds, backend: before }));
  await runStage(steadySeconds, 5, 'steady');
  await runStage(burstSeconds, 20, 'burst');
  const drainDeadline = performance.now()+15_000;
  while (performance.now()<drainDeadline && [...sends.values()].some((m)=>m.seen.size!==m.expected)) await delay(200);
  after = await stats();
} catch (error) { fail('harness', error.message); }
finally {
  stopping = true;
  for (const client of clients) client.sdk.disconnect();
}
const values = [...sends.values()];
const missing = values.reduce((total,m) => total+m.expected-m.seen.size,0);
const result = {
  startedAt, finishedAt: new Date().toISOString(), mode, backendCommit: 'c789772bce4e3af45e47ade9a68cd10b7d9dee0c',
  storage: 'memory.Store', clients: 100, steadySeconds, steadyRate: 5, burstSeconds, burstRate: 20,
  artificialHTTPRoundTripMs: halfRTT*2, artificialPublicationDelayMs: halfRTT,
  measurement: 'Same-process monotonic POST start to canonical entry received from HTTP catch-up after SDK hint; upper bound includes pre-commit time. No UI/render/SQL claim.',
  idleRequests, requests, backendBefore: before, backendAfter: after, errors, missingDeliveries: missing,
  acknowledgements: quantiles(values.filter((m)=>m.ack!==null).map((m)=>m.ack-m.start)),
  allDeliveries: quantiles(samples), lastSubscriberPerMessage: quantiles(values.filter((m)=>m.last!==null).map((m)=>m.last-m.start)),
  stages: Object.fromEntries(['steady','burst'].map((stage)=>[stage,quantiles(values.filter((m)=>m.stage===stage&&m.last!==null).map((m)=>m.last-m.start))])),
  complete: !failed && !missing && sends.size===steadySeconds*5+burstSeconds*20,
};
await writeFile(outputPath, JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
process.exitCode = result.complete ? 0 : 1;

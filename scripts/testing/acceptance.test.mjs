import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { stringify } from 'yaml';
import { readCatalog, scenarioBlocks } from './catalog.mjs';
import { makePlan, currentPlan, hashPlan, readArtifact } from './plan.mjs';
import { inspectRun, evidenceFor, executeSuite } from './results.mjs';
import { exportReport } from './report.mjs';
import { checkManifests } from './manifests.mjs';
import { sha256 } from '../design/files.mjs';

const fixture = async (t, platform = 'web') => {
  const root = await mkdtemp(join(tmpdir(), 'somewhere-qa-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const put = async (path, value) => { const target = join(root, path); await mkdir(join(target, '..'), { recursive: true }); await writeFile(target, typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value)); };
  const source = 'openspec/changes/feature/specs/example/spec.md';
  const body = '## ADDED Requirements\n### Requirement: Join\nSystem SHALL allow valid entry.\n#### Scenario: Allowed\n- **WHEN** guest joins\n- **THEN** chat opens\n';
  await put(source, body); await put('src/app.ts', 'export const app = 1;');
  await put('src/app.test.ts', "test('entry works', () => {});");
  const c = { id: 'TC-ENTRY', title: 'Entry', lifecycle: 'active', level: 'e2e', risk: 'critical',
    source: { path: source, requirement: 'Join', scenario: 'Allowed', sha256: scenarioBlocks(body)[0].sha256 },
    platforms: [platform], preconditions: ['Isolated guest'], steps: [{ action: 'Join', expected: 'Chat opens' }], cleanup: ['Delete guest'],
    automation: { [platform]: { status: 'manual', health: 'unknown', tests: [] } } };
  const config = { schemaVersion: 1, sources: [source], excludedSources: [], profiles: { desktop: { platform }, mobile: { platform } },
    releaseProfiles: { [platform]: ['desktop', 'mobile'] }, inputs: { [platform]: ['src'] },
    runners: { unit: { platforms: [platform], cwd: '.', command: [process.execPath, '-e', 'console.log("actual runner")'], required: true, scope: 'source' } },
    manifests: [], legacyChanges: ['feature'], nonProductChanges: [] };
  const save = async () => { await put('testing/config.json', config); await put('testing/cases/cases.yaml', stringify([c])); };
  await save();
  const env = { id: 'desktop', profile: 'desktop', platform, application: 'product', url: 'http://127.0.0.1:9999', build: 'fixture', os: 'test', device: 'chromium', locale: 'ru', timezone: 'Europe/Moscow', data: 'isolated', backend: 'fixture-api' };
  const plan = (extra = {}) => makePlan(root, { purpose: 'feature', component: platform, selectedCases: [c.id], environments: [env], implementer: 'author', id: 'run', ...extra });
  const pass = async (p) => {
    await put('evidence/actions.txt', 'Clicked Join on product; observed chat and sent a message.');
    await put('evidence/view.png', Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZlSAAAAAASUVORK5CYII=', 'base64'));
    const time = new Date().toISOString();
    return { schemaVersion: 1, planHash: hashPlan(p), checks: p.expected.map((e) => ({ id: e.id, status: 'passed', executor: { kind: 'agent', id: 'reviewer' }, startedAt: time, finishedAt: time, actual: 'Chat opened', defect: '', evidence: [] })),
      suites: [{ id: 'unit', status: 'passed', commandHash: sha256(JSON.stringify(config.runners.unit)), startedAt: time, finishedAt: time, exitCode: 0, actual: 'Process exited 0', evidence: [await evidenceFor(root, 'evidence/actions.txt', 'log')] }] };
  };
  const addEvidence = async (run) => { for (const c of run.checks) c.evidence = [await evidenceFor(root, 'evidence/actions.txt', 'interaction'), await evidenceFor(root, 'evidence/view.png', 'screenshot')]; return run; };
  const artifact = async () => {
    const git = (args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    git(['init']); git(['add', 'src']);
    git(['-c', 'user.name=QA fixture', '-c', 'user.email=qa@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-m', 'fixture']);
    const commit = git(['rev-parse', 'HEAD']);
    await put('artifact/client.zip', 'candidate');
    await put('artifact/manifest.json', { component: 'web', version: '1.0.0', commit, artifacts: [{ name: 'client.zip', size: 9, sha256: sha256('candidate') }] });
    return readArtifact(join(root, 'artifact'));
  };
  return { root, put, c, config, source, body, save, env, plan, pass, addEvidence, artifact };
};

test('catalog rejects incomplete steps, missing automation and undisclosed specifications', async (t) => {
  const f = await fixture(t);
  assert.equal((await readCatalog(f.root)).cases.length, 1);
  f.c.steps = []; await f.save(); await assert.rejects(readCatalog(f.root), /minItems|fewer than/);
  f.c.steps = [{ action: 'Join', expected: 'Chat' }]; f.c.automation.web.status = 'automated'; await f.save();
  await assert.rejects(readCatalog(f.root), /Unproven automation/);
  f.c.automation.web.status = 'manual'; await f.save();
  await f.put('openspec/changes/feature/specs/new/spec.md', f.body);
  assert.match((await readCatalog(f.root)).gaps.join(), /Unclassified/);
});

test('normative requirement change invalidates acceptance even when scenario is unchanged', async (t) => {
  const f = await fixture(t); const p = await f.plan();
  await f.put(f.source, f.body.replace('valid entry', 'valid entry before cutoff'));
  await assert.rejects(currentPlan(f.root, p), /Stale catalog/);
});

test('release computes all applicable cases, requires every profile and exact candidate', async (t) => {
  const f = await fixture(t); const artifact = await f.artifact();
  const envs = ['desktop', 'mobile'].map((id) => ({ ...f.env, id, profile: id, build: artifact.manifestHash }));
  const options = { purpose: 'release', environments: envs, selectedCases: [], artifactDirectory: join(f.root, 'artifact') };
  const p = await f.plan(options); assert.equal(p.expected.length, 2);
  await assert.rejects(f.plan({ ...options, environments: [envs[0]] }), /Missing required/);
  await assert.rejects(f.plan({ ...options, environments: [f.env, envs[1]] }), /not bound/);
  await assert.rejects(currentPlan(f.root, { ...p, expected: [p.expected[0]] }, options.artifactDirectory), /tampered/);
  await f.put('src/new.ts', 'uncommitted runtime change');
  await assert.rejects(f.plan(options), /source differs/);
  await rm(join(f.root, 'src/new.ts'));
  await f.put('artifact/client.zip', 'changed!!');
  await assert.rejects(currentPlan(f.root, p, options.artifactDirectory), /checksum/);
});

test('partial and flaky cases remain manual; source automation cannot replace candidate check', async (t) => {
  const f = await fixture(t);
  f.c.automation.web = { status: 'partial', health: 'stable', tests: [{ path: 'src/app.test.ts', selector: 'entry works', runner: 'unit', level: 'e2e' }] }; await f.save();
  assert.deepEqual((await f.plan()).expected.map((e) => e.mode), ['manual']);
  f.c.automation.web.status = 'automated'; f.c.automation.web.health = 'flaky'; await f.save();
  assert.deepEqual((await f.plan()).expected.map((e) => e.mode), ['manual']);
  f.c.automation.web.health = 'stable'; await f.save();
  assert.deepEqual((await f.plan()).expected.map((e) => e.mode), ['automated', 'manual']);
  const a = await f.artifact();
  const p = await f.plan({ purpose: 'release', artifactDirectory: join(f.root, 'artifact'), environments: ['desktop', 'mobile'].map((id) => ({ ...f.env, id, profile: id, build: a.manifestHash })) });
  assert.equal(p.expected.filter((e) => e.mode === 'manual').length, 2);
});

test('readiness rejects missing, blocked, duplicate, self-reviewed and changed evidence', async (t) => {
  const f = await fixture(t); const p = await f.plan(); const r = await f.addEvidence(await f.pass(p));
  assert.equal((await inspectRun(f.root, p, r, f.root, { ready: true })).ready, true);
  const check = async (run, pattern) => assert.rejects(inspectRun(f.root, p, run, f.root, { ready: true }), pattern);
  await check({ ...r, checks: [] }, /not_run/);
  await check({ ...r, checks: [...r.checks, ...r.checks] }, /duplicate|unique/);
  await check({ ...r, checks: [{ ...r.checks[0], status: 'blocked' }] }, /blocked/);
  await check({ ...r, checks: [{ ...r.checks[0], evidence: [] }] }, /interaction/);
  await check({ ...r, checks: [{ ...r.checks[0], executor: { kind: 'agent', id: 'author' } }] }, /independent/);
  await check({ ...r, suites: [] }, /not_run/);
  await check({ ...r, suites: [{ ...r.suites[0], exitCode: 1 }] }, /False suite/);
  await f.put('evidence/view.png', 'not a screenshot'); await check(r, /Evidence changed/);
});

test('code edits stale an otherwise successful feature run', async (t) => {
  const f = await fixture(t); const p = await f.plan(); const r = await f.addEvidence(await f.pass(p));
  await f.put('src/app.ts', 'export const app = 2;');
  await assert.rejects(inspectRun(f.root, p, r, f.root, { ready: true }), /Stale implementation/);
});

test('manual UI e2e requires a screenshot on every client platform', async (t) => {
  for (const platform of ['web', 'ios', 'android']) {
    const f = await fixture(t, platform); const p = await f.plan(); const r = await f.addEvidence(await f.pass(p));
    assert.equal((await inspectRun(f.root, p, r, f.root, { ready: true })).ready, true);
    r.checks[0].evidence = r.checks[0].evidence.filter((e) => e.kind !== 'screenshot');
    await assert.rejects(inspectRun(f.root, p, r, f.root, { ready: true }), /Missing screenshot/);
  }
});

test('manual backend e2e accepts interaction evidence without an artificial screenshot', async (t) => {
  const f = await fixture(t, 'backend'); const p = await f.plan(); const r = await f.pass(p);
  await f.put('evidence/api.txt', 'POST entry returned 201; subsequent GET returned the created entry.');
  r.checks[0].evidence = [await evidenceFor(f.root, 'evidence/api.txt', 'interaction')];
  assert.equal((await inspectRun(f.root, p, r, f.root, { ready: true })).ready, true);
  r.checks[0].evidence = [];
  await assert.rejects(inspectRun(f.root, p, r, f.root, { ready: true }), /Missing interaction/);
});

test('automated pass requires the actual matched runner test to pass', async (t) => {
  const f = await fixture(t);
  const ref = { path: 'src/app.test.ts', selector: 'entry works', runner: 'unit', level: 'unit' };
  f.c.level = 'unit'; f.c.automation.web = { status: 'automated', health: 'stable', tests: [ref] }; await f.save();
  const p = await f.plan(); const r = await f.pass(p); r.checks[0].executor = { kind: 'runner', id: 'unit' };
  const proof = async (state) => {
    await f.put('raw.json', { testResults: [{ name: join(f.root, ref.path), startTime: Date.now(), assertionResults: [{ fullName: ref.selector, status: state }] }] });
    const original = await evidenceFor(f.root, 'raw.json', 'log');
    await f.put('normalized.json', { schemaVersion: 1, planHash: hashPlan(p), checkId: p.expected[0].id, tests: [{ ...ref, status: 'passed', original }] });
    r.checks[0].evidence = [await evidenceFor(f.root, 'normalized.json', 'raw')];
  };
  await proof('failed'); await assert.rejects(inspectRun(f.root, p, r, f.root, { ready: true }), /does not prove pass/);
  await proof('passed'); assert.equal((await inspectRun(f.root, p, r, f.root, { ready: true })).ready, true);
});

test('task gate allows checkpoint but rejects omitted tasks and completed task without evidence', async (t) => {
  const f = await fixture(t);
  f.config.legacyChanges = []; f.config.manifests = ['manifest.json']; await f.save();
  await f.put('openspec/changes/feature/tasks.md', '- [ ] 1.1 UI\n- [x] 1.2 UI again\n');
  const m = { schemaVersion: 1, change: 'feature', phase: 'checkpoint', plan: 'missing.json', run: 'missing-run.json', tasks: [{ id: '1.1', cases: ['TC-ENTRY'], platforms: ['web'] }], exemptTasks: [] };
  await f.put('manifest.json', m); await assert.rejects(checkManifests(f.root, f.config), /Unclassified task/);
  await f.put('openspec/changes/feature/tasks.md', '- [ ] 1.1 UI\n');
  await checkManifests(f.root, f.config);
  await f.put('openspec/changes/feature/tasks.md', '- [x] 1.1 UI\n');
  await assert.rejects(checkManifests(f.root, f.config), /ENOENT/);
});

test('real suite execution records exit and report preserves failed suites and blocked checks', async (t) => {
  const f = await fixture(t); const p = await f.plan();
  const suite = await executeSuite(f.root, p, 'unit', f.root);
  assert.equal(suite.status, 'passed'); assert.match(await readFile(join(f.root, suite.evidence[0].path), 'utf8'), /actual runner/);
  const r = await f.pass(p); r.checks[0].status = 'blocked'; r.checks[0].actual = 'Device unavailable'; r.suites[0].status = 'failed'; r.suites[0].exitCode = 1;
  await exportReport(p, r, f.root, join(f.root, 'report'));
  const files = await readdir(join(f.root, 'report/allure-results'));
  const results = await Promise.all(files.filter((f) => f.endsWith('-result.json')).map(async (file) => JSON.parse(await readFile(join(f.root, 'report/allure-results', file)))));
  assert.deepEqual(results.map((r) => r.status).sort(), ['broken', 'failed']);
});

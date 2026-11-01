import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import yaml from '/Users/misha/Documents/Codex/projects/group-planning/node_modules/yaml/dist/index.js';
const { stringify } = yaml;
import { readCatalog, scenarioBlocks } from '/Users/misha/Documents/Codex/projects/group-planning/scripts/testing/catalog.mjs';
import { makePlan, currentPlan, hashPlan, readArtifact } from '/Users/misha/Documents/Codex/projects/group-planning/scripts/testing/plan.mjs';
import { inspectRun, evidenceFor, executeSuite } from '/Users/misha/Documents/Codex/projects/group-planning/scripts/testing/results.mjs';
import { exportReport } from '/Users/misha/Documents/Codex/projects/group-planning/scripts/testing/report.mjs';
import { checkManifests } from '/Users/misha/Documents/Codex/projects/group-planning/scripts/testing/manifests.mjs';
import { taskChecks } from '/Users/misha/Documents/Codex/projects/group-planning/scripts/testing/task-scope.mjs';
import { sha256 } from '/Users/misha/Documents/Codex/projects/group-planning/scripts/design/files.mjs';

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

const taskFixture = async (t) => {
  const f = await fixture(t);
  const body = `${f.body}#### Scenario: Other\n- **WHEN** another action runs\n- **THEN** another result appears\n`;
  const other = { ...f.c, id: 'TC-OTHER', source: { ...f.c.source, scenario: 'Other',
    sha256: scenarioBlocks(body).find((s) => s.scenario === 'Other').sha256 } };
  await f.put(f.source, body);
  await f.put('testing/cases/cases.yaml', stringify([f.c, other]));
  f.config.legacyChanges = [];
  f.config.manifests = ['manifest.json'];
  await f.put('testing/config.json', f.config);
  await f.put('openspec/changes/feature/tasks.md', '- [x] 1.1 First\n- [ ] 1.2 Other\n- [ ] 1.3 Docs\n');
  const p = await f.plan({ selectedCases: [f.c.id, other.id] });
  const r = await f.addEvidence(await f.pass(p));
  r.checks = r.checks.filter((c) => c.id.startsWith('TC-ENTRY/'));
  const m = { schemaVersion: 1, change: 'feature', phase: 'checkpoint', plan: 'plan.json', run: 'run.json',
    tasks: [{ id: '1.1', cases: [f.c.id], platforms: ['web'] }, { id: '1.2', cases: [other.id], platforms: ['web'] }],
    exemptTasks: [{ id: '1.3', reason: 'Documentation only' }] };
  await f.put('plan.json', p);
  await f.put('run.json', r);
  await f.put('manifest.json', m);
  return { ...f, p, r, m, other };
};


test('independent negative: review and complete manifests cannot use task-only ready', async (t) => {
  const f = await taskFixture(t);
  for (const phase of ['review', 'complete']) {
    await assert.rejects(async () => {
      const ids = await taskChecks(f.root, f.p, { ...f.m, phase }, ['1.1']);
      return inspectRun(f.root, f.p, f.r, f.root, { ready: true, requiredChecks: ids });
    }, /phase|full|review|complete|TC-OTHER/);
  }
});

test('independent negative: duplicate mapping cannot select the first narrower task', async (t) => {
  const f = await taskFixture(t);
  const m = structuredClone(f.m);
  m.tasks.push({ id: '1.1', cases: [f.other.id], platforms: ['web'] });
  await assert.rejects(taskChecks(f.root, f.p, m, ['1.1']), /duplicate|Duplicate/);
});

test('independent negative: task classified both mapped and exempt is rejected', async (t) => {
  const f = await taskFixture(t);
  const m = structuredClone(f.m);
  m.exemptTasks.push({ id: '1.1', reason: 'Contradictory classification' });
  await assert.rejects(taskChecks(f.root, f.p, m, ['1.1']), /duplicate|Duplicate|exempt/);
});

test('independent negative: required-suite failure cannot collide with unrelated check label', async (t) => {
  const f = await taskFixture(t);
  const collision = f.p.expected.find(e => e.caseId === f.other.id).id;
  const r = await f.addEvidence(await f.pass(f.p));
  f.config.runners[collision] = f.config.runners.unit;
  delete f.config.runners.unit;
  await f.put('testing/config.json', f.config);
  const p = await f.plan({selectedCases: [f.c.id, f.other.id]});
  r.planHash = hashPlan(p);
  const now = new Date().toISOString();
  for (const check of r.checks) { check.startedAt = now; check.finishedAt = now; }
  r.suites[0].startedAt = now; r.suites[0].finishedAt = now;
  r.suites[0].id = collision;
  r.suites[0].commandHash = sha256(JSON.stringify(f.config.runners[collision]));
  r.suites[0].status = 'failed'; r.suites[0].exitCode = 1;
  r.checks.find(c => c.id === collision).status = 'failed';
  const ids = await taskChecks(f.root, p, f.m, ['1.1']);
  await assert.rejects(inspectRun(f.root, p, r, f.root, {ready: true, requiredChecks: ids}), /incomplete|failed/);
});

test('independent control: genuine unrelated failed check does not make whole run ready', async (t) => {
  const f = await taskFixture(t);
  const r = await f.addEvidence(await f.pass(f.p));
  r.checks.find(c => c.id.startsWith('TC-OTHER/')).status = 'failed';
  const ids = await taskChecks(f.root, f.p, f.m, ['1.1']);
  const result = await inspectRun(f.root, f.p, r, f.root, { ready: true, requiredChecks: ids });
  assert.equal(result.ready, true); assert.equal(result.wholeReady, false);
  assert.match(result.outsideScope[0], /TC-OTHER.*failed/);
});

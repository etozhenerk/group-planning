import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { safePath, sha256, readJson } from '../design/files.mjs';
import { currentPlan, hashPlan } from './plan.mjs';
import { validate } from './schema.mjs';
import { rawPassed } from './raw-result.mjs';

export const writeNewJson = async (path, value) => {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' });
};
export const evidenceFor = async (directory, path, kind) => ({ path, kind, sha256: sha256(await readFile(await safePath(directory, path))) });
const checkTimes = (start, finish, plan) => {
  if (Date.parse(start) < Date.parse(plan.createdAt) || Date.parse(finish) < Date.parse(start) || Date.parse(finish) > Date.now() + 60_000)
    throw new Error('Invalid execution timestamps');
};
const checkEvidence = async (directory, entries) => {
  const kinds = new Set();
  for (const item of entries) {
    const bytes = await readFile(await safePath(directory, item.path));
    if (!bytes.length || sha256(bytes) !== item.sha256) throw new Error(`Evidence changed/empty: ${item.path}`);
    if (item.kind === 'screenshot') {
      const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
      if (!png && !jpeg) throw new Error(`Not a screenshot: ${item.path}`);
    }
    kinds.add(item.kind);
  }
  return kinds;
};
const checkAutomated = async (catalog, plan, expected, result, directory) => {
  const env = plan.environments.find((e) => e.id === expected.environment);
  const testCase = catalog.cases.find((c) => c.id === expected.caseId);
  const refs = testCase.automation[env.platform].tests;
  const records = [];
  for (const item of result.evidence.filter((e) => e.kind === 'raw')) {
    const proof = await readJson(await safePath(directory, item.path));
    if (proof.schemaVersion !== 1 || proof.planHash !== hashPlan(plan) || proof.checkId !== expected.id || !Array.isArray(proof.tests))
      throw new Error(`Invalid automated proof: ${expected.id}`);
    records.push(...proof.tests);
  }
  for (const ref of refs) {
    const matches = records.filter((r) => ['path', 'selector', 'runner', 'level'].every((key) => r[key] === ref[key]));
    if (matches.length !== 1 || matches[0].status !== 'passed' || matches[0].skipped || matches[0].retry > 0)
      throw new Error(`Automated test missing/failed/skipped/retried: ${ref.selector}`);
    const raw = matches[0].original;
    if (!raw || typeof raw.path !== 'string' || typeof raw.sha256 !== 'string') throw new Error('Missing original runner result');
    await checkEvidence(directory, [{ ...raw, kind: 'log' }]);
    if (!rawPassed(await readFile(await safePath(directory, raw.path), 'utf8'), ref, env, plan.createdAt))
      throw new Error(`Original runner result does not prove pass: ${ref.selector}`);
  }
  if (records.length !== refs.length) throw new Error('Unexpected automated test proof');
};
export const inspectRun = async (root, plan, run, directory, options = {}) => {
  validate('run', run);
  const catalog = await currentPlan(root, plan, options.artifactDirectory);
  if (run.planHash !== hashPlan(plan)) throw new Error('Stale/tampered run plan');
  const seen = new Set();
  const pending = [];
  for (const result of run.checks) {
    const expected = plan.expected.find((e) => e.id === result.id);
    if (!expected || seen.has(result.id)) throw new Error(`Unknown/duplicate check: ${result.id}`);
    seen.add(result.id);
    checkTimes(result.startedAt, result.finishedAt, plan);
    const kinds = await checkEvidence(directory, result.evidence);
    if (result.status !== 'passed') { pending.push(`${result.id}: ${result.status}`); continue; }
    if (expected.mode === 'manual') {
      if (!['agent', 'human'].includes(result.executor.kind) || result.executor.id === plan.implementer)
        throw new Error(`Not independent manual verification: ${result.id}`);
      if (!kinds.has('interaction')) throw new Error(`Missing interaction evidence: ${result.id}`);
      const testCase = catalog.cases.find((c) => c.id === expected.caseId);
      const environment = plan.environments.find((e) => e.id === expected.environment);
      const uiPlatform = ['web', 'ios', 'android'].includes(environment.platform);
      if (uiPlatform && testCase.level === 'e2e' && !kinds.has('screenshot')) throw new Error(`Missing screenshot: ${result.id}`);
    } else if (result.executor.kind !== 'runner' || !kinds.has('raw')) {
      throw new Error(`Missing raw automated result: ${result.id}`);
    } else await checkAutomated(catalog, plan, expected, result, directory);
  }
  for (const expected of plan.expected) if (!seen.has(expected.id)) pending.push(`${expected.id}: not_run`);
  const suites = new Set();
  for (const suite of run.suites) {
    if (!plan.suites.includes(suite.id) || suites.has(suite.id)) throw new Error(`Unknown/duplicate suite: ${suite.id}`);
    suites.add(suite.id);
    checkTimes(suite.startedAt, suite.finishedAt, plan);
    if (suite.commandHash !== sha256(JSON.stringify(catalog.config.runners[suite.id]))) throw new Error(`Stale suite: ${suite.id}`);
    const kinds = await checkEvidence(directory, suite.evidence);
    if (!kinds.has('log')) throw new Error(`Suite log missing: ${suite.id}`);
    if (suite.status === 'passed' && suite.exitCode !== 0) throw new Error(`False suite pass: ${suite.id}`);
    if (suite.status !== 'passed') pending.push(`${suite.id}: ${suite.status}`);
  }
  for (const id of plan.suites) if (!suites.has(id)) pending.push(`${id}: not_run`);
  if (options.ready && pending.length) throw new Error(`Functional acceptance incomplete: ${pending.join('; ')}`);
  return { ready: pending.length === 0, expected: plan.expected.length, checked: seen.size, pending };
};
export const executeSuite = async (root, plan, id, directory, artifactDirectory) => {
  const { config } = await currentPlan(root, plan, artifactDirectory);
  const runner = config.runners[id];
  if (!runner || !plan.suites.includes(id)) throw new Error('Suite is outside this plan');
  const startedAt = new Date().toISOString();
  const log = `suites/${id}-${Date.now()}.txt`;
  await mkdir(resolve(directory, 'suites'), { recursive: true });
  const path = resolve(directory, log);
  await writeFile(path, `Suite ${id}\nPlan ${hashPlan(plan)}\n`, { flag: 'wx' });
  const { appendFile } = await import('node:fs/promises');
  const cwd = runner.cwd === '.' ? root : await safePath(root, runner.cwd);
  let writes = Promise.resolve();
  const exitCode = await new Promise((resolveExit) => {
    const child = spawn(runner.command[0], runner.command.slice(1), { cwd, shell: false,
      env: { ...process.env, SOMEWHERE_QA_PLAN: JSON.stringify(plan), SOMEWHERE_QA_ARTIFACT_DIR: artifactDirectory ?? '' } });
    const capture = (chunk) => { process.stdout.write(chunk); writes = writes.then(() => appendFile(path, chunk)); };
    child.stdout.on('data', capture); child.stderr.on('data', capture);
    child.on('error', (error) => { capture(Buffer.from(error.message)); resolveExit(null); });
    child.on('close', (code) => resolveExit(code));
  });
  await writes;
  return { id, status: exitCode === 0 ? 'passed' : 'failed', commandHash: sha256(JSON.stringify(runner)),
    startedAt, finishedAt: new Date().toISOString(), exitCode, actual: `Process exit: ${exitCode}`,
    evidence: [await evidenceFor(directory, log, 'log')] };
};
export const loadRun = async (path) => validate('run', await readJson(path));

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { readJson, sha256 } from '../design/files.mjs';
import { readCatalog } from './catalog.mjs';
import { makePlan, hashPlan } from './plan.mjs';
import { inspectRun, executeSuite, loadRun, writeNewJson } from './results.mjs';
import { exportReport } from './report.mjs';
import { checkManifests } from './manifests.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const [command, ...args] = process.argv.slice(2);
const { values } = parseArgs({ args, options: Object.fromEntries(
  ['purpose', 'component', 'environments', 'cases', 'implementer', 'id', 'out', 'plan', 'run', 'suite', 'artifact-dir', 'receipt']
    .map((key) => [key, { type: 'string' }])) });
const required = (name) => { if (!values[name]) throw new Error(`Missing --${name}`); return values[name]; };
try {
  if (command === 'check') {
    const catalog = await readCatalog(root);
    await checkManifests(root, catalog.config);
    if (catalog.gaps.length) throw new Error(catalog.gaps.join('\n'));
    console.log(JSON.stringify({ cases: catalog.cases.length, gaps: catalog.gaps, note: 'Catalog validity is not functional acceptance' }, null, 2));
  } else if (command === 'plan') {
    const plan = await makePlan(root, { purpose: required('purpose'), component: required('component'),
      environments: await readJson(required('environments')), selectedCases: values.cases?.split(',') ?? [],
      implementer: required('implementer'), id: required('id'), artifactDirectory: values['artifact-dir'] });
    const output = resolve(required('out'));
    await writeNewJson(resolve(output, 'plan.json'), plan);
    await writeNewJson(resolve(output, 'run.json'), { schemaVersion: 1, planHash: hashPlan(plan), checks: [], suites: [] });
    console.log(JSON.stringify({ output, cases: plan.expected.length, suites: plan.suites }, null, 2));
  } else {
    const planPath = resolve(required('plan'));
    const runPath = resolve(required('run'));
    const plan = await readJson(planPath);
    const run = await loadRun(runPath);
    const directory = dirname(runPath);
    const options = { artifactDirectory: values['artifact-dir'] };
    if (command === 'run-suite') {
      await inspectRun(root, plan, run, directory, options);
      const id = required('suite');
      if (run.suites.some((s) => s.id === id)) throw new Error('Use a fresh run for a retry; preserve history');
      const result = await executeSuite(root, plan, id, directory, values['artifact-dir']);
      run.suites.push(result);
      await writeNewJson(`${runPath}.${Date.now()}.previous.json`, await readJson(runPath));
      await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
      if (result.status !== 'passed') process.exitCode = 1;
    } else if (command === 'ready' || command === 'release-ready') {
      if (command === 'release-ready' && plan.purpose !== 'release') throw new Error('Feature run cannot release an artifact');
      const status = await inspectRun(root, plan, run, directory, { ...options, ready: true });
      if (values.receipt) {
        if (plan.purpose !== 'release') throw new Error('Receipt requires release acceptance');
        await writeNewJson(resolve(values.receipt), { schemaVersion: 1, status: 'passed', createdAt: new Date().toISOString(),
          artifact: plan.artifact, planHash: hashPlan(plan), runHash: sha256(await readFile(runPath)),
          catalogHash: plan.catalogHash, sourceHash: plan.sourceHash,
          expected: plan.expected.length, passed: run.checks.length, suites: plan.suites.length,
          environments: plan.environments.map((e) => ({ id: e.id, profile: e.profile, build: e.build, backend: e.backend })) });
      }
      console.log(JSON.stringify(status, null, 2));
    } else if (command === 'report') {
      await inspectRun(root, plan, run, directory, options);
      await exportReport(plan, run, directory, resolve(required('out')), (await readCatalog(root)).cases);
    } else throw new Error(`Unknown command: ${command}`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

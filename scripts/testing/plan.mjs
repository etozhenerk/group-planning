import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { safePath, sha256, readJson } from '../design/files.mjs';
import { readCatalog, sourceHash } from './catalog.mjs';
import { validate } from './schema.mjs';

export const hashPlan = (plan) => sha256(JSON.stringify(plan));
export const readArtifact = async (directory) => {
  const root = resolve(directory);
  const manifest = await readJson(await safePath(root, 'manifest.json'));
  if (!manifest.component || !manifest.version || !Array.isArray(manifest.artifacts) || !manifest.artifacts.length)
    throw new Error('Invalid release artifact manifest');
  const files = [];
  for (const entry of manifest.artifacts) {
    const path = entry.name;
    if (files.some((f) => f.path === path)) throw new Error('Duplicate artifact file');
    const bytes = await readFile(await safePath(root, path));
    const actual = sha256(bytes);
    if (bytes.length !== entry.size) throw new Error(`Artifact size mismatch: ${path}`);
    if (actual !== entry.sha256) throw new Error(`Artifact checksum mismatch: ${path}`);
    files.push({ path, sha256: actual });
  }
  return { component: manifest.component, version: manifest.version,
    manifestHash: sha256(await readFile(await safePath(root, 'manifest.json'))), files };
};
const checkReleaseBinding = (purpose, component, environments, artifact) => {
  if (purpose !== 'release') return;
  if (!artifact || artifact.component !== component) throw new Error('Release needs matching artifact');
  for (const env of environments) {
    const identity = component === 'backend' ? env.backend : env.build;
    if (identity !== artifact.manifestHash) throw new Error(`Environment is not bound to candidate: ${env.id}`);
  }
};
const checkCandidateSources = async (root, directory, config, environments) => {
  const manifest = await readJson(await safePath(resolve(directory), 'manifest.json'));
  if (!/^[a-f0-9]{40}$/.test(manifest.commit ?? '')) throw new Error('Candidate has no source commit');
  const paths = [...new Set(environments.flatMap((e) => config.inputs[e.platform]))];
  const git = promisify(execFile);
  const diff = await git('git', ['diff', '--name-only', manifest.commit, '--', ...paths], { cwd: root });
  const untracked = await git('git', ['ls-files', '--others', '--exclude-standard', '--', ...paths], { cwd: root });
  if (diff.stdout.trim() || untracked.stdout.trim()) throw new Error('Candidate source differs from tested checkout');
};
export const selectScope = (catalog, purpose, component, selectedCases, environments) => {
  const { config, cases } = catalog;
  const profiles = config.releaseProfiles[component];
  if (!profiles?.length) throw new Error(`Unknown release component: ${component}`);
  const envIds = new Set();
  for (const env of environments) {
    validate('environment', env);
    if (envIds.has(env.id)) throw new Error(`Duplicate environment: ${env.id}`);
    envIds.add(env.id);
    const profile = config.profiles[env.profile];
    if (!profile || profile.platform !== env.platform) throw new Error(`Invalid environment profile: ${env.id}`);
  }
  if (purpose === 'release' && profiles.some((p) => !environments.some((e) => e.profile === p)))
    throw new Error('Missing required release environment');
  const applicable = cases.filter((c) => c.lifecycle === 'active' && c.platforms.some((p) => environments.some((e) => e.platform === p)));
  const selected = purpose === 'release' ? applicable : applicable.filter((c) => selectedCases.includes(c.id));
  if (!selected.length || (purpose === 'feature' && selectedCases.some((id) => !selected.some((c) => c.id === id))))
    throw new Error('Empty/unknown/inapplicable case selection');
  const expected = [];
  for (const c of selected) for (const env of environments.filter((e) => c.platforms.includes(e.platform))) {
    const coverage = c.automation[env.platform];
    const automated = coverage.status === 'automated' && coverage.health === 'stable';
    const manualRequired = (purpose === 'feature' && c.level === 'e2e') ||
      (purpose === 'release' && coverage.tests.some((t) => config.runners[t.runner].scope !== 'artifact'));
    const modes = automated ? (manualRequired ? ['automated', 'manual'] : ['automated']) : ['manual'];
    for (const mode of modes) expected.push({ id: `${c.id}/${env.id}/${mode}`, caseId: c.id, environment: env.id, mode });
  }
  const applicablePlatforms = [...new Set(environments.map((e) => e.platform))];
  const suites = Object.entries(config.runners).filter(([, r]) =>
    r.required && r.platforms.some((p) => applicablePlatforms.includes(p))).map(([id]) => id).sort();
  return { selectedCases: selected.map((c) => c.id).sort(), expected, suites };
};
export const makePlan = async (root, options) => {
  const catalog = await readCatalog(root);
  if (catalog.gaps.length) throw new Error(`Catalog needs review: ${catalog.gaps.join('; ')}`);
  const { purpose, component, environments, implementer, id, selectedCases = [] } = options;
  const scope = selectScope(catalog, purpose, component, selectedCases, environments);
  const artifact = options.artifactDirectory ? await readArtifact(options.artifactDirectory) : null;
  checkReleaseBinding(purpose, component, environments, artifact);
  if (purpose === 'release') await checkCandidateSources(root, options.artifactDirectory, catalog.config, environments);
  const plan = { schemaVersion: 1, id, purpose, component, createdAt: new Date().toISOString(), implementer,
    catalogHash: catalog.hash, sourceHash: await sourceHash(root, catalog.config, environments.map((e) => e.platform)),
    ...scope, environments, artifact };
  return validate('plan', plan);
};
export const currentPlan = async (root, plan, artifactDirectory) => {
  validate('plan', plan);
  const catalog = await readCatalog(root);
  if (catalog.gaps.length || plan.catalogHash !== catalog.hash) throw new Error('Stale catalog or unresolved coverage');
  if (plan.sourceHash !== await sourceHash(root, catalog.config, plan.environments.map((e) => e.platform))) throw new Error('Stale implementation inputs');
  const expected = selectScope(catalog, plan.purpose, plan.component, plan.selectedCases, plan.environments);
  for (const key of ['selectedCases', 'expected', 'suites'])
    if (JSON.stringify(expected[key]) !== JSON.stringify(plan[key])) throw new Error(`Incomplete/tampered plan: ${key}`);
  if (plan.purpose === 'release') {
    checkReleaseBinding(plan.purpose, plan.component, plan.environments, plan.artifact);
    if (!artifactDirectory) throw new Error('Release readiness needs artifact directory');
    if (JSON.stringify(await readArtifact(artifactDirectory)) !== JSON.stringify(plan.artifact)) throw new Error('Stale release artifact');
    await checkCandidateSources(root, artifactDirectory, catalog.config, plan.environments);
  }
  return catalog;
};

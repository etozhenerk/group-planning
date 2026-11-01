import { readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { readJson, safePath } from '../design/files.mjs';
import { validate } from './schema.mjs';
import { inspectRun } from './results.mjs';

export const validateTaskMappings = async (root, manifest, ids) => {
  validate('manifest', manifest);
  if (!ids.length || new Set(ids).size !== ids.length) throw new Error('Invalid task scope');
  const body = await readFile(await safePath(root, `openspec/changes/${manifest.change}/tasks.md`), 'utf8');
  const declared = new Set([...body.matchAll(/^- \[[ xX]\]\s+(\d+\.\d+)\s/gm)].map((m) => m[1]));
  const classified = [...manifest.tasks, ...manifest.exemptTasks].map((t) => t.id);
  if (new Set(classified).size !== classified.length || classified.some((id) => !declared.has(id)))
    throw new Error('Unknown or duplicate task mapping');
  if ([...declared].some((id) => !classified.includes(id))) throw new Error('Unclassified task');
  for (const task of manifest.tasks) {
    const platforms = (task.acceptance ?? []).map((a) => a.platform);
    if (new Set(platforms).size !== platforms.length || platforms.some((p) => !task.platforms.includes(p)))
      throw new Error(`Unknown or duplicate acceptance platform: ${task.id}`);
  }
  for (const id of ids)
    if (!manifest.tasks.some((t) => t.id === id)) throw new Error(`Unknown or exempt task: ${id}`);
};

const mappedChecks = (plan, tasks) => {
  if (plan.purpose !== 'feature') throw new Error('Task scope requires feature plan');
  const required = new Set();
  for (const task of tasks) for (const caseId of task.cases) for (const platform of task.platforms) {
    const environments = plan.environments.filter((e) => e.platform === platform);
    if (!plan.selectedCases.includes(caseId) || !environments.length)
      throw new Error(`Incomplete task acceptance scope: ${task.id}/${caseId}/${platform}`);
    for (const environment of environments) {
      const checks = plan.expected.filter((e) => e.caseId === caseId && e.environment === environment.id);
      if (!checks.length) throw new Error(`Missing task case/platform: ${task.id}/${caseId}/${platform}`);
      for (const check of checks) required.add(check.id);
    }
  }
  return [...required].sort();
};

const checkPartialPhase = (manifest) => {
  if (!['checkpoint', 'paused'].includes(manifest.phase))
    throw new Error('Task scope requires checkpoint or paused phase; review/complete require full acceptance');
};

// Scope is derived from every mapped case/environment, never caller-picked IDs.
export const taskChecks = async (root, plan, manifest, ids) => {
  await validateTaskMappings(root, manifest, ids);
  checkPartialPhase(manifest);
  return mappedChecks(plan, manifest.tasks.filter((t) => ids.includes(t.id)));
};

// A task may use independent current plans on different platforms.
export const taskGroups = async (root, manifest, ids, { full = false } = {}) => {
  await validateTaskMappings(root, manifest, ids);
  if (full) {
    if (ids.length !== manifest.tasks.length || manifest.tasks.some((t) => !ids.includes(t.id)))
      throw new Error('Full task manifest scope required');
  } else checkPartialPhase(manifest);
  const groups = new Map();
  for (const task of manifest.tasks.filter((t) => ids.includes(t.id))) for (const platform of task.platforms) {
    const reference = task.acceptance?.find((a) => a.platform === platform) ?? manifest;
    const key = JSON.stringify([reference.plan, reference.run]);
    if (!groups.has(key)) groups.set(key, { planPath: reference.plan, runPath: reference.run, tasks: [] });
    const group = groups.get(key);
    const existing = group.tasks.find((t) => t.id === task.id);
    if (existing) existing.platforms.push(platform);
    else group.tasks.push({ ...task, platforms: [platform] });
  }
  const result = [];
  for (const group of groups.values()) {
    const plan = await readJson(await safePath(root, group.planPath));
    const run = await readJson(await safePath(root, group.runPath));
    result.push({ ...group, plan, run, requiredChecks: mappedChecks(plan, group.tasks) });
  }
  return result;
};

export const inspectTasks = async (root, manifest, ids, options = {}) => {
  const groups = await taskGroups(root, manifest, ids, options);
  const runs = [];
  for (const group of groups) {
    const status = await inspectRun(root, group.plan, group.run,
      dirname(await safePath(root, group.runPath)), {
        ready: true, requiredChecks: options.full ? undefined : group.requiredChecks,
      });
    runs.push({ plan: group.planPath, run: group.runPath, ...status });
  }
  return { ready: true, scope: 'tasks', tasks: ids,
    wholeReady: ids.length === manifest.tasks.length && runs.every((r) => r.wholeReady ?? r.ready), runs };
};

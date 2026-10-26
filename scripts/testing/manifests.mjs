import { readFile, readdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { safePath, readJson } from '../design/files.mjs';
import { validate } from './schema.mjs';
import { inspectRun } from './results.mjs';

export const checkManifests = async (root, config) => {
  const declared = new Set([...config.legacyChanges, ...config.nonProductChanges]);
  for (const path of config.manifests) {
    const manifest = validate('manifest', await readJson(await safePath(root, path)));
    if (declared.has(manifest.change)) throw new Error(`Duplicate change disposition: ${manifest.change}`);
    declared.add(manifest.change);
    const taskFile = `openspec/changes/${manifest.change}/tasks.md`;
    const tasks = await readFile(await safePath(root, taskFile), 'utf8');
    const states = new Map([...tasks.matchAll(/^- \[([ xX])\]\s+(\d+\.\d+)\s/gm)].map((m) => [m[2], m[1].toLowerCase() === 'x']));
    const mapped = [...manifest.tasks, ...manifest.exemptTasks].map((t) => t.id);
    if (new Set(mapped).size !== mapped.length || mapped.some((id) => !states.has(id))) throw new Error(`Unknown/duplicate task in ${path}`);
    if ([...states.keys()].some((id) => !mapped.includes(id))) throw new Error(`Unclassified task in ${path}`);
    const complete = manifest.phase === 'complete' || manifest.tasks.some((t) => states.get(t.id));
    if (complete || manifest.phase === 'review') {
      const planPath = await safePath(root, manifest.plan);
      const runPath = await safePath(root, manifest.run);
      const plan = await readJson(planPath);
      if (plan.purpose !== 'feature') throw new Error('Task acceptance requires feature plan');
      for (const task of manifest.tasks.filter((t) => states.get(t.id) || ['review', 'complete'].includes(manifest.phase))) {
        if (task.cases.some((id) => !plan.selectedCases.includes(id)) || task.platforms.some((p) => !plan.environments.some((e) => e.platform === p)))
          throw new Error(`Incomplete task acceptance scope: ${task.id}`);
        for (const id of task.cases) for (const platform of task.platforms) {
          const envs = plan.environments.filter((e) => e.platform === platform);
          if (!envs.some((env) => plan.expected.some((e) => e.caseId === id && e.environment === env.id)))
            throw new Error(`Missing task case/platform: ${task.id}/${id}/${platform}`);
        }
      }
      await inspectRun(root, plan, await readJson(runPath), dirname(runPath), { ready: true });
    }
  }
  const changes = await readdir(await safePath(root, 'openspec/changes'), { withFileTypes: true });
  for (const entry of changes) {
    if (entry.isDirectory() && entry.name !== 'archive' && !declared.has(entry.name))
      throw new Error(`Declare testing manifest or explicit non-product scope: ${entry.name}`);
  }
};

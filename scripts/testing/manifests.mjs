import { readFile, readdir } from 'node:fs/promises';
import { safePath, readJson } from '../design/files.mjs';
import { validate } from './schema.mjs';
import { inspectTasks, validateTaskMappings } from './task-scope.mjs';

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
    await validateTaskMappings(root, manifest, manifest.tasks.map((t) => t.id));
    const complete = manifest.phase === 'complete' || manifest.tasks.some((t) => states.get(t.id));
    if (complete || manifest.phase === 'review') {
      const full = ['review', 'complete'].includes(manifest.phase);
      const ids = manifest.tasks.filter((t) => full || states.get(t.id)).map((t) => t.id);
      await inspectTasks(root, manifest, ids, { full });
    }
  }
  const changes = await readdir(await safePath(root, 'openspec/changes'), { withFileTypes: true });
  for (const entry of changes) {
    if (entry.isDirectory() && entry.name !== 'archive' && !declared.has(entry.name))
      throw new Error(`Declare testing manifest or explicit non-product scope: ${entry.name}`);
  }
};

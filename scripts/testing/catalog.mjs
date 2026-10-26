import { readFile, readdir } from 'node:fs/promises';
import { parse } from 'yaml';
import { safePath, sha256, treeFiles, digestFiles, readJson } from '../design/files.mjs';
import { validate } from './schema.mjs';

export const scenarioBlocks = (body) => {
  const result = [];
  let requirement;
  for (const section of body.split(/(?=^### Requirement: )/m)) {
    const match = section.match(/^### Requirement: (.+)$/m);
    if (!match) continue;
    requirement = match[1].trim();
    const rule = section.split(/^#### Scenario:/m)[0].trim();
    for (const block of section.split(/(?=^#### Scenario: )/m).slice(1)) {
      const scenario = block.match(/^#### Scenario: (.+)$/m)[1].trim();
      const content = block.split(/^## /m)[0].trim();
      result.push({ requirement, scenario, content, rule, sha256: sha256(`${rule}\n${content}`) });
    }
  }
  return result;
};
export const sourceKey = (s) => `${s.path}#${s.requirement}#${s.scenario}`;
export const readCatalog = async (root) => {
  const config = validate('config', await readJson(await safePath(root, 'testing/config.json')));
  for (const profiles of Object.values(config.releaseProfiles))
    if (profiles.some((p) => !config.profiles[p])) throw new Error('Unknown release profile');
  if (new Set([...config.legacyChanges, ...config.nonProductChanges]).size !== config.legacyChanges.length + config.nonProductChanges.length)
    throw new Error('Duplicate change disposition');
  const cases = [];
  const caseDir = await safePath(root, 'testing/cases');
  for (const name of (await readdir(caseDir)).sort()) {
    if (!name.endsWith('.yaml')) continue;
    const parsed = parse(await readFile(await safePath(root, `testing/cases/${name}`), 'utf8'), { uniqueKeys: true });
    if (!Array.isArray(parsed)) throw new Error(`Expected case array: ${name}`);
    cases.push(...parsed.map((c) => validate('case', c)));
  }
  if (!cases.length) throw new Error('Empty test catalog');
  const seen = new Set();
  const sources = new Map();
  const gaps = [];
  const specFiles = (await treeFiles(root, ['openspec'])).filter((p) => /\/specs\/[^/]+\/spec\.md$/.test(p) && !p.includes('/archive/'));
  const declaredSources = [...config.sources, ...config.excludedSources.map((s) => s.path)];
  if (new Set(declaredSources).size !== declaredSources.length) throw new Error('Duplicate source disposition');
  for (const path of specFiles) if (!declaredSources.includes(path)) gaps.push(`Unclassified specification: ${path}`);
  for (const path of declaredSources) if (!specFiles.includes(path)) gaps.push(`Source moved/removed: ${path}`);
  for (const path of config.sources) {
    for (const s of scenarioBlocks(await readFile(await safePath(root, path), 'utf8'))) {
      const source = { path, ...s };
      const key = sourceKey(source);
      if (sources.has(key)) throw new Error(`Duplicate source: ${key}`);
      sources.set(key, source);
    }
  }
  for (const c of cases) {
    if (seen.has(c.id)) throw new Error(`Duplicate case: ${c.id}`);
    seen.add(c.id);
    const source = sources.get(sourceKey(c.source));
    if (!source) throw new Error(`Unknown source: ${c.id}`);
    if (source.sha256 !== c.source.sha256) gaps.push(`${c.id}: source changed`);
    if (JSON.stringify(Object.keys(c.automation).sort()) !== JSON.stringify([...c.platforms].sort()))
      throw new Error(`Automation platforms mismatch: ${c.id}`);
    for (const [platform, coverage] of Object.entries(c.automation)) {
      if (coverage.status === 'automated' && (!coverage.tests.length || coverage.tests.some((t) => t.level !== c.level)))
        throw new Error(`Unproven automation level: ${c.id}/${platform}`);
      if (coverage.status === 'automated' && coverage.health === 'unknown') throw new Error(`Unknown automation health: ${c.id}`);
      for (const test of coverage.tests) {
        const body = await readFile(await safePath(root, test.path), 'utf8');
        if (!body.includes(test.selector)) throw new Error(`Missing test selector: ${c.id}: ${test.selector}`);
        const runner = config.runners[test.runner];
        if (!runner || !runner.platforms.includes(platform)) throw new Error(`Missing regular runner: ${c.id}`);
      }
    }
  }
  for (const [key] of sources) {
    if (!cases.some((c) => c.lifecycle === 'active' && sourceKey(c.source) === key)) gaps.push(`Uncovered scenario: ${key}`);
  }
  const files = await treeFiles(root, ['testing/cases', 'testing/config.json', ...config.sources]);
  return { config, cases, gaps, hash: await digestFiles(root, files) };
};

export const sourceHash = async (root, config, platforms) => {
  const paths = [...new Set(platforms.flatMap((p) => config.inputs[p] ?? []))];
  if (!paths.length) throw new Error('No implementation inputs');
  return digestFiles(root, await treeFiles(root, paths));
};

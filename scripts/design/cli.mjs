import { readFile, readdir, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { generate, root, outputs } from './generate.mjs';
import { checkLiterals, pruneLiterals } from './literals.mjs';
import { readJson, safePath, sha256 } from './files.mjs';
import { readManifest, reviewStatus } from './review.mjs';

export const registry = async (base = root) => {
  const data = await readJson(`${base}/design-system/registry.json`);
  if (
    !Array.isArray(data.manifests) ||
    !Array.isArray(data.legacyChanges) ||
    !Array.isArray(data.nonUiChanges)
  )
    throw new Error('Invalid design registry');
  const declared = new Set(data.manifests.map((x) => x.split('/')[2]));
  const exceptions = [...data.legacyChanges, ...data.nonUiChanges];
  for (const x of exceptions)
    if (!x.change || !x.reason) throw new Error('Unexplained design registry exception');
  for (const name of await readdir(`${base}/openspec/changes`)) {
    if (name === 'archive') continue;
    try {
      await access(`${base}/openspec/changes/${name}/ux.md`);
    } catch {
      continue;
    }
    if (!declared.has(name) && !exceptions.some((x) => x.change === name))
      throw new Error(`UI change lacks design manifest: ${name}`);
  }
  return data;
};
export const checkAuthority = async (base = root) => {
  const authority = await readJson(`${base}/design-system/authority.json`);
  if (!authority.approval || !authority.sources?.length)
    throw new Error('Design publication lacks approval or sources');
  for (const source of authority.sources) {
    if (sha256(await readFile(await safePath(base, source.path))) !== source.sha256)
      throw new Error(`Approved source changed: ${source.path}; publish the new approved revision`);
  }
};
export const run = async (command, { manifest, platform, report } = {}, base = root) => {
  if (platform && !['web', 'ios', 'android'].includes(platform))
    throw new Error('Unknown platform');
  if (command === 'prune') {
    await pruneLiterals(base, Object.keys(await outputs(base)));
    return { status: 'removed resolved legacy entries; no additions allowed' };
  }
  if (command === 'inspect-report') {
    if (!manifest || !report) throw new Error('--manifest and --report are required');
    const result = await reviewStatus(base, manifest, { reportFile: resolve(report) });
    return {
      structure: 'valid',
      currentAcceptance: result.valid ?? false,
      note: 'This inspection does not grant acceptance.',
    };
  }
  if (command === 'context') {
    if (!manifest) throw new Error('--manifest is required');
    const context = await readManifest(base, manifest);
    return {
      manifest,
      inputHash: context.inputHash,
      expected: context.expected,
      report: context.manifest.report,
    };
  }
  if (!['check', 'ready'].includes(command)) throw new Error('Expected check, ready or context');
  await generate(true, base);
  await checkAuthority(base);
  const data = await registry(base);
  await checkLiterals(base, Object.keys(await outputs(base)));
  const paths = manifest ? [manifest] : data.manifests;
  if (manifest && !data.manifests.includes(manifest)) throw new Error('Manifest is not registered');
  for (const path of paths)
    await reviewStatus(base, path, { ready: command === 'ready', platform });
  return {
    status: 'ok',
    command,
    manifests: paths.length,
    note:
      command === 'check'
        ? 'Structure checked; checkpoint/paused is not UI acceptance.'
        : 'Requested review coverage passed.',
  };
};
if (process.argv[1] && resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  const args = process.argv.slice(2);
  const option = (name) => {
    const i = args.indexOf(name);
    return i < 0 ? undefined : args[i + 1];
  };
  try {
    console.log(
      JSON.stringify(
        await run(args[0], {
          manifest: option('--manifest'),
          platform: option('--platform'),
          report: option('--report'),
        }),
        null,
        2,
      ),
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

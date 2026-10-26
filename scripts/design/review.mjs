import Ajv from 'ajv';
import { posix } from 'node:path';
import { readFile } from 'node:fs/promises';
import { manifestSchema, reportSchema } from './review-schema.mjs';
import { safePath, treeFiles, digestFiles, readJson, sha256 } from './files.mjs';

const ajv = new Ajv({ allErrors: true, strict: true });
const validateManifest = ajv.compile(manifestSchema);
const validateReport = ajv.compile(reportSchema);
const validate = (schema, value, label) => {
  if (!schema(value)) throw new Error(`${label}: ${ajv.errorsText(schema.errors)}`);
};
const key = (c) => `${c.screen}/${c.platform}/${c.state}`;
export const readManifest = async (root, path) => {
  const manifest = await readJson(await safePath(root, path));
  validate(validateManifest, manifest, path);
  const version = await readJson(`${root}/design-system/version.json`);
  if (manifest.designVersion !== version.version)
    throw new Error('Manifest design version differs from current publication');
  const ids = manifest.screens.map((s) => s.id);
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate screen IDs');
  const expected = manifest.screens.flatMap((s) =>
    s.platforms.flatMap((p) => s.states.map((state) => `${s.id}/${p}/${state}`)),
  );
  const shared = [
    'design-system/tokens.json',
    'design-system/version.json',
    'design-system/authority.json',
    'docs/design',
    'scripts/design',
  ];
  const paths = [
    ...shared,
    ...manifest.screens.flatMap((s) => [...s.inputs, ...s.references, ...s.contracts]),
  ];
  const files = await treeFiles(root, paths);
  if (files.includes(manifest.report) || files.includes(path))
    throw new Error(
      'Review inputs must not include manifest/report directory; use explicit UI inputs',
    );
  const tasksPath = posix.join(posix.dirname(path), 'tasks.md');
  const tasksText = await readFile(await safePath(root, tasksPath), 'utf8');
  const tasks = new Map(
    [...tasksText.matchAll(/^- \[([ xX])\] (\d+(?:\.\d+)+)\s/gm)].map((m) => [
      m[2],
      m[1].toLowerCase() === 'x',
    ]),
  );
  const closedKeys = [];
  for (const screen of manifest.screens) {
    if (Object.keys(screen.tasks).some((p) => !screen.platforms.includes(p)))
      throw new Error('Task mapping contains undeclared platform');
    for (const platform of screen.platforms) {
      const platformRoot = `frontend/${platform}`;
      if (
        !screen.inputs.some(
          (p) =>
            p === platformRoot ||
            p.startsWith(`${platformRoot}/`) ||
            platformRoot.startsWith(`${p}/`),
        )
      )
        throw new Error(`Missing platform inputs: ${platform}`);
      const ids = screen.tasks[platform];
      if (!ids?.length || ids.some((id) => !tasks.has(id)))
        throw new Error(`Missing UI task mapping: ${screen.id}/${platform}`);
      if (ids.some((id) => tasks.get(id)))
        closedKeys.push(...screen.states.map((s) => `${screen.id}/${platform}/${s}`));
    }
  }
  const sourceHash = await digestFiles(root, files);
  // Phase is operational state: switching review -> complete does not change the reviewed UI.
  const { phase, ...contract } = manifest;
  const inputHash = sha256(JSON.stringify({ contract, sourceHash }));
  return { manifest, expected, inputHash, closedKeys };
};
export const reviewStatus = async (root, path, { ready = false, platform, reportFile } = {}) => {
  const context = await readManifest(root, path);
  const { manifest, inputHash } = context;
  if (platform && !manifest.screens.some((s) => s.platforms.includes(platform))) return context;
  const requireAll = ready || manifest.phase === 'complete';
  const requiredKeys = (requireAll ? context.expected : context.closedKeys).filter(
    (x) => !platform || x.split('/')[1] === platform,
  );
  const requirePass = requiredKeys.length > 0;
  let report;
  try {
    report = await readJson(reportFile ?? (await safePath(root, manifest.report)));
  } catch (error) {
    if (error.code === 'ENOENT' && !requirePass) return { ...context, pending: 'No review yet' };
    throw error;
  }
  validate(validateReport, report, manifest.report);
  if (report.manifest !== path) throw new Error('Report belongs to another manifest');
  if (report.reviewer === manifest.implementer) throw new Error('Review must be independent');
  if (!Number.isFinite(Date.parse(report.reviewedAt))) throw new Error('Invalid review date');
  const expected = requirePass
    ? requiredKeys
    : context.expected.filter((x) => !platform || x.split('/')[1] === platform);
  const found = report.checks.map(key);
  if (new Set(found).size !== found.length || found.some((x) => !context.expected.includes(x)))
    throw new Error('Unexpected or duplicate review checks');
  let valid = inputHash === report.inputHash && expected.every((x) => found.includes(x));
  for (const check of report.checks) {
    for (const evidence of check.evidence) {
      const bytes = await readFile(await safePath(root, evidence.path));
      if (sha256(bytes) !== evidence.sha256) throw new Error(`Evidence changed: ${evidence.path}`);
      if (evidence.kind !== 'interaction') {
        const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
        const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
        const webp =
          bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
        if (!/\.(png|jpe?g|webp)$/i.test(evidence.path) || (!png && !jpeg && !webp))
          throw new Error('Screenshot evidence must be an image');
      }
    }
    if (check.status === 'pass') {
      if (
        !check.capture ||
        check.capture.sourceHash !== report.inputHash ||
        !Number.isFinite(Date.parse(check.capture.capturedAt))
      )
        throw new Error(`Pass lacks current capture provenance: ${key(check)}`);
      const kinds = new Set(check.evidence.map((e) => e.kind));
      if (!['actual', 'reference', 'interaction'].every((k) => kinds.has(k)))
        throw new Error(`Pass lacks screenshots/interactions: ${key(check)}`);
      if (report.mode !== 'live') throw new Error('Historical evidence cannot pass current UI');
    }
    if (expected.includes(key(check)) && check.status !== 'pass') valid = false;
  }
  if (requirePass && !valid)
    throw new Error(`Design review is missing, stale or not passed: ${manifest.id}`);
  return { ...context, report, valid };
};

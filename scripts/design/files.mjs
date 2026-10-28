import { readFile, realpath, readdir, stat } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';

export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
export const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const isPrivateEnvironment = (name) =>
  (name === '.env' || name.startsWith('.env.')) && !name.endsWith('.example');
export const safePath = async (root, path) => {
  if (
    typeof path !== 'string' ||
    isAbsolute(path) ||
    !path ||
    path.split('/').some((p) => p === '..' || p === '.')
  )
    throw new Error(`Unsafe path: ${path}`);
  const base = await realpath(root);
  const target = resolve(base, path);
  const actual = await realpath(target);
  if (actual !== target || relative(base, actual).startsWith('..'))
    throw new Error(`Symlink/outside root: ${path}`);
  return target;
};
export const treeFiles = async (root, paths) => {
  const result = new Set();
  const walk = async (path) => {
    const absolute = await safePath(root, path);
    const info = await stat(absolute);
    if (info.isDirectory()) {
      for (const entry of (await readdir(absolute)).sort()) {
        // Record runtime configuration separately; never fingerprint private dotenv values.
        // Keep committed example configurations as implementation inputs.
        if (
          isPrivateEnvironment(entry) ||
          entry === 'local.properties' ||
          (path === 'frontend/ios/Config' && entry === 'Local.xcconfig')
        )
          continue;
        if (
          [
            'node_modules',
            '.build',
            'build',
            '.git',
            'dist',
            '.gradle',
            '.kotlin',
            '.idea',
            '.vscode',
            '.DS_Store',
            'xcuserdata',
            'test-results',
            'playwright-report',
          ].includes(entry)
        )
          continue;
        await walk(`${path}/${entry}`);
      }
    } else if (info.isFile()) result.add(path);
  };
  // Each screen lists its inputs; traverse shared roots once without omitting any file.
  for (const path of new Set(paths)) await walk(path);
  return [...result].sort();
};
export const digestFiles = async (root, files) => {
  const entries = [];
  for (const path of files)
    entries.push([path, sha256(await readFile(await safePath(root, path)))]);
  return sha256(JSON.stringify(entries));
};

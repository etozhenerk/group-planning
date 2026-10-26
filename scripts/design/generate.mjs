import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTokens } from './tokens.mjs';
import { renderTokens } from './formats.mjs';
import { format } from 'prettier';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const outputs = async (base = root) => {
  const { version } = JSON.parse(await readFile(`${base}/design-system/version.json`, 'utf8'));
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Design version must be semver');
  const files = renderTokens(await loadTokens(base), version);
  for (const path of Object.keys(files)) {
    if (path.endsWith('.ts') || path.endsWith('.css'))
      files[path] = await format(files[path], {
        parser: path.endsWith('.ts') ? 'typescript' : 'css',
        singleQuote: true,
        printWidth: 90,
      });
    // Keep generated Swift deterministic on Linux too: wrap long color initializers ourselves.
    if (path.endsWith('.swift'))
      files[path] = files[path].replace(
        /(    static let \w+) = Color\((.+)\)/g,
        (_, name, args) =>
          `${name} = Color(\n        ${args.split(', ').join(',\n        ')}\n    )`,
      );
  }
  return files;
};
export const generate = async (check = false, base = root) => {
  const files = await outputs(base);
  for (const [path, content] of Object.entries(files)) {
    const target = resolve(base, path);
    if (check) {
      let existing;
      try {
        existing = await readFile(target, 'utf8');
      } catch {
        /* diagnosed below */
      }
      if (existing !== content)
        throw new Error(`Generated file differs: ${path}; run npm run design:generate`);
    } else {
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, content);
    }
  }
  return Object.keys(files);
};
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    console.log((await generate(process.argv.includes('--check'))).join('\n'));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

import { readFile, writeFile } from 'node:fs/promises';
import { treeFiles, sha256, readJson } from './files.mjs';

export const uiRoots = [
  'frontend/web/src',
  'frontend/ios/Somewhere',
  'frontend/android/app/src/main',
];
const hasLiteral = (line, path) => {
  if (/^\s*(\/\/|\*|\/\*|import\b)/.test(line)) return false;
  if (/\.css$/.test(path))
    return /#[a-f\d]{3,8}\b|\b(?:rgb|hsl)a?\s*\(|\b\d+(?:\.\d+)?(?:px|rem|em|ms)\b|\b\d*\.\d+s\b/i.test(
      line,
    );
  if (/\.colorset\/Contents\.json$/.test(path)) return /"(?:red|green|blue|alpha)"\s*:/.test(line);
  if (/\.swift$/.test(path))
    return /Color\(\s*(?:designHex:|red:|\.sRGB)|\.(?:padding|cornerRadius|spacing)\(\s*\d|(?:size|width|height|spacing|radius):\s*\d|\.(?:foregroundStyle|foregroundColor|tint|background)\(\.(?:white|black|red|blue|green|yellow|orange|purple|gray)/.test(
      line,
    );
  if (/\.kt$/.test(path))
    return /\bColor\.(?:Red|Blue|Green|Yellow|White|Black|Gray)|\bColor\(\s*(?:0x|\d)|\b\d+(?:\.\d+)?\.(?:dp|sp)\b/.test(
      line,
    );
  if (/\.tsx?$/.test(path))
    return /#[a-f\d]{3,8}\b|\b(?:rgb|hsl)a?\s*\(|\b\d+(?:\.\d+)?(?:px|rem|em)\b/i.test(line);
  if (/\.xml$/.test(path)) return /#[a-f\d]{3,8}\b|\b\d+(?:\.\d+)?(?:dp|sp)\b/i.test(line);
  return false;
};
export const collectLiterals = async (root, generated = []) => {
  const findings = [];
  for (const path of await treeFiles(root, uiRoots)) {
    if (generated.includes(path) || /(?:\.test\.|\.png$|\.jpg$|\.webp$|\.svg$)/.test(path))
      continue;
    if (!/\.(css|tsx?|swift|kt|xml)$/.test(path) && !/\.colorset\/Contents\.json$/.test(path))
      continue;
    const lines = (await readFile(`${root}/${path}`, 'utf8')).split('\n');
    lines.forEach((line, i) => {
      if (hasLiteral(line, path))
        findings.push({
          path,
          line: i + 1,
          text: line.trim(),
          key: sha256(`${path}\n${line.trim()}`),
        });
    });
  }
  return findings;
};
export const checkLiterals = async (root, generated) => {
  const baseline = await readJson(`${root}/design-system/legacy-literals.json`);
  const available = new Map(baseline.entries.map((x) => [x.key, x.count]));
  const failures = [];
  for (const item of await collectLiterals(root, generated)) {
    const count = available.get(item.key) ?? 0;
    if (count > 0) available.set(item.key, count - 1);
    else failures.push(`${item.path}:${item.line}: ${item.text}`);
  }
  if (failures.length)
    throw new Error(
      `New UI literals; use a published token (design-system-publish):\n${failures.join('\n')}`,
    );
  if ([...available.values()].some((count) => count > 0)) {
    throw new Error('Resolved legacy literals remain in the inventory; run npm run design:prune');
  }
};
export { hasLiteral };

export const pruneLiterals = async (root, generated) => {
  const path = `${root}/design-system/legacy-literals.json`;
  const baseline = await readJson(path);
  const counts = new Map();
  for (const item of await collectLiterals(root, generated))
    counts.set(item.key, (counts.get(item.key) ?? 0) + 1);
  baseline.entries = baseline.entries.flatMap((item) => {
    const count = Math.min(item.count, counts.get(item.key) ?? 0);
    return count ? [{ ...item, count }] : [];
  });
  await writeFile(path, JSON.stringify(baseline, null, 2) + '\n');
};

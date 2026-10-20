import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';

const fix = process.argv.includes('--fix');
const failures: string[] = [];

const files = (directory: string): string[] => {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((item) => {
    const name = path.join(directory, item.name);

    return item.isDirectory() ? files(name) : name.endsWith('.css') ? [name] : [];
  });
};

for (const file of files('src')) {
  const source = fs.readFileSync(file, 'utf8');
  const root = postcss.parse(source, { from: file });

  root.walk((node) => {
    if ((node.type !== 'rule' && node.type !== 'atrule') || !node.prev()) {
      return;
    }

    const before = node.raws.before ?? '';

    if (/\n[ \t]*\n/.test(before)) {
      return;
    }

    if (fix) {
      node.raws.before = `\n\n${before.match(/[ \t]*$/)?.[0] ?? ''}`;
    } else {
      failures.push(
        `${file}:${node.source?.start?.line ?? 1}: separate CSS blocks with an empty line`,
      );
    }
  });

  if (fix && root.toString() !== source) {
    fs.writeFileSync(file, root.toString());
  }
}

if (failures.length) {
  process.stderr.write(`${failures.join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('CSS block spacing: OK\n');
}

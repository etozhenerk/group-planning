import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { checkComponentDirectories, checkComponentStyles } from '@tools/check-components';

const temporary: string[] = [];

const component = () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'somewhere-components-'));
  temporary.push(root);
  const directory = path.join(root, 'features/share/ui/Share');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(
    path.join(directory, 'Share.tsx'),
    "import styles from '@/features/share/ui/Share/Share.module.css';\nexport const Share = () => <div className={styles.root} />;",
  );
  fs.writeFileSync(path.join(directory, 'Share.module.css'), '.root { display: grid; }');
  fs.writeFileSync(
    path.join(directory, 'index.ts'),
    "export { Share } from '@/features/share/ui/Share/Share';",
  );

  return { root, directory };
};

afterEach(() => {
  for (const root of temporary.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

describe('component directories', () => {
  it('accepts a named component, its own CSS Module, barrel and private hooks', () => {
    const { root, directory } = component();
    fs.mkdirSync(path.join(directory, 'hooks'));
    fs.writeFileSync(
      path.join(directory, 'hooks/useShare.ts'),
      'export const useShare = () => null;',
    );
    expect(checkComponentDirectories(root)).toEqual([]);
  });

  it.each(['Other.tsx', 'styles.css', 'other.module.css', 'helper.ts'])(
    'rejects an unrelated sibling %s',
    (name) => {
      const { root, directory } = component();
      fs.writeFileSync(
        path.join(directory, name),
        name.endsWith('.css') ? '.root {}' : 'export const Other = () => null;',
      );
      expect(checkComponentDirectories(root).length).toBeGreaterThan(0);
    },
  );

  it('rejects a barrel exporting another component', () => {
    const { root, directory } = component();
    fs.writeFileSync(
      path.join(directory, 'index.ts'),
      "export { Other } from '@/features/share/ui/Other';",
    );
    expect(checkComponentDirectories(root).length).toBeGreaterThan(0);
  });

  it('rejects a mismatched directory, foreign stylesheet and global JSX classes', () => {
    const { root, directory } = component();
    fs.writeFileSync(
      path.join(directory, 'Share.tsx'),
      "import '@/app/styles/base.css'; export const Share = () => <div className='global' />;",
    );
    fs.renameSync(directory, path.join(path.dirname(directory), 'Wrong'));
    const failures = checkComponentDirectories(root).join('\n');
    expect(failures).toContain('directory and component names must match');
    expect(failures).toContain("import only this component's CSS Module");
    expect(failures).toContain('literal global class names');
  });
});

describe('style references', () => {
  it('rejects a missing CSS Module class', () => {
    const { root, directory } = component();
    const file = path.join(directory, 'Share.tsx');
    fs.writeFileSync(
      file,
      fs.readFileSync(file, 'utf8').replace('styles.root', 'styles.missing'),
    );
    expect(checkComponentDirectories(root).join('\n')).toContain(
      'no local class missing',
    );
  });

  it('rejects component classes hidden in a global reset file', () => {
    const { root } = component();
    const styles = path.join(root, 'app/styles');
    fs.mkdirSync(styles, { recursive: true });
    fs.writeFileSync(path.join(styles, 'base.css'), '.share { padding: 24px; }');
    expect(checkComponentDirectories(root).join('\n')).toContain(
      'global styles cannot contain component classes',
    );
  });
});

describe('CSS Module boundaries', () => {
  it('accepts locally scoped vendor overrides and keyframes', () => {
    expect(
      checkComponentStyles(
        'DateInput.module.css',
        '.field :global(.g-text-input) { color: red; } @keyframes enter { from { opacity: 0; } to { opacity: 1; } }',
      ),
    ).toEqual([]);
  });

  it.each([
    'body { color: red; }',
    ':global(.g-text-input) { color: red; }',
    '.root :global(.other-component) {}',
    '@import "other.css";',
  ])('rejects leaking styles: %s', (source) => {
    expect(checkComponentStyles('Share.module.css', source).length).toBeGreaterThan(0);
  });
});

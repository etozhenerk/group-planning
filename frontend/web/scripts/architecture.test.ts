import { describe, expect, it } from 'vitest';
import { analyzeSource } from '@tools/check-architecture';

describe('architecture rules reject invalid code', () => {
  const file = '/src/features/share/ui/Share.tsx';
  it('rejects cross slices, deep imports, relative paths and extra declarations', () => {
    for (const source of [
      "import { X } from '@/features/edit'; export const Share = () => { return null; };",
      "import { X } from '@/entities/meeting/api/get'; export const Share = () => { return null; };",
      "import { X } from './X'; export const Share = () => { return null; };",
      'export function Share() { return null; }',
      'const hidden = 1; export const Share = () => { return null; };',
      'export const Share = () => { return null; }; export const Other = () => { return null; };',
      'export const Share = (value: any) => { return value; };',
      'export const Share = () => { return null; };\n' + '/* content */\n'.repeat(101),
    ]) {
      expect(analyzeSource(file, source).length).toBeGreaterThan(0);
    }
  });
  it('accepts a small component using a lower public API and its own model', () => {
    expect(
      analyzeSource(
        file,
        "import { useShare } from '@/features/share/model/useShare'; import { Meeting } from '@/entities/meeting'; export type ShareProps = { id: string }; export const Share = () => { return null; };",
      ),
    ).toEqual([]);
  });
});

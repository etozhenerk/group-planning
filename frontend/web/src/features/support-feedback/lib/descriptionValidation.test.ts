import { describe, expect, it } from 'vitest';
import {
  descriptionProblem,
  trimDescription,
} from '@/features/support-feedback/lib/descriptionValidation';

describe('support description boundaries', () => {
  it('counts Unicode code points after the same whitespace trim as the API', () => {
    expect(descriptionProblem(`\u0085\u00a0${'🙂'.repeat(9)} \u3000`)).toContain(
      '10 символов',
    );
    expect(descriptionProblem(`\u0085${'🙂'.repeat(10)}\u00a0`)).toBe('');
    expect(descriptionProblem('🙂'.repeat(3000))).toBe('');
    expect(descriptionProblem('🙂'.repeat(3001))).toContain('3000 символов');
  });

  it('preserves meaningful contents and leaves the input untouched', () => {
    const value = '  Первая строка\nВторая строка  ';

    expect(trimDescription(value)).toBe('Первая строка\nВторая строка');
    expect(value).toBe('  Первая строка\nВторая строка  ');
    expect(trimDescription('\ufeffТекст\ufeff')).toBe('\ufeffТекст\ufeff');
  });
});

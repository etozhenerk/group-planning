import { describe, expect, it } from 'vitest';
import { readReturnLocation } from '@/shared/lib/navigation/returnLocation';

describe('return location', () => {
  it('keeps the calendar context through an album without accepting an external target', () => {
    const path = '/meetings?view=calendar&period=past&past=2026-10-01';
    expect(readReturnLocation({ returnTo: path }).path).toBe(path);

    for (const returnTo of [
      'https://example.com',
      '//example.com',
      '/meetings-other',
      'javascript:alert(1)',
    ]) {
      expect(readReturnLocation({ returnTo }).path).toBe('/meetings');
    }
  });

  it('keeps service return context and an explicit safe fallback for a direct album link', () => {
    expect(
      readReturnLocation({ returnTo: '/help', returnState: { returnTo: '/profile' } }),
    ).toEqual({ path: '/help', state: { returnTo: '/profile' } });
    expect(readReturnLocation(null, '/meetings?view=list&period=past').path).toBe(
      '/meetings?view=list&period=past',
    );
  });
});

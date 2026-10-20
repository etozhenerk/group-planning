import { afterEach, expect, it, vi } from 'vitest';
import { emptyDraft } from '@/entities/meeting/model/draft';

afterEach(() => vi.restoreAllMocks());

it('uses the browser IANA timezone for a new draft instead of a fixed city', () => {
  const options = new Intl.DateTimeFormat().resolvedOptions();
  vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
    ...options,
    timeZone: 'Asia/Yekaterinburg',
  });
  expect(emptyDraft().timezone).toBe('Asia/Yekaterinburg');
});

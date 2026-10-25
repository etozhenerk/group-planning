import { describe, expect, it } from 'vitest';
import type { MeetingDraft } from '@/entities/meeting';
import { patchDraft } from '@/features/edit-meeting/model/patchDraft';

const repeatedTime: MeetingDraft = {
  title: 'Встреча',
  description: '',
  place: '',
  localTime: '2026-11-01T01:30',
  timezone: 'America/New_York',
  timeChoice: '',
};

describe('editing a meeting', () => {
  it('leaves the original instant untouched for a description change, even in a repeated hour', () => {
    expect(
      patchDraft({ ...repeatedTime, description: 'Принести игры' }, repeatedTime),
    ).toEqual({
      title: 'Встреча',
      description: 'Принести игры',
    });
  });

  it('requires a DST choice only when the time actually changes', () => {
    expect(() =>
      patchDraft({ ...repeatedTime, localTime: '2026-11-01T01:45' }, repeatedTime),
    ).toThrow('дважды');
    expect(
      patchDraft(
        { ...repeatedTime, localTime: '2026-11-01T01:45', timeChoice: 'later' },
        repeatedTime,
      ).starts_at,
    ).toBe('2026-11-01T01:45:00-05:00');
  });
});

it('distinguishes retained, removed and replaced covers without changing the schedule', () => {
  const image = { media_type: 'image/jpeg' as const, data: 'AQID' };
  expect(patchDraft(repeatedTime, repeatedTime)).not.toHaveProperty('cover');
  expect(patchDraft({ ...repeatedTime, cover: null }, repeatedTime).cover).toBeNull();
  expect(patchDraft({ ...repeatedTime, cover: image }, repeatedTime).cover).toEqual(
    image,
  );
});

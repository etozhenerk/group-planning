import { describe, expect, it } from 'vitest';
import { cardLabels } from '@/entities/meeting/lib/cardLabels';

describe('meeting card weekend', () => {
  it.each([
    ['2026-11-06', false],
    ['2026-11-07', true],
    ['2026-11-08', true],
    ['2026-11-09', false],
  ])(
    'classifies date-only %s independently of localized weekday case',
    (startsOn, weekend) => {
      expect(
        cardLabels({ startsAt: null, startsOn, timezone: 'Pacific/Honolulu' }).weekend,
      ).toBe(weekend);
    },
  );

  it.each([
    ['Pacific/Honolulu', false],
    ['Asia/Tokyo', true],
  ])('uses the meeting timezone %s at a day boundary', (timezone, weekend) => {
    expect(cardLabels({ startsAt: '2026-11-07T00:30:00Z', timezone }).weekend).toBe(
      weekend,
    );
  });

  it('keeps a legacy undated meeting neutral', () => {
    expect(cardLabels({ startsAt: null, startsOn: null, timezone: 'UTC' }).weekend).toBe(
      false,
    );
  });
});

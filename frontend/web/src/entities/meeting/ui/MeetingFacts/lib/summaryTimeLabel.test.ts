import { expect, test } from 'vitest';
import { summaryTimeLabel } from '@/entities/meeting/ui/MeetingFacts/lib/summaryTimeLabel';

test('summary date and time both use the meeting timezone across midnight', () => {
  expect(summaryTimeLabel('2026-10-31T22:00:00Z', 'Europe/Moscow')).toBe(
    '1 ноября · 01:00',
  );
  expect(summaryTimeLabel('2026-10-31T22:00:00Z', 'America/New_York')).toBe(
    '31 октября · 18:00',
  );
});

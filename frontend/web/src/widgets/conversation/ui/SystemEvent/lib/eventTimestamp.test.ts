import { expect, it } from 'vitest';
import { eventTimestamp } from '@/widgets/conversation/ui/SystemEvent/lib/eventTimestamp';

it('labels today and yesterday by local calendar day across midnight and year boundary', () => {
  const now = new Date(2026, 0, 1, 0, 5);
  expect(eventTimestamp(new Date(2026, 0, 1, 0, 1).toISOString(), now)).toBe(
    'Сегодня · 00:01',
  );
  expect(eventTimestamp(new Date(2025, 11, 31, 23, 55).toISOString(), now)).toBe(
    'Вчера · 23:55',
  );
  expect(eventTimestamp(new Date(2025, 11, 30, 9, 30).toISOString(), now)).toBe(
    '30 декабря · 09:30',
  );
});

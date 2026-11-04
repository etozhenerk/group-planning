import { z } from 'zod';
import type { MeetingPeriod } from '@/entities/meeting';

const homeScrollSchema = z.object({
  period: z.enum(['upcoming', 'past']),
  positions: z.object({
    list: z.number().finite().nonnegative(),
    calendar: z.number().finite().nonnegative(),
  }),
});

type HomeScroll = z.infer<typeof homeScrollSchema>;

export const readHomeScroll = (user: string, period: MeetingPeriod): HomeScroll => {
  try {
    const value: unknown = JSON.parse(
      sessionStorage.getItem(`meeting-scroll:${user}`) ?? 'null',
    );

    const parsed = homeScrollSchema.safeParse(value);

    if (parsed.success && parsed.data.period === period) {
      return parsed.data;
    }
  } catch {
    // Scroll restoration is optional when browser storage is unavailable.
  }

  const empty: HomeScroll = { period, positions: { list: 0, calendar: 0 } };
  saveHomeScroll(user, empty);

  return empty;
};

export const saveHomeScroll = (user: string, state: HomeScroll) => {
  try {
    sessionStorage.setItem(`meeting-scroll:${user}`, JSON.stringify(state));
  } catch {
    // A full or unavailable store must not block navigation.
  }
};

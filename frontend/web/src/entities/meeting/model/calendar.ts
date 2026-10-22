import type { MeetingSummary } from '@/entities/meeting/model/types';

export type MeetingPeriod = 'upcoming' | 'past';

export type CalendarFilter = {
  period: MeetingPeriod | 'undated';
  from?: string;
  to?: string;
};

export type CalendarMeeting = MeetingSummary & {
  localDate: string | null;
  period: CalendarFilter['period'];
};

export type CalendarCounts = Record<CalendarFilter['period'], number>;

export type CalendarPage = {
  meetings: CalendarMeeting[];
  nextCursor: string | null;
  asOf: string;
  counts: CalendarCounts;
  days: { date: string; count: number }[];
  nextTransitionAt: string | null;
  refreshAfterSeconds: number;
};

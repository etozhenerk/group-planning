import type { MeetingSummary, PreparationTask } from '@/entities/meeting';
import type { CalendarPage } from '@/entities/meeting';

export const ignoreExampleAction = () => undefined;

export const exampleMeeting: MeetingSummary = {
  id: 'onboarding-boardgame',
  title: 'Настолки у Саши',
  startsAt: '2026-11-07T16:00:00Z',
  startsOn: '2026-11-07',
  timezone: 'Europe/Moscow',
  place: 'У Саши дома',
  coverUrl: null,
  organizerId: 'sasha',
  participantCount: 6,
  participantPreview: [
    { id: 'sasha', display_name: 'Саша' },
    { id: 'lena', display_name: 'Лена' },
    { id: 'misha', display_name: 'Миша' },
  ],
  revision: '1',
  myRsvp: 'going',
  myRsvpRevision: '1',
};

export const exampleCoffee: MeetingSummary = {
  ...exampleMeeting,
  id: 'onboarding-coffee',
  title: 'Кофе в воскресенье',
  startsAt: '2026-11-08T09:00:00Z',
  startsOn: '2026-11-08',
  place: 'Кофейня на углу',
  participantCount: 3,
};

export const exampleCalendar: CalendarPage = {
  meetings: [
    { ...exampleMeeting, localDate: '2026-11-07', period: 'upcoming' },
    { ...exampleCoffee, localDate: '2026-11-08', period: 'upcoming' },
  ],
  days: [
    { date: '2026-11-07', count: 1 },
    { date: '2026-11-08', count: 1 },
  ],
  counts: { upcoming: 2, past: 0, undated: 0 },
  nextCursor: null,
  asOf: '2026-11-03T12:00:00Z',
  nextTransitionAt: null,
  refreshAfterSeconds: 60,
};

export const exampleTask: PreparationTask = {
  id: 'onboarding-task',
  meetingId: exampleMeeting.id,
  title: 'Заказать пиццу',
  author: { id: 'lena', displayName: 'Лена', avatarUrl: null },
  recipient: { id: 'misha', displayName: 'Миша', avatarUrl: null },
  assignee: { id: 'misha', displayName: 'Миша', avatarUrl: null },
  updatedBy: { id: 'misha', displayName: 'Миша', avatarUrl: null },
  state: 'accepted',
  revision: '2',
  createdAt: '2026-11-03T12:00:00Z',
  canAccept: false,
  canDecline: false,
  canCancel: false,
  canComplete: false,
};

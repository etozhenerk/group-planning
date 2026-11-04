import type { SavedInvitation } from '@/entities/meeting'
export const user = { user: { id: 'misha', displayName: 'Миша' }, expiresAt: '2027-01-01T00:00:00Z', csrf: null }
export const invitations: SavedInvitation[] = [
  { path: '/i/dinner', preview: { meetingId: 'dinner', title: 'Ужин в пятницу', description: null, startsAt: '2026-11-06T17:00:00Z', startsOn: '2026-11-06', timezone: 'Europe/Moscow', place: 'Кафе «Соседи»', coverUrl: '/dinner', myRsvp: 'maybe', myRsvpRevision: '1', organizer: { id: 'lena', displayName: 'Лена' } } },
  { path: '/i/boardgame', preview: { meetingId: 'boardgame', title: 'Настолки у Саши', description: null, startsAt: '2026-11-07T16:00:00Z', startsOn: '2026-11-07', timezone: 'Europe/Moscow', place: 'У Саши дома', coverUrl: '/boardgame', myRsvp: 'maybe', myRsvpRevision: '1', organizer: { id: 'sasha', displayName: 'Саша' } } },
  { path: '/i/coffee', preview: { meetingId: 'coffee', title: 'Воскресный кофе', description: null, startsAt: '2026-11-08T09:00:00Z', startsOn: '2026-11-08', timezone: 'Europe/Moscow', place: null, coverUrl: null, myRsvp: 'maybe', myRsvpRevision: '1', organizer: { id: 'dima', displayName: 'Дима' } } },
]

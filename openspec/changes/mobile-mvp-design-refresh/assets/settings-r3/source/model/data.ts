import type { Meeting, Participant } from '@/entities/meeting';
export const meetingSeed: Meeting = {
  id: 'chat-dinner',
  title: 'Ужин в пятницу',
  startsAt: '2026-11-06T17:00:00Z',
  startsOn: '2026-11-06',
  timezone: 'Europe/Moscow',
  place: 'Кафе «Соседи», Покровка, 8',
  coverUrl: '/dinner',
  organizerId: 'lena',
  participantCount: 6,
  revision: '1',
  myRsvp: 'going',
  myRsvpRevision: '1',
  description:
    'Соберёмся после работы: поужинаем и поболтаем. Столик на шестерых уже забронирован.',
  createdAt: '2026-11-03T09:00:00Z',
};
export const peopleSeed: Participant[] = [
  ['lena', 'Лена', 'organizer', 'going'],
  ['misha', 'Миша', 'guest', 'going'],
  ['sasha', 'Саша', 'guest', 'going'],
  ['dima', 'Дима', 'guest', 'going'],
  ['anya', 'Аня', 'guest', 'going'],
  ['olya', 'Оля', 'guest', 'going'],
  ['nikita', 'Никита', 'guest', 'maybe'],
  ['katya', 'Катя', 'guest', 'maybe'],
  ['ira', 'Ира', 'guest', 'not_going'],
].map(([id, displayName, role, answer]) => ({
  user: { id, displayName },
  role,
  answer,
  revision: '1',
})) as Participant[];

export const meetingFor = (scenario: string): Meeting => ({
  ...meetingSeed,
  ...(scenario === 'no-cover' ? { coverUrl: null } : {}),
  ...(scenario === 'no-time' ? { startsAt: null } : {}),
  ...(scenario === 'long'
    ? {
        title: 'Большой вечер настольных игр, пиццы и разговоров до утра',
        description:
          'Соберёмся после работы: поужинаем и поболтаем. Возьмите любимые настолки — выберем на месте, во что сыграть. Если закончите работу позже, можно присоединиться в течение вечера. Столик у окна, ориентир — большая книжная полка.',
      }
    : {}),
  ...(scenario === 'conflict'
    ? {
        title: 'Ужин в субботу',
        startsOn: '2026-11-07',
        startsAt: '2026-11-07T17:00:00Z',
        revision: '2',
      }
    : {}),
  participantCount: scenario === 'many' ? 27 : 6,
});

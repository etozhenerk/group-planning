import type { DatePoll } from '@/entities/meeting';
import { meeting, pollSeed } from '@preview/data';
export const formModes = new Set(['form', 'form-error', 'uncertain', 'validation']);
export const pollFor = (mode: string): DatePoll => {
  const hidden = mode === 'hidden',
    anonymous = mode === 'anonymous',
    closed = ['applied', 'no-majority', 'tie', 'tie-organizer', 'awaiting-time'].includes(
      mode,
    );
  return {
    ...pollSeed,
    settings: { ...pollSeed.settings, hideResults: hidden, anonymous },
    options: pollSeed.options.map((option) => ({
      ...option,
      votes: hidden
        ? null
        : mode === 'majority'
          ? option.id === 'sat'
            ? 3
            : 2
          : mode.startsWith('tie')
            ? 4
            : mode === 'applied'
              ? option.id === 'sat'
                ? 4
                : 1
              : option.votes,
      voters:hidden||anonymous?null:((mode==='majority'||mode.startsWith('tie')||mode==='applied')?Array.from({length:mode.startsWith('tie')?4:mode==='majority'?(option.id==='sat'?3:2):(option.id==='sat'?4:1)},(_,i)=>[{id:'lena',displayName:'Лена'},{id:'sasha',displayName:'Саша'},{id:'dima',displayName:'Дима'},{id:'anya',displayName:'Аня'}][i]):option.voters),
    })),
    state:
      mode === 'applied'
        ? 'applied'
        : mode === 'no-majority'
          ? 'no_majority'
          : mode.startsWith('tie')
            ? 'awaiting_choice'
            : mode === 'awaiting-time'
              ? 'awaiting_time'
              : 'open',
    canVote: !closed,
    canAddOptions: !closed,
    canResolve: mode === 'tie-organizer' || mode === 'awaiting-time',
    leaderOptionIds: mode.startsWith('tie')
      ? ['fri', 'sat']
      : mode === 'awaiting-time'
        ? ['sat']
        : [],
    appliedOptionId: mode === 'applied' ? 'sat' : null,
    closedAt: closed ? '2026-11-05T18:00:00Z' : null,
  };
};
export const detailsFor = (mode: string) =>
  mode === 'applied'
    ? { ...meeting, startsOn: '2026-11-07', startsAt: '2026-11-07T17:00:00Z' }
    : meeting;

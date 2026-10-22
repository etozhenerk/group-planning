import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { emptyDraft } from '@/entities/meeting';
import { readDraft, storeDraft } from '@/features/create-meeting/model/draftStorage';

vi.mock('@/entities/meeting', () => ({
  emptyDraft: () => ({
    title: '',
    description: '',
    localTime: '',
    timezone: 'Europe/Moscow',
    place: '',
    timeChoice: '',
  }),
}));

beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal('sessionStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  });
});

afterEach(() => vi.unstubAllGlobals());

it('prefills a civil date without inventing time or applying a UTC conversion', () => {
  expect(readDraft('sasha', '2028-02-29', 'new').localTime).toBe('2028-02-29T');
});

it('a new calendar entry changes only the date and clears the old DST choice', () => {
  const draft = {
    ...emptyDraft(),
    title: 'Пицца',
    description: 'Настолки',
    place: 'Дома',
    localTime: '2026-10-24T19:30',
    timezone: 'America/New_York',
    timeChoice: 'later' as const,
  };

  storeDraft('sasha', draft, 'old');
  expect(readDraft('sasha', '2026-11-01', 'new')).toEqual({
    ...draft,
    localTime: '2026-11-01T19:30',
    timeChoice: '',
  });
});

it('reload and history return keep edits from the same navigation entry', () => {
  const edited = { ...emptyDraft(), title: 'Пицца', localTime: '2026-10-25T18:30' };
  storeDraft('sasha', edited, 'entry');
  expect(readDraft('sasha', '2026-10-24', 'entry')).toEqual(edited);
  expect(readDraft('lena', '2026-10-24', 'entry').localTime).toBe('2026-10-24T');
});

it('list navigation and invalid URL dates preserve the existing draft', () => {
  const draft = { ...emptyDraft(), localTime: '2026-10-25T18:30' };
  storeDraft('sasha', draft, 'old');

  for (const date of [null, '', '2026-02-30', '2026-10-24T00:00:00Z']) {
    expect(readDraft('sasha', date, 'new')).toEqual(draft);
  }
});

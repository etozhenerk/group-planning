import { describe, expect, it } from 'vitest';
import { reactionPeople } from '@/features/message-reactions/lib/reactionPeople';

const sasha = { id: 'sasha', display_name: 'Саша' };
const lena = { id: 'lena', display_name: 'Лена' };
const reactions = [
  { emoji: '👍', count: 2, mine: true, users: [sasha, lena] },
  { emoji: '🍕', count: 1, mine: true, users: [sasha] },
];

describe('people behind message reactions', () => {
  it('shows each person once in All, retaining every emoji they chose', () => {
    expect(reactionPeople(reactions, '')).toEqual([
      { user: sasha, emojis: ['👍', '🍕'] },
      { user: lena, emojis: ['👍'] },
    ]);
  });

  it('filters people without changing the confirmed reactions', () => {
    const before = structuredClone(reactions);
    expect(reactionPeople(reactions, '🍕')).toEqual([{ user: sasha, emojis: ['🍕'] }]);
    expect(reactionPeople(reactions, '❤️')).toEqual([]);
    expect(reactions).toEqual(before);
  });
});

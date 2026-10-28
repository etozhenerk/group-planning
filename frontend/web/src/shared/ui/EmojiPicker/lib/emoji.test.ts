import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import catalog from '@/shared/ui/EmojiPicker/lib/emoji-ru.json';
import { categoryIcons } from '@/shared/ui/EmojiPicker/lib/categoryIcons';
import { emojiCategories, searchEmoji } from '@/shared/ui/EmojiPicker/lib/emoji';

describe('shared emoji catalogue', () => {
  it('ships the complete common Unicode/CLDR data without a network dependency', () => {
    const source: unknown = JSON.parse(
      readFileSync(resolve(process.cwd(), '../../contracts/emoji/emoji-ru.json'), 'utf8'),
    );

    expect(catalog).toEqual(source);
    expect(new Set(catalog.map((item) => item.emoji)).size).toBe(3944);
  });
  it('presents every emoji once in the six approved groups and monochrome tabs', () => {
    expect(emojiCategories).toEqual([
      'Лица и люди',
      'Природа',
      'Еда и напитки',
      'Места и поездки',
      'Предметы',
      'Символы',
    ]);
    expect(categoryIcons).toEqual(['◷', '☺︎', '❀', '♧', '✈︎', '☼', '♡']);
    const grouped = emojiCategories.flatMap((category) => searchEmoji('', category));

    expect(grouped).toHaveLength(3944);
    expect(new Set(grouped.map(([emoji]) => emoji))).toEqual(
      new Set(catalog.map((item) => item.emoji)),
    );
    expect(searchEmoji('', 'Лица и люди').some(([emoji]) => emoji === '👋')).toBe(true);
    expect(searchEmoji('', 'Предметы').some(([emoji]) => emoji === '⚽')).toBe(true);
    expect(searchEmoji('', 'Символы').some(([emoji]) => emoji === '🇷🇺')).toBe(true);
  });
  it('finds Russian keywords and normalizes ё', () => {
    expect(searchEmoji('сердце', '').some(([emoji]) => emoji === '❤️')).toBe(true);
    expect(searchEmoji('слезы', '')).toEqual(searchEmoji('слёзы', ''));
    expect(searchEmoji('несуществующееназвание', '')).toEqual([]);
  });
});

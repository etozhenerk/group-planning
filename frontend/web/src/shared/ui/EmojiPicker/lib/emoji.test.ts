import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import catalog from '@/shared/ui/EmojiPicker/lib/emoji-ru.json';
import { searchEmoji } from '@/shared/ui/EmojiPicker/lib/emoji';

describe('shared emoji catalogue', () => {
  it('ships the complete common Unicode/CLDR data without a network dependency', () => {
    const source: unknown = JSON.parse(
      readFileSync(resolve(process.cwd(), '../../contracts/emoji/emoji-ru.json'), 'utf8'),
    );

    expect(catalog).toEqual(source);
    expect(new Set(catalog.map((item) => item.emoji)).size).toBe(3944);
  });
  it('finds Russian keywords and normalizes ё', () => {
    expect(searchEmoji('сердце', '').some(([emoji]) => emoji === '❤️')).toBe(true);
    expect(searchEmoji('слезы', '')).toEqual(searchEmoji('слёзы', ''));
    expect(searchEmoji('несуществующееназвание', '')).toEqual([]);
  });
});

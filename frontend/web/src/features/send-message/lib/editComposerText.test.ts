import { describe, expect, it } from 'vitest';
import {
  insertComposerText,
  eraseComposerText,
} from '@/features/send-message/lib/editComposerText';

describe('composer editing while the emoji dock owns focus', () => {
  it('replaces the saved selection and advances by the inserted UTF-16 length', () => {
    expect(insertComposerText('Возьму чай завтра', { start: 7, end: 10 }, '🍕')).toEqual({
      text: 'Возьму 🍕 завтра',
      selection: { start: 9, end: 9 },
    });
  });

  it('supports successive insertion without moving to the end of the draft', () => {
    const first = insertComposerText('чай', { start: 0, end: 0 }, '👩🏽‍💻');
    expect(first).not.toBeNull();

    if (first) {
      const second = insertComposerText(first.text, first.selection, '❤️');
      expect(second?.text).toBe('👩🏽‍💻❤️чай');
      expect(second?.selection.start).toBe('👩🏽‍💻❤️'.length);
    }
  });

  it('rejects over-limit insertion without truncating a grapheme or replacing text', () => {
    expect(insertComposerText('а'.repeat(3999), { start: 5, end: 5 }, '😀')).toBeNull();
    expect(
      insertComposerText('а'.repeat(4000), { start: 2, end: 4 }, '😀')?.text.length,
    ).toBe(4000);
  });

  it.each(['👨‍👩‍👧‍👦', '👍🏽', '🇷🇺', '❤️', 'е\u0301'])(
    'erases the whole grapheme %s',
    (emoji) => {
      expect(
        eraseComposerText(`До ${emoji} после`, {
          start: 3 + emoji.length,
          end: 3 + emoji.length,
        }),
      ).toEqual({ text: 'До  после', selection: { start: 3, end: 3 } });
    },
  );

  it('deletes a selection, does nothing at the beginning, and clamps stale positions', () => {
    expect(eraseComposerText('чай и кофе', { start: 0, end: 6 })).toEqual({
      text: 'кофе',
      selection: { start: 0, end: 0 },
    });
    expect(eraseComposerText('чай', { start: 0, end: 0 }).text).toBe('чай');
    expect(insertComposerText('', { start: 10, end: 10 }, '🍵')).toEqual({
      text: '🍵',
      selection: { start: 2, end: 2 },
    });
  });
});

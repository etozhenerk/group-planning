import { useState } from 'react';
import {
  emojiCategories,
  emojiData,
  searchEmoji,
} from '@/shared/ui/EmojiPicker/lib/emoji';

const readRecent = (): string[] => {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem('somewhere-recent-emoji') ?? '[]',
    );

    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string').slice(0, 24)
      : [];
  } catch {
    return [];
  }
};

export const useEmoji = (onSelect: (value: string) => void) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Недавние');
  const [recent, setRecent] = useState(readRecent);
  const choose = (value: string) => {
    const next = [value, ...recent.filter((item) => item !== value)].slice(0, 24);
    setRecent(next);

    try {
      localStorage.setItem('somewhere-recent-emoji', JSON.stringify(next));
    } catch {
      /* Optional preference. */
    }

    onSelect(value);
  };

  const values =
    query || category !== 'Недавние'
      ? searchEmoji(query, category)
      : recent
          .map((value) => emojiData.find(([emoji]) => emoji === value))
          .filter((value) => value !== undefined);

  return {
    query,
    setQuery,
    category,
    setCategory,
    choose,
    values,
    groups:
      !query && category === 'Недавние'
        ? [
            { title: 'Недавние', values },
            { title: 'Смайлы и эмоции', values: searchEmoji('', 'Эмоции') },
          ]
        : [{ title: query ? 'Результаты поиска' : category, values }],
    categories: ['Недавние', ...emojiCategories],
  };
};

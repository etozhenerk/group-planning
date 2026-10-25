import catalog from '@/shared/ui/EmojiPicker/lib/emoji-ru.json';

export const emojiCategories = [...new Set(catalog.map((item) => item.category_name))];

export const emojiData = catalog.map(
  (item) => [item.emoji, item.name, item.category_name] as const,
);

export const searchEmoji = (query: string, category: string) => {
  const normalized = query.toLocaleLowerCase('ru').replaceAll('ё', 'е');

  return catalog
    .filter((item) =>
      query
        ? `${item.name} ${item.keywords.join(' ')}`
            .toLocaleLowerCase('ru')
            .replaceAll('ё', 'е')
            .includes(normalized)
        : item.category_name === category,
    )
    .map((item) => [item.emoji, item.name, item.category_name] as const);
};

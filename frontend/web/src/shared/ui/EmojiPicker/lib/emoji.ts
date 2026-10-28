import catalog from '@/shared/ui/EmojiPicker/lib/emoji-ru.json';
import { emojiGroups } from '@/shared/ui/EmojiPicker/lib/emojiGroups';

export const emojiCategories = emojiGroups.map((group) => group.label);

export const emojiData = catalog.map(
  (item) => [item.emoji, item.name, item.category_name] as const,
);

export const searchEmoji = (query: string, category: string) => {
  const normalized = query.toLocaleLowerCase('ru').replaceAll('ё', 'е');
  const sources = emojiGroups.find((group) => group.label === category)?.categories;

  return catalog
    .filter((item) =>
      query
        ? `${item.name} ${item.keywords.join(' ')}`
            .toLocaleLowerCase('ru')
            .replaceAll('ё', 'е')
            .includes(normalized)
        : sources?.includes(item.category),
    )
    .map((item) => [item.emoji, item.name, item.category_name] as const);
};

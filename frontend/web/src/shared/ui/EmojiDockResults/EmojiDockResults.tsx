import type { EmojiItem } from '@/shared/ui/EmojiPicker/lib/types';
import styles from '@/shared/ui/EmojiDockResults/EmojiDockResults.module.css';

export type EmojiDockResultsProps = {
  groups: { title: string; values: EmojiItem[] }[];
  searching: boolean;
  reaction: boolean;
  selected: string[];
  pending: boolean;
  choose: (value: string) => void;
  clear: () => void;
};

export const EmojiDockResults = ({
  groups,
  searching,
  reaction,
  selected,
  pending,
  choose,
  clear,
}: EmojiDockResultsProps) => (
  <div className={styles.results}>
    {groups.map((group) => (
      <div key={group.title}>
        {!!group.values.length && <h3>{group.title}</h3>}
        <div className={styles.grid}>
          {group.values.map(([emoji, name]) => (
            <button
              key={emoji}
              type="button"
              disabled={pending}
              aria-label={`${reaction ? (selected.includes(emoji) ? 'Снять реакцию' : 'Поставить реакцию') : 'Вставить'}: ${name}`}
              aria-pressed={reaction ? selected.includes(emoji) : undefined}
              title={name}
              onClick={() => choose(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
        {!group.values.length && searching && (
          <div className={styles.empty} role="status">
            <strong>Эмодзи не найдены</strong>
            <span>Попробуйте другое слово</span>
            <button type="button" onClick={clear}>
              Очистить поиск
            </button>
          </div>
        )}
      </div>
    ))}
  </div>
);

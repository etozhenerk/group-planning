import { ChatIcon } from '@/shared/ui/ChatIcon';
import { categoryIcons } from '@/shared/ui/EmojiPicker/lib/categoryIcons';
import { useEmoji } from '@/shared/ui/EmojiPicker/hooks/useEmoji';
import styles from '@/shared/ui/EmojiPicker/EmojiPicker.module.css';

export type EmojiPickerProps = {
  onSelect: (emoji: string) => void;
  onClose?: (() => void) | undefined;
};

export const EmojiPicker = ({ onSelect, onClose }: EmojiPickerProps) => {
  const picker = useEmoji(onSelect);

  return (
    <section className={styles.picker} aria-label="Выбор эмодзи">
      <div className={styles.searchRow}>
        <label className={styles.search}>
          <span className={styles.hidden}>Найти эмодзи</span>
          <input
            type="search"
            placeholder="Найти эмодзи"
            value={picker.query}
            onChange={(event) => picker.setQuery(event.target.value)}
          />
        </label>
        {onClose && (
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Закрыть эмодзи"
          >
            <ChatIcon name="close" size={20} />
          </button>
        )}
      </div>
      <div className={styles.results}>
        {picker.groups.map((group) => (
          <div key={group.title}>
            <h3>{group.title}</h3>
            <div className={styles.grid} data-default={picker.groups.length > 1}>
              {group.values.map(([emoji, name]) => (
                <button
                  key={emoji}
                  type="button"
                  aria-label={name}
                  title={name}
                  onClick={() => picker.choose(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
            {!group.values.length && (
              <p>
                {picker.query
                  ? 'Эмодзи не найдены. Измените запрос.'
                  : 'Здесь появятся недавно выбранные эмодзи.'}
              </p>
            )}
          </div>
        ))}
      </div>
      <div className={styles.categories} aria-label="Категории эмодзи">
        {picker.categories.map((category, index) => (
          <button
            key={category}
            type="button"
            aria-label={category}
            title={category}
            aria-pressed={category === picker.category}
            onClick={() => {
              picker.setCategory(category);
              picker.setQuery('');
            }}
          >
            <span aria-hidden="true">{categoryIcons[index] ?? '⋯'}</span>
          </button>
        ))}
      </div>
    </section>
  );
};

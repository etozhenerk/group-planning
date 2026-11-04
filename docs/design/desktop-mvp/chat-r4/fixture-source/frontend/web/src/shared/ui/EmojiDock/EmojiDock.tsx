import { ChatIcon } from '@/shared/ui/ChatIcon';
import { useEmoji } from '@/shared/ui/EmojiPicker/hooks/useEmoji';
import { EmojiDockCategories } from '@/shared/ui/EmojiDockCategories';
import { EmojiDockResults } from '@/shared/ui/EmojiDockResults';
import styles from '@/shared/ui/EmojiDock/EmojiDock.module.css';

export type EmojiDockProps = {
  onSelect: (emoji: string) => void;
  onErase?: () => void;
  onClose?: () => void;
  selected?: string[];
  pending?: boolean;
  reaction?: boolean;
  composer?: boolean;
};

export const EmojiDock = ({
  onSelect,
  onErase,
  onClose,
  selected = [],
  pending = false,
  reaction = false,
  composer = false,
}: EmojiDockProps) => {
  const picker = useEmoji(onSelect);

  return (
    <section
      className={styles.dock}
      aria-label="Выбор эмодзи"
      data-reaction={reaction}
      data-composer={composer}
    >
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <ChatIcon name="search" aria-hidden="true" />
          <input
            type="search"
            aria-label="Найти эмодзи"
            placeholder="Поиск эмодзи"
            value={picker.query}
            onChange={(event) => picker.setQuery(event.target.value)}
            autoComplete="off"
          />
        </label>
        <button
          type="button"
          className={styles.control}
          onClick={reaction ? onClose : onErase}
          aria-label={
            reaction ? 'Закрыть реакции' : 'Удалить символ перед курсором сообщения'
          }
        >
          {reaction ? (
            <ChatIcon name="close" aria-hidden="true" />
          ) : (
            <ChatIcon name="backspace" aria-hidden="true" />
          )}
        </button>
      </div>
      <EmojiDockCategories
        categories={picker.categories}
        selected={picker.query ? '' : picker.category}
        onSelect={(category) => {
          picker.setCategory(category);
          picker.setQuery('');
        }}
      />
      <EmojiDockResults
        groups={picker.groups}
        searching={!!picker.query}
        reaction={reaction}
        selected={selected}
        pending={pending}
        choose={picker.choose}
        clear={() => picker.setQuery('')}
      />
    </section>
  );
};

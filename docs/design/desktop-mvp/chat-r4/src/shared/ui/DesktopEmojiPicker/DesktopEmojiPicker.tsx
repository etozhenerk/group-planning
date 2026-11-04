import { ChatIcon } from "@/shared/ui/ChatIcon";
import { useEmoji } from "@/shared/ui/EmojiPicker/hooks/useEmoji";
import { categoryIcons } from "@/shared/ui/EmojiPicker/lib/categoryIcons";
import { EmojiSearch } from "@desktop/shared/ui/EmojiSearch";
import styles from "@desktop/shared/ui/DesktopEmojiPicker/DesktopEmojiPicker.module.css";

export type DesktopEmojiPickerProps = {
  onSelect: (emoji: string) => void;
  onClose?: (() => void) | undefined;
};

export const DesktopEmojiPicker = ({
  onSelect,
  onClose,
}: DesktopEmojiPickerProps) => {
  const picker = useEmoji(onSelect);
  return (
    <section className={styles.picker} aria-label="Выбор эмодзи">
      <div className={styles.searchRow}>
        <EmojiSearch value={picker.query} onChange={picker.setQuery} />
        {onClose && (
          <button
            className={styles.close}
            type="button"
            onClick={onClose}
            aria-label="Закрыть эмодзи"
          >
            <ChatIcon name="close" size={20} />
          </button>
        )}
      </div>
      <div className={styles.results}>
        {picker.groups.map((group) => (
          <section key={group.title}>
            <h3>{group.title}</h3>
            <div className={styles.grid}>
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
              <p role="status">
                {picker.query
                  ? "Эмодзи не найдены. Измените запрос."
                  : "Здесь появятся недавно выбранные эмодзи."}
              </p>
            )}
          </section>
        ))}
      </div>
      <div
        className={styles.categories}
        role="group"
        aria-label="Категории эмодзи"
      >
        {picker.categories.map((category, index) => (
          <button
            key={category}
            type="button"
            aria-label={category}
            title={category}
            aria-pressed={!picker.query && category === picker.category}
            onClick={() => {
              picker.setCategory(category);
              picker.setQuery("");
            }}
          >
            <span aria-hidden="true">{categoryIcons[index] ?? "⋯"}</span>
          </button>
        ))}
      </div>
    </section>
  );
};

import { useRef } from "react";
import { ChatIcon } from "@/shared/ui/ChatIcon";
import styles from "@desktop/shared/ui/EmojiSearch/EmojiSearch.module.css";

export type EmojiSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export const EmojiSearch = ({ value, onChange }: EmojiSearchProps) => {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className={styles.search} role="search" aria-label="Поиск эмодзи">
      <ChatIcon name="search" size={18} aria-hidden="true" />
      <input
        ref={input}
        type="search"
        aria-label="Найти эмодзи"
        placeholder="Найти эмодзи"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.preventDefault();
        }}
      />
      <span className={styles.clearSlot}>
        {value && (
          <button
            type="button"
            aria-label="Очистить поиск эмодзи"
            onClick={() => {
              onChange("");
              input.current?.focus({ preventScroll: true });
            }}
          >
            <ChatIcon name="close" size={16} aria-hidden="true" />
          </button>
        )}
      </span>
    </div>
  );
};

import { ChatIcon } from '@/shared/ui/ChatIcon';
import { useState } from 'react';
import { EmojiDock } from '@/shared/ui/EmojiDock';
import { useMobileLayout } from '@/shared/lib/media';
import styles from '@/features/message-reactions/ui/ReactionChooser/ReactionChooser.module.css';

export type ReactionChooserProps = {
  choose: (emoji: string) => void;
  pending: boolean;
  close: () => void;
  selected: string[];
  context: string;
  readers?: (() => void) | undefined;
};

export const ReactionChooser = ({
  choose,
  pending,
  close,
  selected,
  context,
  readers,
}: ReactionChooserProps) => {
  const [all, setAll] = useState(false);
  const mobile = useMobileLayout();

  return all ? (
    <div className={styles.full}>
      <div className={styles.context}>
        <span>Реакция на сообщение</span>
        <p>{context}</p>
      </div>
      <EmojiDock
        onSelect={choose}
        onClose={close}
        reaction
        selected={selected}
        pending={pending}
      />
      {readers && (
        <button type="button" className={styles.readers} onClick={readers}>
          Кто прочитал
        </button>
      )}
    </div>
  ) : (
    <div className={styles.quick} data-mobile={mobile}>
      {['❤️', '👍', '😂', '🔥', '🎉'].map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => choose(emoji)}
          disabled={pending}
          aria-pressed={selected.includes(emoji)}
        >
          {emoji}
        </button>
      ))}
      <button type="button" onClick={() => setAll(true)} aria-label="Все эмодзи">
        <ChatIcon name="down" aria-hidden="true" />
      </button>
      {readers && (
        <button type="button" className={styles.readers} onClick={readers}>
          Кто прочитал
        </button>
      )}
    </div>
  );
};

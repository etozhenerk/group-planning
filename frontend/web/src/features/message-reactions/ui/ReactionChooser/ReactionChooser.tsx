import { useState } from 'react';
import { Plus } from 'lucide-react';
import { EmojiPicker } from '@/shared/ui/EmojiPicker';
import styles from '@/features/message-reactions/ui/ReactionChooser/ReactionChooser.module.css';

export type ReactionChooserProps = {
  choose: (emoji: string) => void;
  pending: boolean;
  close: () => void;
};

export const ReactionChooser = ({ choose, pending, close }: ReactionChooserProps) => {
  const [all, setAll] = useState(false);

  return all ? (
    <EmojiPicker onSelect={choose} onClose={close} />
  ) : (
    <div className={styles.quick}>
      {['❤️', '👍', '😂', '🔥', '🎉'].map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => choose(emoji)}
          disabled={pending}
        >
          {emoji}
        </button>
      ))}
      <button type="button" onClick={() => setAll(true)} aria-label="Все эмодзи">
        <Plus size={20} />
      </button>
    </div>
  );
};

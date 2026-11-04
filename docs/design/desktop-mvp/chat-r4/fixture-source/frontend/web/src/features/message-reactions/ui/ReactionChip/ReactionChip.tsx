import { ChatIcon } from '@/shared/ui/ChatIcon';
import { useRef } from 'react';
import type { Reaction } from '@/entities/meeting';
import { useHoldGesture } from '@/shared/lib/hold-gesture';
import styles from '@/features/message-reactions/ui/ReactionChip/ReactionChip.module.css';

export type ReactionChipProps = {
  reaction: Reaction;
  pending: boolean;
  choose: (emoji: string) => void;
  people: (emoji: string, trigger: HTMLElement) => void;
};

export const ReactionChip = ({
  reaction,
  pending,
  choose,
  people,
}: ReactionChipProps) => {
  const trigger = useRef<HTMLButtonElement>(null);
  const gesture = useHoldGesture<HTMLButtonElement>(!pending, () => {
    if (trigger.current) {
      trigger.current.focus({ preventScroll: true });
      people(reaction.emoji, trigger.current);
    }
  });

  return (
    <button
      ref={trigger}
      type="button"
      className={styles.chip}
      aria-label={`${reaction.emoji}: ${reaction.count}`}
      aria-description="Нажмите, чтобы изменить свою реакцию. Удерживайте или откройте контекстное меню, чтобы увидеть участников."
      aria-keyshortcuts="Shift+F10"
      aria-pressed={reaction.mine}
      data-reaction-chip
      data-pressing={gesture.pressed}
      disabled={pending}
      {...gesture.events}
      onClick={() => choose(reaction.emoji)}
    >
      <span>{reaction.emoji}</span>
      <span className={styles.count}>{reaction.count}</span>
      {reaction.mine && (
        <ChatIcon name="check" aria-hidden="true" className={styles.check} />
      )}
    </button>
  );
};

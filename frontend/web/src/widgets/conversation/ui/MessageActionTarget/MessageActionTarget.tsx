import type { ReactNode } from 'react';
import type { FeedEntry } from '@/entities/meeting';
import type { useReactionGesture } from '@/widgets/conversation/ui/FeedRecord/hooks/useReactionGesture';
import styles from '@/widgets/conversation/ui/MessageActionTarget/MessageActionTarget.module.css';

export type MessageActionTargetProps = {
  entry: FeedEntry;
  open: boolean;
  gesture: ReturnType<typeof useReactionGesture>;
  children: ReactNode;
};

export const MessageActionTarget = ({
  entry,
  open,
  gesture,
  children,
}: MessageActionTargetProps) => {
  const interactive = entry.kind === 'message' && !entry.delivery;

  return (
    <div
      ref={gesture.anchor}
      className={styles.target}
      data-testid="message-actions"
      data-read-sequence={interactive ? entry.sequence : undefined}
      data-chat-surface-trigger
      data-pressing={gesture.pressed}
      tabIndex={interactive ? 0 : undefined}
      role={interactive ? 'group' : undefined}
      aria-label={
        entry.kind === 'message'
          ? `Реакции на сообщение: ${entry.text ?? 'Вложение'}`
          : undefined
      }
      aria-haspopup={interactive ? 'dialog' : undefined}
      aria-expanded={interactive ? open : undefined}
      aria-keyshortcuts={interactive ? 'Enter Space Shift+F10' : undefined}
      {...gesture.events}
    >
      {children}
    </div>
  );
};

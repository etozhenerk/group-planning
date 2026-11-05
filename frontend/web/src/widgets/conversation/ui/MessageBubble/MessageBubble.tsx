import type { ReactNode } from 'react';
import type { FeedEntry } from '@/entities/meeting';
import styles from '@/widgets/conversation/ui/MessageBubble/MessageBubble.module.css';

export type MessageBubbleProps = {
  entry: FeedEntry;
  own: boolean;
  mobile: boolean;
  footer: ReactNode;
};

export const MessageBubble = ({ entry, own, mobile, footer }: MessageBubbleProps) => (
  <div
    className={styles.bubble}
    data-own={own}
    data-mobile={mobile}
    data-testid="message-bubble"
  >
    {mobile && !own && (
      <strong className={styles.author}>{entry.actor.displayName}</strong>
    )}
    <p>{entry.text ?? entry.event}</p>
    {mobile && <div className={styles.footer}>{footer}</div>}
  </div>
);

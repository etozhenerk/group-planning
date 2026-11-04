import type { ReactNode } from "react";
import styles from "@message/entities/chat/ui/MessageBubble/MessageBubble.module.css";

export type MessageBubbleProps = {
  own?: boolean;
  author: string;
  children: ReactNode;
  metadata: ReactNode;
  reactions?: ReactNode;
  media?: boolean;
  start?: boolean;
  end?: boolean;
  file?: boolean;
  hasReactions?: boolean;
};

export const MessageBubble = ({
  own = false,
  author,
  children,
  metadata,
  reactions,
  media = false,
  start = true,
  end = true,
  file = false,
  hasReactions = false,
}: MessageBubbleProps) => (
  <div
    className={styles.bubble}
    data-own={own}
    data-testid="message-bubble"
    data-media={media}
    data-start={start}
    data-end={end}
    data-file={file}
    data-reactions={hasReactions}
  >
    {!own && start && (
      <strong className={styles.author} data-message-author>
        {author}
      </strong>
    )}
    <div className={styles.body}>{children}</div>
    <div className={styles.footer}>
      {reactions}
      <span className={styles.metadata}>{metadata}</span>
    </div>
  </div>
);

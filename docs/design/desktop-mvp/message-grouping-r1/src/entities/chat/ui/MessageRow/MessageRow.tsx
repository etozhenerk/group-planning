import type { ReactNode } from "react";
import styles from "@message/entities/chat/ui/MessageRow/MessageRow.module.css";

export type MessageRowProps = {
  own?: boolean;
  start?: boolean;
  end?: boolean;
  avatar: ReactNode;
  children: ReactNode;
  active?: boolean;
  delivery?: string;
};

export const MessageRow = ({
  own = false,
  start = true,
  end = true,
  avatar,
  children,
  active = false,
  delivery = "accepted",
}: MessageRowProps) => (
  <li
    className={styles.row}
    data-own={own}
    data-start={start}
    data-end={end}
    data-active={active}
    data-delivery={delivery}
    data-testid="feed-message"
  >
    <span className={styles.avatar} aria-hidden="true">
      {avatar}
    </span>
    <div className={styles.content}>{children}</div>
  </li>
);

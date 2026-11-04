import { MessageBubble, MessageRow } from "@message/entities/chat";
import { Avatar } from "@/shared/ui/Avatar";
import { MessageReceipt } from "@prototype/entities/chat/ui/MessageReceipt/MessageReceipt";
import styles from "@prototype/entities/chat/ui/DemoMessage/DemoMessage.module.css";

export type DemoMessageProps = {
  own?: boolean;
  name: string;
  photo: string;
  text: string;
  time: string;
  reaction?: string;
  start?: boolean;
  end?: boolean;
};

export const DemoMessage = ({
  own = false,
  name,
  photo,
  text,
  time,
  reaction,
  start = true,
  end = true,
}: DemoMessageProps) => (
  <MessageRow
    own={own}
    start={start}
    end={end}
    avatar={<Avatar name={name} src={photo} size="mobile-chat" />}
  >
    <MessageBubble
      own={own}
      author={name}
      start={start}
      end={end}
      hasReactions={!!reaction}
      metadata={
        <span className={styles.meta}>
          <time>{time}</time>
          {own && <MessageReceipt count="4" show={() => undefined} />}
        </span>
      }
      reactions={
        reaction && (
          <span className={styles.reaction}>
            {reaction} <small>3</small>
          </span>
        )
      }
    >
      <p>{text}</p>
    </MessageBubble>
  </MessageRow>
);

import { useEmojiPanel } from '@/features/send-message/ui/SendMessage/hooks/useEmojiPanel';
import { EmojiPicker } from '@/shared/ui/EmojiPicker';
import { useEmojiInsertion } from '@/features/send-message/ui/SendMessage/hooks/useEmojiInsertion';
import styles from '@/features/send-message/ui/SendMessage/SendMessage.module.css';
import type { ReactNode } from 'react';
import { ArrowUp, Smile } from 'lucide-react';
import type { Session } from '@/entities/session';
import { useSendMessage } from '@/features/send-message/model/useSendMessage';
import { PendingBubble } from '@/features/send-message/ui/PendingBubble';

export type SendMessageProps = {
  id: string;
  session: Session;
  extraAction?: ReactNode;
  emojiOpen?: boolean;
  toggleEmoji?: () => void;
};

export const SendMessage = ({
  id,
  session,
  extraAction,
  emojiOpen = false,
  toggleEmoji,
}: SendMessageProps) => {
  const panel = useEmojiPanel(emojiOpen, toggleEmoji);
  const action = useSendMessage(id, session);
  const emoji = useEmojiInsertion(action.text, action.setText);

  return (
    <div className={styles['composer-area']} ref={panel.root}>
      <div className={styles['pending-messages']} data-testid="pending-messages">
        {action.pending.map((message) => (
          <PendingBubble key={message.id} message={message} retry={action.retry} />
        ))}
      </div>
      {emojiOpen && (
        <div className={styles.panel}>
          <EmojiPicker onSelect={emoji.insert} onClose={toggleEmoji} />
        </div>
      )}
      <div className={styles['composer-row']}>
        {extraAction}
        <form className={styles['composer']} onSubmit={action.submit}>
          <label className={styles['grow']}>
            <span className={styles['sr-only']}>Сообщение</span>
            <textarea
              aria-label="Сообщение"
              ref={emoji.input}
              onSelect={emoji.remember}
              onBlur={emoji.remember}
              rows={1}
              maxLength={4000}
              value={action.text}
              onChange={(event) => action.setText(event.target.value)}
              onKeyDown={action.keyDown}
              placeholder="Сообщение…"
              disabled={action.disabled}
            />
          </label>
          <button
            type="button"
            className={styles.icon}
            aria-label="Выбрать эмодзи"
            ref={panel.trigger}
            aria-expanded={emojiOpen}
            onClick={toggleEmoji}
          >
            <Smile size={23} aria-hidden="true" />
          </button>
          <button
            type="submit"
            className={[styles['icon'], styles['primary']].join(' ')}
            aria-label="Отправить сообщение"
            disabled={!action.text.trim() || action.disabled}
          >
            <ArrowUp aria-hidden="true" size={22} />
          </button>
        </form>
      </div>
    </div>
  );
};

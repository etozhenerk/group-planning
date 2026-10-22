import styles from '@/features/send-message/ui/SendMessage/SendMessage.module.css';
import type { ReactNode } from 'react';
import { ArrowUp } from 'lucide-react';
import type { Session } from '@/entities/session';
import { useSendMessage } from '@/features/send-message/model/useSendMessage';
import { PendingBubble } from '@/features/send-message/ui/PendingBubble';

export type SendMessageProps = { id: string; session: Session; extraAction?: ReactNode };

export const SendMessage = ({ id, session, extraAction }: SendMessageProps) => {
  const action = useSendMessage(id, session);

  return (
    <div className={styles['composer-area']}>
      <div className={styles['pending-messages']} data-testid="pending-messages">
        {action.pending.map((message) => (
          <PendingBubble key={message.id} message={message} retry={action.retry} />
        ))}
      </div>
      <div className={styles['composer-row']}>
        {extraAction}
        <form className={styles['composer']} onSubmit={action.submit}>
          <label className={styles['grow']}>
            <span className={styles['sr-only']}>Сообщение</span>
            <textarea
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

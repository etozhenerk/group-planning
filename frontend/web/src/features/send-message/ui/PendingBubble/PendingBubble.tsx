import styles from '@/features/send-message/ui/PendingBubble/PendingBubble.module.css';
import type { PendingMessage } from '@/features/send-message/model/types';

export type PendingBubbleProps = {
  message: PendingMessage;
  retry: (message: PendingMessage) => Promise<void>;
};

export const PendingBubble = ({ message, retry }: PendingBubbleProps) => {
  return (
    <div className={styles['pending-message']} data-testid="pending-message">
      <p>{message.text}</p>
      {message.state === 'failed' ? (
        <div className={styles['row']}>
          <span className={styles['error']} role="alert">
            Не удалось подтвердить отправку.
          </span>
          <button type="button" onClick={() => retry(message)}>
            Повторить отправку
          </button>
        </div>
      ) : (
        <small role="status">Отправляем…</small>
      )}
    </div>
  );
};

import { ButtonSpinner } from '@/shared/ui/ButtonSpinner';
import { usePendingIndicator } from '@/features/send-message/ui/MessagePendingIndicator/hooks/usePendingIndicator';
import styles from '@/features/send-message/ui/MessagePendingIndicator/MessagePendingIndicator.module.css';

export type MessagePendingIndicatorProps = {
  state: 'queued' | 'sending' | 'uncertain' | 'rejected' | undefined;
  createdAt: string;
};

export const MessagePendingIndicator = ({
  state,
  createdAt,
}: MessagePendingIndicatorProps) => {
  const visible = usePendingIndicator(
    state === 'queued' || state === 'sending',
    createdAt,
  );

  return (
    <span className={styles.slot} data-testid="message-pending-slot">
      {visible && (
        <span role="status" aria-label="Отправляем сообщение">
          <ButtonSpinner />
        </span>
      )}
    </span>
  );
};

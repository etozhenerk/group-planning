import { useState } from 'react';
import { useMessageDelivery } from '@/features/send-message/model/useMessageDelivery';
import { CompactDelivery } from '@/features/send-message/ui/CompactDelivery';
import { useMobileLayout } from '@/shared/lib/media';
import styles from '@/features/send-message/ui/MessageDelivery/MessageDelivery.module.css';

export type MessageDeliveryProps = {
  user: string;
  meeting: string;
  id: string;
  state: 'uncertain' | 'rejected';
  panel?: { open: boolean; change: (open: boolean) => void } | undefined;
};

export const MessageDelivery = ({
  user,
  meeting,
  id,
  state,
  panel,
}: MessageDeliveryProps) => {
  const action = useMessageDelivery(user, meeting, id);
  const mobile = useMobileLayout();
  const [open, change] = useState(false);

  return mobile && state === 'rejected' ? (
    <CompactDelivery
      open={panel?.open ?? open}
      change={panel?.change ?? change}
      blocked={action.occupied}
      error={action.error}
      retry={() => action.perform('retry')}
      restore={() => action.perform('restore')}
    />
  ) : (
    <div className={styles.status} data-testid="message-delivery">
      <span role="status">
        {state === 'rejected' ? 'Не удалось отправить' : 'Проверяем отправку'}
      </span>
      {state === 'rejected' && (
        <>
          <button
            type="button"
            onClick={() => {
              void action.perform('retry');
            }}
          >
            Повторить
          </button>
          <button
            type="button"
            disabled={action.occupied}
            onClick={() => {
              void action.perform('restore');
            }}
          >
            Вернуть текст
          </button>
        </>
      )}
      {action.error && <span role="alert">{action.error}</span>}
    </div>
  );
};

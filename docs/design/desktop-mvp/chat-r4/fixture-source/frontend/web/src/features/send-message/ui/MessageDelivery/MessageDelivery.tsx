import { useQuery } from '@tanstack/react-query';
import { privateKey, useAccess } from '@/entities/meeting';
import { outgoingError } from '@/features/send-message/lib/outgoingError';
import { useState } from 'react';
import { changeOutgoing } from '@/features/send-message/model/changeOutgoing';
import styles from '@/features/send-message/ui/MessageDelivery/MessageDelivery.module.css';

export type MessageDeliveryProps = {
  user: string;
  meeting: string;
  id: string;
  state: 'uncertain' | 'rejected';
};

export const MessageDelivery = ({ user, meeting, id, state }: MessageDeliveryProps) => {
  const access = useAccess(user, meeting);
  const occupied = useQuery<boolean>({
    queryKey: privateKey(user, meeting, access.epoch, 'draft-occupied'),
    enabled: false,
    initialData: false,
  });

  const [error, setError] = useState<string | null>(null);

  return (
    <div className={styles.status} data-testid="message-delivery">
      <span role="status">
        {state === 'rejected' ? 'Не удалось отправить' : 'Проверяем отправку'}
      </span>
      {state === 'rejected' && (
        <>
          <button
            type="button"
            onClick={() => {
              void changeOutgoing(user, meeting, id, 'retry').catch((failure: unknown) =>
                setError(outgoingError(failure)),
              );
            }}
          >
            Повторить
          </button>
          <button
            type="button"
            disabled={occupied.data}
            onClick={() => {
              void changeOutgoing(user, meeting, id, 'restore').catch(
                (failure: unknown) => setError(outgoingError(failure)),
              );
            }}
          >
            Вернуть текст
          </button>
        </>
      )}
      {error && <span role="alert">{error}</span>}
    </div>
  );
};

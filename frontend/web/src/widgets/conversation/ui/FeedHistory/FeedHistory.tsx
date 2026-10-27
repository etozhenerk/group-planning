import { useHistoryHeight } from '@/widgets/conversation/ui/FeedHistory/hooks/useHistoryHeight';
import { Skeleton } from '@/shared/ui/Skeleton';
import styles from '@/widgets/conversation/ui/FeedHistory/FeedHistory.module.css';

export type FeedHistoryProps = {
  hasOlder: boolean;
  loading: boolean;
  error: boolean;
  older: () => void;
  newer?: boolean;
};

export const FeedHistory = ({
  hasOlder,
  loading,
  error,
  older,
  newer = false,
}: FeedHistoryProps) => {
  const visible = hasOlder || loading || error;
  const history = useHistoryHeight(visible);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={styles.boundary}
      ref={history.ref}
      style={{ minHeight: history.height }}
    >
      {loading && (
        <div role="status" aria-label="Загрузка сообщений" className={styles.loading}>
          <Skeleton />
          <Skeleton />
        </div>
      )}
      {error ? (
        <p className={styles.error} role="alert">
          Не удалось загрузить сообщения.{' '}
          <button type="button" onClick={older}>
            Повторить
          </button>
        </p>
      ) : (
        hasOlder &&
        !loading && (
          <button className={styles.history} type="button" onClick={older}>
            {newer ? 'Следующие записи' : 'Предыдущие записи'}
          </button>
        )
      )}
    </div>
  );
};

import styles from '@/features/message-reactions/ui/ReactionRetry/ReactionRetry.module.css';

export type ReactionRetryProps = { retry: () => void; pending: boolean };

export const ReactionRetry = ({ retry, pending }: ReactionRetryProps) => (
  <button
    type="button"
    className={styles.retry}
    onClick={retry}
    disabled={pending}
    aria-busy={pending}
  >
    Не удалось сохранить. Повторить
  </button>
);

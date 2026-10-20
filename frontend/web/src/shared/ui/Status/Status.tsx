import styles from '@/shared/ui/Status/Status.module.css';

export type StatusProps = {
  title: string;
  text?: string;
  error?: boolean;
  action?: () => void;
  actionLabel?: string;
};

export const Status = ({
  title,
  text,
  error = false,
  action,
  actionLabel = 'Попробовать снова',
}: StatusProps) => {
  return (
    <section className={styles['state']} role={error ? 'alert' : 'status'}>
      <h2>{title}</h2>
      {text && <p className={styles['muted']}>{text}</p>}
      {action && (
        <button type="button" className={styles['primary']} onClick={action}>
          {actionLabel}
        </button>
      )}
    </section>
  );
};

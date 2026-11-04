import styles from '@/shared/ui/FieldError/FieldError.module.css';

export type FieldErrorProps = { id: string; error: string };

export const FieldError = ({ id, error }: FieldErrorProps) =>
  error ? (
    <p id={id} role="alert" className={styles.error}>
      {error}
    </p>
  ) : null;

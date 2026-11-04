import { useMobileLayout } from '@/shared/lib/media';
import styles from '@/shared/ui/RequiredHint/RequiredHint.module.css';

export type RequiredHintProps = { id: string; required: boolean };

export const RequiredHint = ({ id, required }: RequiredHintProps) => {
  const mobile = useMobileLayout();

  return required && mobile ? (
    <span id={id} className={styles.hint} aria-hidden="true">
      Обязательное поле
    </span>
  ) : null;
};

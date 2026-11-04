import { useMobileLayout } from '@/shared/lib/media';
import styles from '@/shared/ui/RequiredMark/RequiredMark.module.css';

export const RequiredMark = () => {
  const mobile = useMobileLayout();

  return mobile ? (
    <span className={styles.mark} aria-hidden="true">
      *
    </span>
  ) : null;
};

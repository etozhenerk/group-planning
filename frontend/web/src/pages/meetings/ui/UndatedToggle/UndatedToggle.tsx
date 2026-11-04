import { useMobileLayout } from '@/shared/lib/media';
import { CalendarClock } from 'lucide-react';
import styles from '@/pages/meetings/ui/UndatedToggle/UndatedToggle.module.css';

export type UndatedToggleProps = {
  count: number | undefined;
  selected: boolean;
  onToggle: () => void;
};

export const UndatedToggle = ({ count, selected, onToggle }: UndatedToggleProps) => {
  const mobile = useMobileLayout();

  return count ? (
    <button
      type="button"
      className={styles.toggle}
      data-mobile={mobile}
      aria-label={mobile ? `Без даты, встреч: ${count}` : undefined}
      aria-pressed={selected}
      onClick={onToggle}
    >
      {mobile ? (
        <>
          Без даты<span className={styles.count}>{count}</span>
          <span className={styles.arrow} aria-hidden="true">
            →
          </span>
        </>
      ) : (
        <>
          <CalendarClock size={17} aria-hidden="true" />
          Без даты · {count}
        </>
      )}
    </button>
  ) : null;
};

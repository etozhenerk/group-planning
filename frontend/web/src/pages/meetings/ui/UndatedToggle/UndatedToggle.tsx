import { CalendarClock } from 'lucide-react';
import styles from '@/pages/meetings/ui/UndatedToggle/UndatedToggle.module.css';

export type UndatedToggleProps = {
  count: number | undefined;
  selected: boolean;
  onToggle: () => void;
};

export const UndatedToggle = ({ count, selected, onToggle }: UndatedToggleProps) => {
  return count ? (
    <button
      type="button"
      className={styles.toggle}
      aria-pressed={selected}
      onClick={onToggle}
    >
      <CalendarClock size={17} aria-hidden="true" />
      Без даты · {count}
    </button>
  ) : null;
};

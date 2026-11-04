import { CalendarDays, List } from 'lucide-react';
import { designTokens } from '@/shared/config/design-tokens';
import styles from '@/pages/meetings/ui/HomeViewToggle/HomeViewToggle.module.css';

export type HomeViewToggleProps = { view: 'list' | 'calendar'; onToggle: () => void };

export const HomeViewToggle = ({ view, onToggle }: HomeViewToggleProps) => (
  <button
    type="button"
    className={styles.toggle}
    aria-label={view === 'calendar' ? 'Показать список' : 'Показать календарь'}
    title={view === 'calendar' ? 'Список' : 'Календарь'}
    onClick={onToggle}
  >
    {view === 'calendar' ? (
      <List
        size={Number.parseFloat(designTokens.componentMobileMeetingsViewIconSize)}
        aria-hidden="true"
      />
    ) : (
      <CalendarDays
        size={Number.parseFloat(designTokens.componentMobileMeetingsViewIconSize)}
        aria-hidden="true"
      />
    )}
  </button>
);

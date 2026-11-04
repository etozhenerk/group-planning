import { CalendarDays } from 'lucide-react';
import { designTokens } from '@/shared/config/design-tokens';
import styles from '@/pages/meetings/ui/EmptyDay/EmptyDay.module.css';

export type EmptyDayProps = { text: string };

export const EmptyDay = ({ text }: EmptyDayProps) => (
  <div className={styles.empty}>
    <CalendarDays
      size={Number.parseFloat(designTokens.componentMobileMeetingsEmptyDayIcon)}
      strokeWidth={designTokens.componentMobileStateGlyphStroke}
      aria-hidden="true"
    />
    <p>{text}</p>
  </div>
);

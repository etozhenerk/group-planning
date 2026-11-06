import { Crown } from 'lucide-react';
import { designTokens } from '@/shared/config/design-tokens';
import styles from '@/entities/meeting/ui/MeetingCardTitle/MeetingCardTitle.module.css';

export type MeetingCardTitleProps = { title: string; own: boolean };

export const MeetingCardTitle = ({ title, own }: MeetingCardTitleProps) => {
  const lastSpace = title.trimEnd().lastIndexOf(' ');
  const prefix = lastSpace < 0 ? '' : title.slice(0, lastSpace + 1);
  const tail = title.slice(lastSpace + 1);

  return own ? (
    <>
      {prefix}
      <span className={styles.titleEnd}>
        <span>{tail}</span>
        <Crown size={designTokens.spaceS16} aria-label="Вы организатор" />
      </span>
    </>
  ) : (
    <>{title}</>
  );
};

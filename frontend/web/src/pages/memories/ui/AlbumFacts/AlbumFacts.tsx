import type { Meeting } from '@/entities/meeting';
import { useMobileLayout } from '@/shared/lib/media';
import styles from '@/pages/memories/ui/AlbumFacts/AlbumFacts.module.css';

export type AlbumFactsProps = { meeting: Meeting | undefined };

export const AlbumFacts = ({ meeting }: AlbumFactsProps) => {
  const mobile = useMobileLayout();
  const date =
    meeting?.startsAt || meeting?.startsOn
      ? new Intl.DateTimeFormat('ru-RU', {
          day: 'numeric',
          month: 'long',
          timeZone: meeting.startsAt ? meeting.timezone : 'UTC',
        }).format(new Date(meeting.startsAt ?? `${meeting.startsOn}T12:00:00Z`))
      : 'Дата не выбрана';

  return (
    <p className={styles.facts} data-mobile={mobile}>
      {date}
      {meeting?.place ? ` · ${meeting.place}` : ''}
    </p>
  );
};

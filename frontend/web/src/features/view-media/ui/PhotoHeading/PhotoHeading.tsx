import { X } from 'lucide-react';
import { useMeeting } from '@/entities/meeting';
import { dayLabel } from '@/shared/lib/time';
import type { Media } from '@/shared/api';
import styles from '@/features/view-media/ui/PhotoHeading/PhotoHeading.module.css';

export type PhotoHeadingProps = {
  media: Media;
  user: string;
  index: number;
  count: number;
  close: () => void;
};

export const PhotoHeading = ({ media, user, index, count, close }: PhotoHeadingProps) => {
  const query = useMeeting(media.meeting_id, user);
  const meeting = query.data;
  const date = meeting?.startsOn
    ? dayLabel(meeting.startsOn)
    : meeting?.startsAt
      ? new Intl.DateTimeFormat('ru-RU', {
          day: 'numeric',
          month: 'long',
          timeZone: meeting.timezone,
        }).format(new Date(meeting.startsAt))
      : '';

  return (
    <header className={styles.heading}>
      <div>
        <h3>{meeting?.title ?? 'Фото встречи'}</h3>
        <p aria-live="polite">
          {date ? `${date} · ` : ''}
          {index + 1} / {count}
        </p>
      </div>
      <button type="button" onClick={close} aria-label="Закрыть просмотр">
        <X size={20} aria-hidden="true" />
      </button>
    </header>
  );
};

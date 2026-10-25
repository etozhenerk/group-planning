import { Plus } from 'lucide-react';
import type { Meeting } from '@/entities/meeting';
import styles from '@/pages/memories/ui/AlbumHeading/AlbumHeading.module.css';

export type AlbumHeadingProps = {
  meeting: Meeting | undefined;
  upload: () => void;
  disabled: boolean;
};

export const AlbumHeading = ({ meeting, upload, disabled }: AlbumHeadingProps) => (
  <header className={styles.heading}>
    <div>
      <p>
        {meeting?.startsAt || meeting?.startsOn
          ? new Intl.DateTimeFormat('ru-RU', {
              day: 'numeric',
              month: 'long',
              timeZone: meeting.startsAt ? meeting.timezone : 'UTC',
            }).format(new Date(meeting.startsAt ?? `${meeting.startsOn}T12:00:00Z`))
          : 'Дата не выбрана'}
        {meeting?.place ? ` · ${meeting.place}` : ''}
      </p>
      <h1>{meeting?.title ?? 'Вайб встречи'}</h1>
    </div>
    <button type="button" onClick={upload} disabled={disabled}>
      <Plus size={21} />
      Добавить фото
    </button>
  </header>
);

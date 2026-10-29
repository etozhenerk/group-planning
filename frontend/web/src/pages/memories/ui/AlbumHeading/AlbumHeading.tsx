import type { ReactNode } from 'react';
import type { Meeting } from '@/entities/meeting';
import styles from '@/pages/memories/ui/AlbumHeading/AlbumHeading.module.css';

export type AlbumHeadingProps = {
  meeting: Meeting | undefined;
  actions: ReactNode;
};

export const AlbumHeading = ({ meeting, actions }: AlbumHeadingProps) => (
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
    {actions}
  </header>
);

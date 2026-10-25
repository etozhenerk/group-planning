import { Link } from 'react-router';
import { MemoryPreview } from '@/entities/meeting';
import type { Meeting } from '@/entities/meeting';
import styles from '@/pages/meeting/ui/MemoryBanner/MemoryBanner.module.css';

export type MemoryBannerProps = { meeting: Meeting; user: string };

export const MemoryBanner = ({ meeting, user }: MemoryBannerProps) => (
  <Link
    className={styles.banner}
    to={`/meetings/${meeting.id}/memories?from=chat`}
    aria-label={
      meeting.memoryPhotoCount
        ? 'Вайб встречи Открыть вайб'
        : 'Как всё прошло? Добавить фото'
    }
  >
    <span>
      <span className={styles.label}>Встреча закончилась</span>
      <strong>{meeting.memoryPhotoCount ? 'Вайб встречи' : 'Как всё прошло?'}</strong>
      <small>
        {meeting.memoryPhotoCount ? 'Открыть вайб' : 'Добавить фото'}
        <span aria-hidden="true">↗</span>
      </small>
    </span>
    {meeting.memoryPreview?.length ? (
      <MemoryPreview photos={meeting.memoryPreview} user={user} large />
    ) : (
      <span className={styles.empty} aria-hidden="true">
        ✦
      </span>
    )}
  </Link>
);

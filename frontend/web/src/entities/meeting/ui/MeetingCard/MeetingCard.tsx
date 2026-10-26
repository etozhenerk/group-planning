import { MemoryPreview } from '@/entities/meeting/ui/MemoryPreview';
import { MeetingCover } from '@/entities/meeting/ui/MeetingCover';
import { ParticipantPreview } from '@/entities/meeting/ui/ParticipantPreview';
import { Link } from 'react-router';
import { Images, Crown, MapPin, Sparkle } from 'lucide-react';
import type { MeetingSummary } from '@/entities/meeting/model/types';
import { cardLabels } from '@/entities/meeting/lib/cardLabels';
import styles from '@/entities/meeting/ui/MeetingCard/MeetingCard.module.css';

export type MeetingCardProps = { meeting: MeetingSummary; user: string; past?: boolean };

export const MeetingCard = ({ meeting, user, past = false }: MeetingCardProps) => {
  const labels = cardLabels(meeting);
  const lastSpace = meeting.title.trimEnd().lastIndexOf(' ');
  const prefix = lastSpace < 0 ? '' : meeting.title.slice(0, lastSpace + 1);
  const tail = meeting.title.slice(lastSpace + 1);

  return (
    <article
      className={styles.card}
      data-testid="meeting-card"
      data-weekend={['сб', 'вс'].includes(labels.weekday)}
    >
      <Link className={styles.link} to={`/meetings/${meeting.id}`}>
        <time
          className={styles.date}
          title={labels.date}
          dateTime={meeting.startsAt ?? meeting.startsOn ?? undefined}
        >
          {labels.date}
        </time>
        {meeting.coverUrl && (
          <div className={styles.cover}>
            <MeetingCover url={meeting.coverUrl} meeting={meeting.id} user={user} fill />
          </div>
        )}
        <div className={styles.info}>
          <h2>
            {meeting.organizerId === user ? (
              <>
                {prefix}
                <span className={styles.titleEnd}>
                  <span>{tail}</span>
                  <Crown size={16} aria-label="Вы организатор" />
                </span>
              </>
            ) : (
              meeting.title
            )}
          </h2>
          <p>
            <MapPin size={14} aria-hidden="true" />
            {meeting.place || 'Место пока не выбрано'}
          </p>
          {labels.zone && <p>{labels.zone}</p>}
        </div>
        <Sparkle
          className={styles.sparkle}
          size={16}
          fill="currentColor"
          strokeWidth={0}
          aria-hidden="true"
        />
        <div className={styles.people}>
          <ParticipantPreview meeting={meeting} />
        </div>
      </Link>
      {past && (
        <Link className={styles.album} to={`/meetings/${meeting.id}/memories`}>
          {meeting.memoryPreview?.length ? (
            <MemoryPreview photos={meeting.memoryPreview} user={user} />
          ) : (
            <Images size={18} aria-hidden="true" />
          )}
          {meeting.memoryPhotoCount
            ? `Вайб встречи · ${meeting.memoryPhotoCount} фото`
            : 'Добавить фото встречи'}
        </Link>
      )}
    </article>
  );
};

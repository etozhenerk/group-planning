import { Link } from 'react-router';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import type { MeetingSummary } from '@/entities/meeting/model/types';
import { cardLabels } from '@/entities/meeting/lib/cardLabels';
import { timeLabel } from '@/shared/lib/time';
import styles from '@/entities/meeting/ui/MeetingCard/MeetingCard.module.css';

export type MeetingCardProps = { meeting: MeetingSummary };

export const MeetingCard = ({ meeting }: MeetingCardProps) => {
  const labels = cardLabels(meeting);

  return (
    <Link
      to={`/meetings/${meeting.id}`}
      className={styles.card}
      data-testid="meeting-card"
    >
      {meeting.coverUrl ? (
        <img src={meeting.coverUrl} alt="" className={styles.cover} />
      ) : (
        <div className={styles.emblem}>
          <Sparkles aria-hidden="true" size={30} />
        </div>
      )}
      <div className={styles.date} aria-hidden="true">
        <strong>{labels.day}</strong>
        <small>{labels.weekday}</small>
      </div>
      <div className={styles.info}>
        <h2>{meeting.title}</h2>
        <p>{timeLabel(meeting.startsAt, meeting.timezone, meeting.startsOn)}</p>
        <p>
          {meeting.place || 'Место пока не выбрано'} · Участников:{' '}
          {meeting.participantCount}
        </p>
        {labels.zone && <p>{labels.zone}</p>}
      </div>
      <ArrowUpRight aria-hidden="true" className={styles.arrow} size={20} />
    </Link>
  );
};

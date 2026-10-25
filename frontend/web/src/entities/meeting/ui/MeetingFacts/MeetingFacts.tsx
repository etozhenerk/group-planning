import styles from '@/entities/meeting/ui/MeetingFacts/MeetingFacts.module.css';
import { Calendar, MapPin } from 'lucide-react';
import { timeLabel, timezoneLabel } from '@/shared/lib/time';

export type MeetingFactsProps = {
  startsAt: string | null;
  startsOn?: string | null;
  timezone: string;
  place: string | null;
  compact?: boolean;
};

export const MeetingFacts = ({
  startsAt,
  startsOn,
  timezone,
  place,
  compact = false,
}: MeetingFactsProps) => {
  return (
    <dl className={[styles['meeting-facts'], compact ? styles.compact : ''].join(' ')}>
      <div>
        <dt>
          <Calendar aria-hidden="true" size={18} />
          <span className={styles['sr-only']}>Когда</span>
        </dt>
        <dd>
          <span>{timeLabel(startsAt, timezone, startsOn)}</span>
          <small>{timezoneLabel(timezone)}</small>
        </dd>
      </div>
      <div>
        <dt>
          <MapPin aria-hidden="true" size={18} />
          <span className={styles['sr-only']}>Где</span>
        </dt>
        <dd>{place || 'Место пока не выбрано'}</dd>
      </div>
    </dl>
  );
};

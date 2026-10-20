import styles from '@/entities/meeting/ui/MeetingFacts/MeetingFacts.module.css';
import { CalendarDays, MapPin } from 'lucide-react';
import { timeLabel, timezoneLabel } from '@/shared/lib/time';

export type MeetingFactsProps = {
  startsAt: string | null;
  timezone: string;
  place: string | null;
};

export const MeetingFacts = ({ startsAt, timezone, place }: MeetingFactsProps) => {
  return (
    <dl className={styles['meeting-facts']}>
      <div>
        <dt>
          <CalendarDays aria-hidden="true" size={18} />
          <span className={styles['sr-only']}>Когда</span>
        </dt>
        <dd>
          <span>{timeLabel(startsAt, timezone)}</span>
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

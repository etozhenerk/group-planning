import styles from '@/entities/meeting/ui/MeetingFacts/MeetingFacts.module.css';
import { Calendar, MapPin } from 'lucide-react';
import { timeLabel, timezoneLabel } from '@/shared/lib/time';
import { summaryTimeLabel } from '@/entities/meeting/ui/MeetingFacts/lib/summaryTimeLabel';

export type MeetingFactsProps = {
  startsAt: string | null;
  startsOn?: string | null;
  timezone: string;
  place: string | null;
  compact?: boolean;
  summary?: boolean;
};

export const MeetingFacts = ({
  startsAt,
  startsOn,
  timezone,
  place,
  compact = false,
  summary = false,
}: MeetingFactsProps) => {
  return (
    <dl
      className={[
        styles['meeting-facts'],
        compact ? styles.compact : '',
        summary ? styles.summary : '',
      ].join(' ')}
    >
      <div>
        <dt className={summary ? styles['sr-only'] : undefined}>
          <Calendar aria-hidden="true" size={18} />
          <span className={styles['sr-only']}>Когда</span>
        </dt>
        <dd>
          <span>
            {summary
              ? summaryTimeLabel(startsAt, timezone, startsOn)
              : timeLabel(startsAt, timezone, startsOn)}
          </span>
          {!summary && <small>{timezoneLabel(timezone)}</small>}
        </dd>
      </div>
      <div>
        <dt className={summary ? styles['sr-only'] : undefined}>
          <MapPin aria-hidden="true" size={18} />
          <span className={styles['sr-only']}>Где</span>
        </dt>
        <dd>{place || 'Место пока не выбрано'}</dd>
      </div>
    </dl>
  );
};

import type { FeedEntry } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { PlacePollCard } from '@/features/place-poll';
import styles from '@/widgets/conversation/ui/PlaceRecord/PlaceRecord.module.css';

export type PlaceRecordProps = { entry: FeedEntry; session: Session; id: string };

export const PlaceRecord = ({ entry, session, id }: PlaceRecordProps) => (
  <li className={styles.record} data-testid="feed-message">
    <PlacePollCard
      meeting={entry.meetingId}
      id={id}
      session={session}
      author={entry.actor.displayName}
      occurredAt={entry.occurredAt}
    />
  </li>
);

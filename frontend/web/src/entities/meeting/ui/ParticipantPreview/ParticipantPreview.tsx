import { Crown } from 'lucide-react';
import { Avatar } from '@/shared/ui/Avatar';
import type { MeetingSummary } from '@/entities/meeting/model/types';
import styles from '@/entities/meeting/ui/ParticipantPreview/ParticipantPreview.module.css';

export type ParticipantPreviewProps = { meeting: MeetingSummary };

export const ParticipantPreview = ({ meeting }: ParticipantPreviewProps) => (
  <div className={styles.people} aria-label={`Участников: ${meeting.participantCount}`}>
    {(meeting.participantPreview ?? []).slice(0, 3).map((person, index) => (
      <span
        className={styles.person}
        key={person.id}
        title={`${person.display_name}${person.id === meeting.organizerId ? ' · Организатор' : ''}`}
        aria-label={`${person.display_name}${person.id === meeting.organizerId ? ' · Организатор' : ''}`}
      >
        <Avatar
          name={person.display_name}
          src={person.avatar_url ?? null}
          size="small"
          tone={index === 0 ? 'sand' : index === 1 ? 'lilac' : 'mint'}
        />
        {person.id === meeting.organizerId && (
          <Crown className={styles.crown} size={13} aria-hidden="true" />
        )}
      </span>
    ))}
    {meeting.participantCount > Math.min(3, meeting.participantPreview?.length ?? 0) && (
      <span className={styles.remaining}>
        {meeting.participantPreview?.length
          ? `+${meeting.participantCount - Math.min(3, meeting.participantPreview.length)}`
          : `Участников: ${meeting.participantCount}`}
      </span>
    )}
  </div>
);

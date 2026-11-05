import type { MouseEventHandler } from 'react';
import { MeetingCover, MeetingFacts, useParticipants } from '@/entities/meeting';
import type { Meeting } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { designTokens } from '@/shared/config/design-tokens';
import { Avatar } from '@/shared/ui/Avatar';
import { ChatIcon } from '@/shared/ui/ChatIcon';
import { ParticipantList } from '@/widgets/meeting-details/ui/ParticipantList';
import styles from '@/widgets/meeting-details/ui/MobileDetails/MobileDetails.module.css';

export type MobileDetailsProps = {
  meeting: Meeting;
  session: Session;
  edit: MouseEventHandler<HTMLButtonElement>;
};

export const MobileDetails = ({ meeting, session, edit }: MobileDetailsProps) => {
  const people = useParticipants(meeting.id, session.user.id);
  const own = meeting.organizerId === session.user.id;
  const organizer = people.data?.find((person) => person.role === 'organizer')?.user;
  const person = own ? session.user : organizer;

  return (
    <div className={styles.body}>
      {meeting.coverUrl && (
        <div className={styles.cover}>
          <MeetingCover
            fill
            url={meeting.coverUrl}
            meeting={meeting.id}
            user={session.user.id}
          />
        </div>
      )}
      <div className={styles.heading}>
        <h2
          style={{ letterSpacing: Number(designTokens.componentMobileInfoTitleTracking) }}
        >
          {meeting.title}
        </h2>
        <div className={styles.organizer}>
          <Avatar
            name={person?.displayName ?? 'Организатор'}
            size="small"
            src={person?.avatarUrl ?? null}
          />
          <span>
            {own
              ? 'Вы организатор'
              : organizer
                ? `Организует ${organizer.displayName}`
                : 'Организатор встречи'}
          </span>
          {own && (
            <button type="button" onClick={edit} aria-label="Настройки встречи">
              <ChatIcon name="settings" />
            </button>
          )}
        </div>
      </div>
      <div className={styles.facts}>
        <MeetingFacts
          startsAt={meeting.startsAt}
          startsOn={meeting.startsOn ?? null}
          timezone={meeting.timezone}
          place={meeting.place}
        />
      </div>
      {meeting.description && <p className={styles.description}>{meeting.description}</p>}
      <div className={styles.company}>
        <ParticipantList meeting={meeting} user={session.user.id} compact={false} />
      </div>
    </div>
  );
};

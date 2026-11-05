import type { ReactNode } from 'react';
import { MeetingCover, MeetingFacts } from '@/entities/meeting';
import type { Invitation } from '@/entities/meeting';
import { Avatar } from '@/shared/ui/Avatar';
import { useMobileLayout } from '@/shared/lib/media';
import styles from '@/widgets/invitation/ui/InvitationDetails/InvitationDetails.module.css';

export type InvitationDetailsProps = { invitation: Invitation; closed: ReactNode };

export const InvitationDetails = ({ invitation, closed }: InvitationDetailsProps) => {
  const mobile = useMobileLayout();

  return (
    <>
      <p className={styles.eyebrow} data-mobile={mobile}>
        Приглашение на встречу
      </p>
      <h1 className={styles.title} data-mobile={mobile}>
        {invitation.title}
      </h1>
      {invitation.coverUrl && (
        <div className={styles.hero} data-mobile={mobile}>
          <MeetingCover
            url={invitation.coverUrl}
            meeting={invitation.meetingId}
            fill={mobile}
          />
        </div>
      )}
      {mobile && invitation.organizer && (
        <div className={styles.organizer}>
          <Avatar
            name={invitation.organizer.displayName}
            mobileSrc={invitation.organizer.avatarUrl ?? null}
            size="small"
            tone="lilac"
          />
          <span>
            Приглашает <strong>{invitation.organizer.displayName}</strong>
          </span>
        </div>
      )}
      {closed && <div className={styles.closed}>{closed}</div>}
      <div className={styles.facts} data-mobile={mobile}>
        <MeetingFacts
          startsAt={invitation.startsAt}
          startsOn={invitation.startsOn ?? null}
          timezone={invitation.timezone}
          place={invitation.place}
        />
      </div>
      {invitation.description && (
        <section
          className={styles.description}
          data-mobile={mobile}
          aria-label="Описание встречи"
        >
          <p>{invitation.description}</p>
        </section>
      )}
    </>
  );
};

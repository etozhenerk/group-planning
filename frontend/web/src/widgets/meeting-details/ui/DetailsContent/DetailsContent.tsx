import type { MouseEventHandler } from 'react';
import { useMobileLayout } from '@/shared/lib/media';
import { Link } from 'react-router';
import styles from '@/widgets/meeting-details/ui/DetailsContent/DetailsContent.module.css';
import type { Meeting } from '@/entities/meeting';
import { MeetingFacts, MeetingCover } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { ResponseButtons } from '@/features/respond';
import { ShareInvitation } from '@/features/share-invitation';
import { ParticipantList } from '@/widgets/meeting-details/ui/ParticipantList';
import { ChatIcon } from '@/shared/ui/ChatIcon';

export type DetailsContentProps = {
  meeting: Meeting;
  session: Session;
  close: () => void;
  edit: MouseEventHandler<HTMLButtonElement>;
  compact?: boolean;
  showAll?: () => void;
  share?: MouseEventHandler<HTMLButtonElement> | undefined;
};

export const DetailsContent = ({
  meeting,
  session,
  close,
  edit,
  compact = false,
  showAll,
  share,
}: DetailsContentProps) => {
  const mobile = useMobileLayout();

  return (
    <div
      className={[styles.stack, compact ? '' : styles.info].join(' ')}
      data-mobile={mobile}
    >
      {compact && meeting.coverUrl && (
        <div className={compact ? styles.cover : undefined}>
          <MeetingCover
            url={meeting.coverUrl}
            meeting={meeting.id}
            user={session.user.id}
            fill={compact}
          />
        </div>
      )}
      <MeetingFacts
        compact={compact}
        summary={!compact}
        startsAt={meeting.startsAt}
        startsOn={meeting.startsOn ?? null}
        timezone={meeting.timezone}
        place={meeting.place}
      />
      {meeting.description && (
        <p className={styles['meeting-description']}>{meeting.description}</p>
      )}
      <ParticipantList
        key={meeting.id}
        meeting={meeting}
        user={session.user.id}
        compact={compact}
        showAll={showAll}
      />
      {!compact && meeting.organizerId === session.user.id && (
        <ShareInvitation id={meeting.id} subtle onOpen={share} />
      )}
      {compact && meeting.period === 'past' && (
        <Link
          className={styles.memories}
          to={`/meetings/${meeting.id}/memories?from=chat`}
        >
          <ChatIcon name="photo" size={18} />
          Фото встречи
        </Link>
      )}
      {!compact &&
        (meeting.organizerId === session.user.id ? (
          <button className={styles.settings} type="button" onClick={edit}>
            {mobile && <ChatIcon name="settings" />}
            <span>{mobile ? 'Настройки встречи' : 'Изменить настройки'}</span>
            {mobile && <ChatIcon name="right" />}
          </button>
        ) : (
          <section className={styles.response}>
            <h3>Ваш ответ</h3>
            <ResponseButtons
              session={session}
              id={meeting.id}
              expected={meeting.myRsvpRevision}
              current={meeting.myRsvp}
              onSaved={close}
              inMeeting
            />
          </section>
        ))}
    </div>
  );
};

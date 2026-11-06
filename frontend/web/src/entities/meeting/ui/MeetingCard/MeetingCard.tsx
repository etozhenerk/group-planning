import { meetingAlbumPath } from '@/entities/meeting/ui/MeetingCard/lib/meetingAlbumPath';
import type { ReactNode } from 'react';
import { useMobileLayout } from '@/shared/lib/media';
import { UnreadIndicator } from '@/entities/meeting/ui/UnreadIndicator';
import { MeetingAlbumContent } from '@/entities/meeting/ui/MeetingAlbumContent';
import { MeetingCardCover } from '@/entities/meeting/ui/MeetingCardCover';
import { MeetingCardTitle } from '@/entities/meeting/ui/MeetingCardTitle';
import { ParticipantPreview } from '@/entities/meeting/ui/ParticipantPreview';
import { Link, useLocation } from 'react-router';
import { Images, MapPin, Sparkle } from 'lucide-react';
import type { MeetingSummary } from '@/entities/meeting/model/types';
import { cardLabels } from '@/entities/meeting/lib/cardLabels';
import styles from '@/entities/meeting/ui/MeetingCard/MeetingCard.module.css';

export type MeetingCardProps = {
  meeting: MeetingSummary;
  user: string;
  past?: boolean;
  coverPreview?: ReactNode;
};

export const MeetingCard = ({
  meeting,
  user,
  past = false,
  coverPreview,
}: MeetingCardProps) => {
  const location = useLocation();
  const mobile = useMobileLayout();
  const labels = cardLabels(meeting);
  const albumFallback = <Images size={18} aria-hidden="true" />;

  return (
    <article
      className={styles.card}
      data-testid="meeting-card"
      data-mobile={mobile}
      data-weekend={labels.weekend}
    >
      <Link className={styles.link} to={`/meetings/${meeting.id}`}>
        <time
          className={styles.date}
          title={labels.date}
          dateTime={meeting.startsAt ?? meeting.startsOn ?? undefined}
        >
          {labels.date}
        </time>
        {(meeting.coverUrl || coverPreview) && (
          <div className={styles.cover}>
            <MeetingCardCover
              url={meeting.coverUrl}
              meeting={meeting.id}
              user={user}
              preview={coverPreview}
            />
          </div>
        )}
        <div className={styles.info}>
          <div className={styles.titleRow}>
            <h2>
              <MeetingCardTitle
                title={meeting.title}
                own={meeting.organizerId === user}
              />
            </h2>
            {!mobile && <UnreadIndicator count={meeting.unreadCount} />}
          </div>
          <p>
            <MapPin size={14} aria-hidden="true" />
            {meeting.place || 'Место пока не выбрано'}
          </p>
          {labels.zone && <p>{labels.zone}</p>}
        </div>
        {mobile && (
          <UnreadIndicator count={meeting.unreadCount} variant="notice" flow={past} />
        )}
        {!mobile && (
          <Sparkle
            className={styles.sparkle}
            size={16}
            fill="currentColor"
            strokeWidth={0}
            aria-hidden="true"
          />
        )}
        <div className={styles.people}>
          <ParticipantPreview meeting={meeting} />
        </div>
      </Link>
      {past && (
        <Link
          className={styles.album}
          state={{ returnTo: location.pathname + location.search }}
          to={meetingAlbumPath(meeting)}
        >
          <MeetingAlbumContent meeting={meeting} user={user} fallback={albumFallback} />
        </Link>
      )}
    </article>
  );
};

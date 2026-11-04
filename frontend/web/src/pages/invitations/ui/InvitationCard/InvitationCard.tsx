import { invitationContext } from '@/pages/invitations/model/invitationContext';
import { useMobileLayout } from '@/shared/lib/media';
import { MeetingCover, cardLabels } from '@/entities/meeting';
import { Link } from 'react-router';
import { MapPin, Sparkle } from 'lucide-react';
import type { SavedInvitation } from '@/entities/meeting';
import styles from '@/pages/invitations/ui/InvitationCard/InvitationCard.module.css';

export type InvitationCardProps = { item: SavedInvitation };

export const InvitationCard = ({ item }: InvitationCardProps) => {
  const labels = cardLabels(item.preview);
  const mobile = useMobileLayout();

  return (
    <Link
      to={item.path}
      state={mobile ? invitationContext(item.preview.organizer) : undefined}
      className={styles.card}
      data-testid="saved-invitation"
      data-mobile={mobile}
      data-weekend={labels.weekend}
    >
      <time className={styles.date}>{labels.date}</time>
      {item.preview.coverUrl && (
        <div className={styles.cover}>
          <MeetingCover
            url={item.preview.coverUrl}
            meeting={item.preview.meetingId}
            fill
          />
        </div>
      )}
      <div className={styles.info}>
        <h2>{item.preview.title}</h2>
        <p>
          <MapPin size={14} aria-hidden="true" />
          {item.preview.place || 'Место пока не выбрано'}
        </p>
      </div>
      {item.preview.organizer && (
        <p className={styles.author}>Приглашает {item.preview.organizer.displayName}</p>
      )}
      {!mobile && (
        <Sparkle
          size={16}
          fill="currentColor"
          strokeWidth={0}
          className={styles.sparkle}
          aria-hidden="true"
        />
      )}
      <span className={styles.answer}>
        {mobile ? 'Изменить ответ →' : 'Ваш ответ: Возможно'}
      </span>
    </Link>
  );
};

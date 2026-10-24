import { Link } from 'react-router';
import { ArrowUpRight, Mail } from 'lucide-react';
import type { SavedInvitation } from '@/entities/meeting';
import { timeLabel } from '@/shared/lib/time';
import styles from '@/pages/invitations/ui/InvitationCard/InvitationCard.module.css';

export type InvitationCardProps = { item: SavedInvitation };

export const InvitationCard = ({ item }: InvitationCardProps) => (
  <Link to={item.path} className={styles.card} data-testid="saved-invitation">
    <div className={styles.icon}>
      <Mail size={28} aria-hidden="true" />
    </div>
    <div className={styles.info}>
      <h2>{item.preview.title}</h2>
      <p>
        {timeLabel(item.preview.startsAt, item.preview.timezone, item.preview.startsOn)}
      </p>
      {item.preview.place && <p>{item.preview.place}</p>}
      <p>Ваш ответ: Возможно</p>
    </div>
    <ArrowUpRight size={20} aria-hidden="true" />
  </Link>
);

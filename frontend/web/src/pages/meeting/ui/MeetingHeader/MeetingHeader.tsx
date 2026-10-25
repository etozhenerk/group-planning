import { Link } from 'react-router';
import { ChevronLeft, Ellipsis } from 'lucide-react';
import { ShareInvitation } from '@/features/share-invitation';
import styles from '@/pages/meeting/ui/MeetingHeader/MeetingHeader.module.css';

export type MeetingHeaderProps = {
  id: string;
  title: string;
  description: string;
  organizer: boolean;
  showDetails: () => void;
};

export const MeetingHeader = ({
  id,
  title,
  description,
  organizer,
  showDetails,
}: MeetingHeaderProps) => {
  return (
    <header className={styles['conversation-header']}>
      <Link
        to="/meetings"
        className={[styles.button, styles.icon, styles.ghost].join(' ')}
        aria-label="К моим встречам"
      >
        <ChevronLeft aria-hidden="true" size={20} />
      </Link>
      <div
        className={[styles['conversation-title'], styles.grow].join(' ')}
        data-testid="conversation-title"
      >
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {organizer && (
        <div className={styles['header-share']}>
          <ShareInvitation id={id} compact />
        </div>
      )}
      <button
        className={[styles.icon, styles.ghost].join(' ')}
        type="button"
        onClick={showDetails}
        aria-label="Информация о встрече"
      >
        <Ellipsis aria-hidden="true" size={20} />
      </button>
    </header>
  );
};

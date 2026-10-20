import { Link } from 'react-router';
import { ArrowLeft, Info } from 'lucide-react';
import { ShareInvitation } from '@/features/share-invitation';
import styles from '@/pages/meeting/ui/MeetingHeader/MeetingHeader.module.css';

export type MeetingHeaderProps = {
  id: string;
  title: string;
  organizer: boolean;
  wide: boolean;
  showDetails: () => void;
};

export const MeetingHeader = ({
  id,
  title,
  organizer,
  wide,
  showDetails,
}: MeetingHeaderProps) => {
  return (
    <header className={styles['conversation-header']}>
      <Link
        to="/meetings"
        className={[styles.button, styles.icon, styles.ghost].join(' ')}
        aria-label="К моим встречам"
      >
        <ArrowLeft aria-hidden="true" size={20} />
      </Link>
      <div
        className={[styles['conversation-title'], styles.grow].join(' ')}
        data-testid="conversation-title"
      >
        <h1>{title}</h1>
      </div>
      {organizer && (
        <div className={styles['header-share']}>
          <ShareInvitation id={id} compact />
        </div>
      )}
      {!wide && (
        <button
          className={[styles.icon, styles.ghost].join(' ')}
          type="button"
          onClick={showDetails}
          aria-label="Информация о встрече"
        >
          <Info aria-hidden="true" size={20} />
        </button>
      )}
    </header>
  );
};

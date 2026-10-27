import { ChatIcon } from '@/shared/ui/ChatIcon';
import { Link } from 'react-router';
import { ShareInvitation } from '@/features/share-invitation';
import styles from '@/pages/meeting/ui/MeetingHeader/MeetingHeader.module.css';
import type { RefObject } from 'react';
import { useChatLayout } from '@/shared/lib/media';
import { MeetingMobileHeading } from '@/pages/meeting/ui/MeetingMobileHeading';

export type MeetingHeaderProps = {
  id: string;
  title: string;
  description: string;
  organizer: boolean;
  showDetails: () => void;
  detailsTrigger: RefObject<HTMLButtonElement | null>;
};

export const MeetingHeader = ({
  id,
  title,
  description,
  organizer,
  showDetails,
  detailsTrigger,
}: MeetingHeaderProps) => {
  const layout = useChatLayout();

  return (
    <header
      className={styles['conversation-header']}
      data-mobile={layout.mobile}
      data-compact={layout.compact}
      data-narrow={layout.narrow}
    >
      <Link
        to="/meetings"
        className={[styles.button, styles.icon, styles.ghost].join(' ')}
        aria-label="К моим встречам"
      >
        <ChatIcon name="left" aria-hidden="true" size={20} />
      </Link>
      {layout.mobile ? (
        <MeetingMobileHeading
          title={title}
          description={description}
          narrow={layout.narrow}
          show={(opener) => {
            detailsTrigger.current = opener;
            showDetails();
          }}
        />
      ) : (
        <div
          className={[styles['conversation-title'], styles.grow].join(' ')}
          data-testid="conversation-title"
        >
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      )}
      {organizer && (
        <div className={styles['header-share']}>
          <ShareInvitation id={id} compact />
        </div>
      )}
      <button
        ref={detailsTrigger}
        className={[styles.icon, styles.ghost].join(' ')}
        type="button"
        onClick={(event) => {
          detailsTrigger.current = event.currentTarget;
          event.currentTarget.focus({ preventScroll: true });
          showDetails();
        }}
        aria-label="Информация о встрече"
        data-chat-surface-trigger
      >
        {layout.mobile ? (
          <ChatIcon name="info" aria-hidden="true" size={20} />
        ) : (
          <ChatIcon name="more" aria-hidden="true" size={20} />
        )}
      </button>
    </header>
  );
};

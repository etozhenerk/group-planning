import { Share } from 'lucide-react';
import { useNavigate } from 'react-router';
import styles from '@/features/share-invitation/ui/ShareInvitation/ShareInvitation.module.css';

export type ShareInvitationProps = { id: string; compact?: boolean; subtle?: boolean };

export const ShareInvitation = ({
  id,
  compact = false,
  subtle = false,
}: ShareInvitationProps) => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className={[
        styles['share-invitation-trigger'],
        compact ? styles.compact : '',
        subtle ? styles.subtle : '',
      ].join(' ')}
      onClick={() =>
        void navigate(`/meetings/${id}?action=share`, {
          state: { meetingAction: true },
          preventScrollReset: true,
        })
      }
      aria-label="Пригласить друзей"
    >
      <Share aria-hidden="true" size={20} />
      <span className={styles['trigger-label']}>Пригласить друзей</span>
    </button>
  );
};

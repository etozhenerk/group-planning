import { ChatIcon } from '@/shared/ui/ChatIcon';
import type { MouseEventHandler } from 'react';
import { useMobileLayout } from '@/shared/lib/media';
import { useLocation, useNavigate } from 'react-router';
import styles from '@/features/share-invitation/ui/ShareInvitation/ShareInvitation.module.css';

export type ShareInvitationProps = {
  id: string;
  compact?: boolean;
  subtle?: boolean;
  onOpen?: MouseEventHandler<HTMLButtonElement> | undefined;
};

export const ShareInvitation = ({
  id,
  compact = false,
  subtle = false,
  onOpen,
}: ShareInvitationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const state: unknown = location.state;
  const panel =
    state && typeof state === 'object' && 'somewherePanel' in state
      ? state.somewherePanel
      : null;

  const replacesPanel =
    !!panel &&
    typeof panel === 'object' &&
    'owner' in panel &&
    typeof panel.owner === 'string' &&
    panel.owner.startsWith('conversation:');

  const mobile = useMobileLayout();

  return (
    <button
      type="button"
      className={[
        styles['share-invitation-trigger'],
        compact ? styles.compact : '',
        subtle ? styles.subtle : '',
      ].join(' ')}
      data-mobile={mobile}
      data-chat-surface-trigger
      onClick={(event) => {
        event.currentTarget.focus({ preventScroll: true });

        if (onOpen) {
          onOpen(event);
        } else {
          void navigate(`/meetings/${id}?action=share`, {
            state: { meetingAction: true },
            replace: replacesPanel,
            preventScrollReset: true,
          });
        }
      }}
      aria-label="Пригласить друзей"
    >
      <ChatIcon name="share" aria-hidden="true" size={20} />
      <span className={styles['trigger-label']}>Пригласить друзей</span>
      {subtle && mobile && <ChatIcon name="right" aria-hidden="true" />}
    </button>
  );
};

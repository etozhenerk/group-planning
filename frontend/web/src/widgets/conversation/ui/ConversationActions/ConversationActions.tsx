import { ChatIcon } from '@/shared/ui/ChatIcon';
import { useNavigate } from 'react-router';
import { ActionMenu } from '@/widgets/conversation/ui/ActionMenu';
import { useMeeting } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import type { ConversationActionKind } from '@/widgets/conversation/model/actionKind';
import { useActionMenu } from '@/widgets/conversation/ui/ConversationActions/hooks/useActionMenu';
import styles from '@/widgets/conversation/ui/ConversationActions/ConversationActions.module.css';

export type ConversationActionsProps = {
  id: string;
  session: Session;
  menu: boolean;
  toggle: () => void;
  close: () => void;
};

export const ConversationActions = ({
  id,
  session,
  menu,
  toggle,
  close,
}: ConversationActionsProps) => {
  const navigate = useNavigate();
  const meeting = useMeeting(id, session.user.id);
  const ref = useActionMenu(menu, close);
  const select = (value: ConversationActionKind) => {
    ref.current?.querySelector('button')?.focus({ preventScroll: true });
    void navigate(`/meetings/${id}?action=${value}`, {
      state: { meetingAction: true },
      replace: menu,
      preventScrollReset: true,
    });
  };

  if (meeting.access.denied) {
    return null;
  }

  return (
    <div className={styles.wrapper} ref={ref}>
      <button
        type="button"
        className={styles.add}
        aria-label="Добавить к встрече"
        aria-expanded={menu}
        data-chat-surface-trigger
        onClick={toggle}
      >
        <ChatIcon name="plus" size={24} aria-hidden="true" />
      </button>
      <ActionMenu open={menu} select={select} />
    </div>
  );
};

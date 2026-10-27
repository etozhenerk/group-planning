import { ChatIcon } from '@/shared/ui/ChatIcon';
import { useFilePicker } from '@/shared/lib/file-picker';
import { useRef } from 'react';
import { useNavigate } from 'react-router';
import { ActionMenu } from '@/widgets/conversation/ui/ActionMenu';
import { useMeeting } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { useUploadSelection } from '@/features/upload-media';
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
  const photo = useRef(false);
  const navigate = useNavigate();
  const upload = useUploadSelection(session.user.id, id);
  const picker = useFilePicker((files) =>
    upload.begin({
      files,
      photo: photo.current,
      purpose: 'message',
    }),
  );

  const meeting = useMeeting(id, session.user.id);
  const ref = useActionMenu(menu, close);
  const select = (value: ConversationActionKind) => {
    ref.current?.querySelector('button')?.focus({ preventScroll: true });
    photo.current = value === 'photo';

    if (value === 'photo' || value === 'file') {
      void navigate(`/meetings/${id}?action=${value}`, {
        state: { meetingAction: true },
        replace: menu,
        preventScrollReset: true,
      });

      if (!upload.selection || upload.selection.photo !== (value === 'photo')) {
        picker.choose(value === 'photo');
      }
    } else {
      void navigate(`/meetings/${id}?action=${value}`, {
        state: { meetingAction: true },
        replace: menu,
        preventScrollReset: true,
      });
    }
  };

  if (meeting.access.denied) {
    return null;
  }

  return (
    <div className={styles.wrapper} ref={ref}>
      <input {...picker.inputProps} />
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

import { useFilePicker } from '@/shared/lib/file-picker';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus } from 'lucide-react';
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
  const [kind, setKind] = useState<ConversationActionKind>('menu');
  const navigate = useNavigate();
  const upload = useUploadSelection(session.user.id, id);
  const picker = useFilePicker((files) =>
    upload.begin({
      files,
      photo: kind === 'photo',
      purpose: 'message',
      returnTo: `/meetings/${id}`,
    }),
  );

  const meeting = useMeeting(id, session.user.id);
  const ref = useActionMenu(menu, close);
  const select = (value: ConversationActionKind) => {
    ref.current?.querySelector('button')?.focus({ preventScroll: true });
    setKind(value);

    if (value === 'photo' || value === 'file') {
      picker.choose(value === 'photo');
    } else {
      void navigate(`/meetings/${id}?action=${value}`, {
        state: { meetingAction: true },
      });
    }

    close();
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
        onClick={toggle}
      >
        <Plus size={24} aria-hidden="true" />
      </button>
      {menu && <ActionMenu select={select} />}
    </div>
  );
};

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useMeeting } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { ConversationActionForms } from '@/widgets/conversation/ui/ConversationActionForms';
import { actionTitle } from '@/widgets/conversation/model/actionKind';
import type { ConversationActionKind } from '@/widgets/conversation/model/actionKind';
import { Dialog } from '@/shared/ui/Dialog';
import { SkeletonDetails } from '@/shared/ui/SkeletonDetails';
import { Status } from '@/shared/ui/Status';
import styles from '@/widgets/conversation/ui/ConversationActions/ConversationActions.module.css';

export type ConversationActionsProps = { id: string; session: Session };

export const ConversationActions = ({ id, session }: ConversationActionsProps) => {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<ConversationActionKind>('menu');
  const meeting = useMeeting(id, session.user.id);

  if (meeting.access.denied) {
    return null;
  }

  const done = () => {
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className={styles.add}
        aria-label="Добавить к встрече"
        onClick={() => {
          setKind('menu');
          setOpen(true);
        }}
      >
        <Plus size={24} aria-hidden="true" />
      </button>
      <Dialog
        open={open}
        title={actionTitle(kind)}
        contained
        onClose={() => setOpen(false)}
      >
        <div className={styles.actions} hidden={kind !== 'menu'}>
          <button type="button" onClick={() => setKind('date')}>
            Предложить дату
          </button>
          <button type="button" onClick={() => setKind('place')}>
            Предложить место
          </button>
          <button type="button" onClick={() => setKind('task')}>
            Предложить задачу
          </button>
        </div>
        {meeting.data ? (
          <ConversationActionForms
            kind={kind}
            open={open}
            meeting={meeting.data}
            session={session}
            done={done}
          />
        ) : kind !== 'menu' ? (
          meeting.error ? (
            <Status
              title="Не удалось загрузить встречу"
              error
              action={() => void meeting.refetch()}
            />
          ) : (
            <SkeletonDetails label="Загрузка формы" fields />
          )
        ) : null}
      </Dialog>
    </>
  );
};

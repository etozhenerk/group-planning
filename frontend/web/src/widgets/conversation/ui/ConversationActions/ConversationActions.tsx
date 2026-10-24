import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useMeeting } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { PollCreateForm } from '@/features/date-poll';
import { PlacePollForm } from '@/features/place-poll';
import { Dialog } from '@/shared/ui/Dialog';
import { SkeletonDetails } from '@/shared/ui/SkeletonDetails';
import { Status } from '@/shared/ui/Status';
import styles from '@/widgets/conversation/ui/ConversationActions/ConversationActions.module.css';

export type ConversationActionsProps = { id: string; session: Session };

export const ConversationActions = ({ id, session }: ConversationActionsProps) => {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<'menu' | 'date' | 'place'>('menu');
  const [generation, setGeneration] = useState(0);
  const meeting = useMeeting(id, session.user.id);

  if (meeting.access.denied) {
    return null;
  }

  const done = () => {
    setOpen(false);
    setGeneration((value) => value + 1);
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
        title={
          kind === 'date'
            ? 'Новая дата встречи'
            : kind === 'place'
              ? 'Предложить место'
              : 'Добавить к встрече'
        }
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
        </div>
        {meeting.data ? (
          <>
            <div className={styles.form} hidden={kind !== 'date'}>
              <PollCreateForm
                key={`date-${generation}`}
                meeting={meeting.data}
                session={session}
                done={done}
              />
            </div>
            <div className={styles.form} hidden={kind !== 'place'}>
              <PlacePollForm
                key={`place-${generation}`}
                meeting={meeting.data}
                session={session}
                done={done}
              />
            </div>
          </>
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

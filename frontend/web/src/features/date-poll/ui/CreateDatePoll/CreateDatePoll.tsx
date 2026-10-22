import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useMeeting } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { Dialog } from '@/shared/ui/Dialog';
import { Status } from '@/shared/ui/Status';
import { PollCreateForm } from '@/features/date-poll/ui/PollCreateForm';
import styles from '@/features/date-poll/ui/CreateDatePoll/CreateDatePoll.module.css';

export type CreateDatePollProps = { id: string; session: Session };

export const CreateDatePoll = ({ id, session }: CreateDatePollProps) => {
  const [open, setOpen] = useState(false);
  const [generation, setGeneration] = useState(0);
  const meeting = useMeeting(id, session.user.id);

  if (meeting.access.denied) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className={styles['add']}
        aria-label="Добавить опрос даты"
        onClick={() => setOpen(true)}
      >
        <Plus size={24} aria-hidden="true" />
      </button>
      <Dialog open={open} title="Предложить другую дату" onClose={() => setOpen(false)}>
        {meeting.data ? (
          <PollCreateForm
            key={generation}
            meeting={meeting.data}
            session={session}
            done={() => {
              setOpen(false);
              setGeneration((value) => value + 1);
            }}
          />
        ) : meeting.error ? (
          <Status
            title="Не удалось загрузить встречу"
            error
            action={() => void meeting.refetch()}
          />
        ) : (
          <Status title="Загружаем встречу…" />
        )}
      </Dialog>
    </>
  );
};

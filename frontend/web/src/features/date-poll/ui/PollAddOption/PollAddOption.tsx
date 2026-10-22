import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { DatePoll } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { DateInput } from '@/shared/ui/DateInput';
import { validDay } from '@/shared/lib/time';
import { usePollAction } from '@/features/date-poll/model/usePollAction';
import { pollError } from '@/features/date-poll/model/pollCopy';
import styles from '@/features/date-poll/ui/PollAddOption/PollAddOption.module.css';

export type PollAddOptionProps = { poll: DatePoll; session: Session; zone: string };

export const PollAddOption = ({ poll, session, zone }: PollAddOptionProps) => {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState('');
  const action = usePollAction(poll.meetingId, poll.id, session);

  if (!poll.canAddOptions) {
    return null;
  }

  return (
    <div className={styles['add']}>
      <button
        type="button"
        className={styles['toggle']}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <Plus size={18} aria-hidden="true" />
        Предложить дату
      </button>
      {open && (
        <div className={styles['form']}>
          <DateInput
            value={date}
            timezone={zone}
            onChange={setDate}
            disabled={action.isPending}
          />
          <button
            type="button"
            disabled={!validDay(date) || action.isPending}
            onClick={() =>
              action.mutate(
                { kind: 'options', date, revision: poll.revision },
                {
                  onSuccess: () => {
                    setOpen(false);
                    setDate('');
                  },
                },
              )
            }
          >
            Добавить
          </button>
        </div>
      )}
      {action.error && (
        <p className={styles['error']} role="alert">
          {pollError(action.error)}
        </p>
      )}
    </div>
  );
};

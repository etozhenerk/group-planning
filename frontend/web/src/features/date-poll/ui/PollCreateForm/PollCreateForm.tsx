import { ButtonSpinner } from '@/shared/ui/ButtonSpinner';
import type { Meeting } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { usePollForm } from '@/features/date-poll/model/usePollForm';
import { PollDatesFields } from '@/features/date-poll/ui/PollDatesFields';
import { PollDeadline } from '@/entities/meeting';
import { PollSettingsFields } from '@/features/date-poll/ui/PollSettingsFields';
import { usePollViewport } from '@/features/date-poll/ui/PollCreateForm/hooks/usePollViewport';
import styles from '@/features/date-poll/ui/PollCreateForm/PollCreateForm.module.css';

export type PollCreateFormProps = {
  meeting: Meeting;
  session: Session;
  done: () => void;
};

export const PollCreateForm = ({ meeting, session, done }: PollCreateFormProps) => {
  const form = usePollForm(meeting, session, done);
  const scroll = usePollViewport(form.attempt);

  return (
    <form onSubmit={form.submit} className={styles['form']}>
      <div
        className={styles['body']}
        ref={scroll.viewport}
        onScroll={scroll.update}
        data-testid="poll-form-scroll"
      >
        <div ref={scroll.content}>
          <PollDatesFields
            dates={form.dates}
            errors={form.dateErrors}
            zone={meeting.timezone}
            change={form.changeDate}
            add={form.add}
            remove={form.remove}
            disabled={form.pending}
          />
          <PollDeadline
            value={form.deadline}
            onChange={form.setDeadline}
            zone={meeting.timezone}
            choice={form.choice}
            onChoice={form.setChoice}
            ambiguous={form.problem.includes('дважды')}
            disabled={form.pending}
          />
          <PollSettingsFields
            value={form.settings}
            onChange={form.changeSetting}
            disabled={form.pending}
          />
        </div>
      </div>
      <div
        className={[styles['footer'], scroll.hasMore ? styles['overflowing'] : '']
          .filter(Boolean)
          .join(' ')}
        data-testid="poll-form-footer"
      >
        {form.problem && (
          <p role="alert" className={styles['error']}>
            {form.problem}
          </p>
        )}
        <button
          type="submit"
          disabled={form.pending}
          aria-busy={form.pending}
          aria-label="Создать опрос"
        >
          {form.pending ? <ButtonSpinner /> : 'Создать опрос'}
        </button>
      </div>
    </form>
  );
};

import type { Meeting } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { usePollForm } from '@/features/date-poll/model/usePollForm';
import { PollDatesFields } from '@/features/date-poll/ui/PollDatesFields';
import { PollDeadline } from '@/features/date-poll/ui/PollDeadline';
import { PollSettingsFields } from '@/features/date-poll/ui/PollSettingsFields';
import styles from '@/features/date-poll/ui/PollCreateForm/PollCreateForm.module.css';

export type PollCreateFormProps = {
  meeting: Meeting;
  session: Session;
  done: () => void;
};

export const PollCreateForm = ({ meeting, session, done }: PollCreateFormProps) => {
  const form = usePollForm(meeting, session, done);

  return (
    <form onSubmit={form.submit} className={styles['form']}>
      <p className={styles['intro']}>
        Предложите даты, которые вам подходят. Большинство выберет день встречи.
      </p>
      <PollDatesFields
        dates={form.dates}
        zone={meeting.timezone}
        change={form.changeDate}
        add={form.add}
        remove={form.remove}
        disabled={form.pending}
      />
      <PollSettingsFields
        value={form.settings}
        onChange={form.changeSetting}
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
      {form.problem && (
        <p role="alert" className={styles['error']}>
          {form.problem}
        </p>
      )}
      <div className={styles['footer']}>
        <button type="submit" disabled={form.pending}>
          {form.pending ? 'Публикуем…' : 'Создать опрос'}
        </button>
      </div>
    </form>
  );
};

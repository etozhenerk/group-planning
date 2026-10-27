import { useMobileLayout } from '@/shared/lib/media';
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
  const mobile = useMobileLayout();
  const form = usePollForm(meeting, session, done);
  const scroll = usePollViewport(form.attempt);

  const settings = (
    <PollSettingsFields
      value={form.settings}
      onChange={form.changeSetting}
      disabled={form.locked}
    />
  );

  return (
    <form onSubmit={form.submit} className={styles['form']} data-mobile={mobile}>
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
            disabled={form.locked}
          />
          {mobile && settings}
          <PollDeadline
            value={form.deadline}
            onChange={form.setDeadline}
            zone={meeting.timezone}
            choice={form.choice}
            onChoice={form.setChoice}
            ambiguous={form.problem.includes('дважды')}
            disabled={form.locked}
          />
          {!mobile && settings}
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
          aria-label={form.uncertain ? 'Повторить отправку' : 'Создать опрос'}
        >
          {form.pending ? (
            <ButtonSpinner />
          ) : form.uncertain ? (
            'Повторить отправку'
          ) : (
            'Создать опрос'
          )}
        </button>
      </div>
    </form>
  );
};

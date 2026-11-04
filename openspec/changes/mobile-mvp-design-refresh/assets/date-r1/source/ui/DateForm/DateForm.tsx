import type { Meeting } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { PollDatesFields } from '@/features/date-poll/ui/PollDatesFields';
import { PollSettingsFields } from '@/features/date-poll/ui/PollSettingsFields';
import { ButtonSpinner } from '@/shared/ui/ButtonSpinner';
import { usePollForm } from '@/features/date-poll/model/usePollForm';
import { useChatModel } from '@preview/ChatContext';
import { FormFeedback } from '@preview/ui/FormFeedback';
import { DeadlineFields } from '@preview/ui/DeadlineFields';
import { ExitGuard } from '@preview/ui/ExitGuard';
import styles from '@preview/ui/DateForm/DateForm.module.css';
export type DateFormProps = { meeting: Meeting; session: Session; done: () => void };
export const DateForm = ({ meeting, session, done }: DateFormProps) => {
  const f = usePollForm(meeting, session, done),
    m = useChatModel();
  if (m.formGuard) {
    return <ExitGuard stay={f.stay} leave={f.leave} />;
  }
  return (
    <form noValidate className={styles.form} onSubmit={f.submit}>
      <div className={styles.body} data-testid="date-form-scroll">
        <p className={styles.legend}><span aria-hidden="true">*</span> Обязательные поля</p><PollDatesFields
          dates={f.dates}
          errors={f.dateErrors}
          zone={meeting.timezone}
          change={f.changeDate}
          add={f.add}
          remove={f.remove}
          disabled={f.locked}
        />
        <PollSettingsFields
          value={f.settings}
          onChange={f.changeSetting}
          disabled={f.locked}
        />
        <DeadlineFields
          value={f.deadline}
          change={f.setDeadline}
          zone={meeting.timezone}
          choice={f.choice}
          choose={f.setChoice}
          errors={f.deadlineErrors}
          disabled={f.locked}
        />
      </div>
      <div className={styles.footer} data-testid="date-form-footer">
        <FormFeedback problem={f.problem} />
        <button
          type="submit"
          disabled={f.pending}
          aria-busy={f.pending}
          aria-label={
            f.uncertain
              ? 'Повторить отправку'
              : f.problem === 'error'
                ? 'Попробовать снова'
                : 'Создать опрос'
          }
        >
          {f.pending ? (
            <ButtonSpinner />
          ) : f.uncertain ? (
            'Повторить отправку'
          ) : f.problem === 'error' ? (
            'Попробовать снова'
          ) : (
            'Создать опрос'
          )}
        </button>
      </div>
    </form>
  );
};

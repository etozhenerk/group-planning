import { PollDeadline } from '@/entities/meeting';
import type { Meeting } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { ButtonSpinner } from '@/shared/ui/ButtonSpinner';
import { usePlaceForm } from '@/features/place-poll/model/usePlaceForm';
import styles from '@/features/place-poll/ui/PlacePollForm/PlacePollForm.module.css';

export type PlacePollFormProps = { meeting: Meeting; session: Session; done: () => void };

export const PlacePollForm = ({ meeting, session, done }: PlacePollFormProps) => {
  const form = usePlaceForm(meeting, session, done);

  return (
    <form onSubmit={form.submit} className={styles.form}>
      <div className={styles.body}>
        <label className={styles.field}>
          Новое место
          <input
            value={form.place}
            onChange={(event) => form.setPlace(event.target.value)}
            disabled={form.locked}
            required
          />
        </label>
        <label className={styles.field}>
          Почему здесь
          <textarea
            value={form.explanation}
            onChange={(event) => form.setExplanation(event.target.value)}
            disabled={form.locked}
            rows={3}
          />
        </label>
        <PollDeadline
          value={form.deadline}
          onChange={form.setDeadline}
          zone={meeting.timezone}
          choice={form.choice}
          onChoice={form.setChoice}
          ambiguous={form.problem.includes('дважды')}
          disabled={form.locked}
        />
      </div>
      <div className={styles.footer}>
        {form.problem && (
          <p role="alert" className={styles.error}>
            {form.problem}
          </p>
        )}
        <button
          type="submit"
          disabled={form.pending}
          aria-busy={form.pending}
          aria-label={form.uncertain ? 'Повторить отправку' : 'Предложить место'}
        >
          {form.pending ? (
            <ButtonSpinner />
          ) : form.uncertain ? (
            'Повторить отправку'
          ) : (
            'Предложить место'
          )}
        </button>
      </div>
    </form>
  );
};

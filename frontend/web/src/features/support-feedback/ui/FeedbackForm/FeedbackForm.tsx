import { Link } from 'react-router';
import { CheckCircle2 } from 'lucide-react';
import { useFeedback } from '@/features/support-feedback/model/useFeedback';
import type {
  FeedbackKind,
  FeedbackScreen,
} from '@/features/support-feedback/model/types';
import { FeedbackFields } from '@/features/support-feedback/ui/FeedbackFields';
import { FeedbackScreenshot } from '@/features/support-feedback/ui/FeedbackScreenshot';
import styles from '@/features/support-feedback/ui/FeedbackForm/FeedbackForm.module.css';

export type FeedbackFormProps = { kind: FeedbackKind; screen: FeedbackScreen };

export const FeedbackForm = ({ kind, screen }: FeedbackFormProps) => {
  const form = useFeedback(kind, screen);

  if (form.mutation.data) {
    return (
      <div className={styles.success} role="status">
        <CheckCircle2 size={36} />
        <h2>Обращение принято</h2>
        <p>Номер {form.mutation.data.reference}</p>
        <Link to="/meetings">К встречам</Link>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={form.submit} ref={form.formRef}>
      <fieldset disabled={form.mutation.isPending} className={styles.fields}>
        <FeedbackFields form={form} />
        <FeedbackScreenshot
          value={form.screenshot}
          error={form.fileError}
          reading={form.reading}
          choose={form.choose}
          remove={() => form.setScreenshot(null)}
        />
        <label className={styles.diagnostics}>
          <input
            type="checkbox"
            checked={form.diagnostics}
            onChange={(event) => form.setDiagnostics(event.target.checked)}
          />
          <span>
            Добавить сведения об устройстве
            <small>Версия приложения, браузер и размер экрана</small>
          </span>
        </label>
      </fieldset>
      {form.mutation.error && (
        <p role="alert" className={styles.error}>
          Не удалось отправить обращение. Проверьте поля или попробуйте ещё раз.
        </p>
      )}
      <button
        type="submit"
        className={styles.submit}
        disabled={
          form.mutation.isPending || form.reading || form.description.trim().length < 10
        }
        aria-busy={form.mutation.isPending}
      >
        {form.mutation.isPending ? 'Отправка…' : 'Отправить сообщение ↗'}
      </button>
      <p className={styles.policy}>
        <Link to="/privacy">Политика конфиденциальности</Link>
      </p>
    </form>
  );
};

import { RequiredLegend } from '@/shared/ui/RequiredLegend';
import { RequiredMark } from '@/shared/ui/RequiredMark';
import type { useFeedback } from '@/features/support-feedback/model/useFeedback';
import { screenOptions } from '@/features/support-feedback/model/types';
import type {
  FeedbackKind,
  FeedbackScreen,
} from '@/features/support-feedback/model/types';
import styles from '@/features/support-feedback/ui/FeedbackFields/FeedbackFields.module.css';

export type FeedbackFieldsProps = { form: ReturnType<typeof useFeedback> };

export const FeedbackFields = ({ form }: FeedbackFieldsProps) => (
  <div className={styles.fields}>
    <RequiredLegend />
    <fieldset className={styles.kinds}>
      <legend>Тема обращения</legend>
      {Object.entries({ problem: 'Проблема', idea: 'Идея', question: 'Вопрос' }).map(
        ([kind, label]) => (
          <label key={kind}>
            <input
              type="radio"
              name="kind"
              value={kind}
              checked={form.kind === kind}
              onChange={() => form.setKind(kind as FeedbackKind)}
            />
            <span>{label}</span>
          </label>
        ),
      )}
    </fieldset>
    <label className={styles.field}>
      Ваше сообщение <RequiredMark />
      <textarea
        name="description"
        aria-required="true"
        aria-invalid={!!form.descriptionError}
        aria-describedby={form.descriptionError ? 'support-description-error' : undefined}
        value={form.description}
        onChange={(event) => form.setDescription(event.target.value)}
        placeholder="Что вы делали и что пошло не так"
      />
    </label>
    {form.descriptionError && (
      <p role="alert" id="support-description-error">
        {form.descriptionError}
      </p>
    )}
    <div className={styles.pair}>
      <label className={styles.field}>
        Раздел
        <select
          value={form.screen}
          onChange={(event) => form.setScreen(event.target.value as FeedbackScreen)}
        >
          {Object.entries(screenOptions).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.field}>
        Почта для ответа<span className={styles.optional}>Необязательно</span>
        <input
          aria-label="Почта для ответа"
          name="email"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          maxLength={254}
          onChange={(event) => form.setEmail(event.target.value)}
          autoComplete="email"
        />
      </label>
    </div>
    {form.fields.email && <p role="alert">Проверьте адрес почты.</p>}
  </div>
);

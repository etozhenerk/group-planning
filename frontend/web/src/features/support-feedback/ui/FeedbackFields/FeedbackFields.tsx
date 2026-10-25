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
      Ваше сообщение
      <textarea
        name="description"
        required
        minLength={10}
        maxLength={3000}
        value={form.description}
        onChange={(event) => form.setDescription(event.target.value)}
        placeholder="Что вы делали и что пошло не так"
      />
    </label>
    {form.fields.description && (
      <p role="alert">Добавьте описание — хотя бы 10 символов.</p>
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

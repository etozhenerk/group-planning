import type { useFeedback } from '@/features/support-feedback/model/useFeedback';
import { MobileFeedbackSection } from '@/features/support-feedback/ui/MobileFeedbackSection/MobileFeedbackSection';
import type { FeedbackKind } from '@/features/support-feedback/model/types';
import styles from '@/features/support-feedback/ui/MobileFeedbackFields/MobileFeedbackFields.module.css';

export type MobileFeedbackFieldsProps = { model: ReturnType<typeof useFeedback> };

export const MobileFeedbackFields = ({ model: m }: MobileFeedbackFieldsProps) => (
  <div className={styles.fields}>
    <fieldset className={styles.kinds}>
      <legend>Тема</legend>
      <div>
        {Object.entries({
          problem: 'Проблема',
          question: 'Вопрос',
          idea: 'Идея',
        }).map(([key, label]) => (
          <label key={key}>
            <input
              type="radio"
              name="kind"
              checked={m.kind === key}
              onChange={() => m.setKind(key as FeedbackKind)}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
    <label className={styles.field}>
      Сообщение{' '}
      <span className={styles.required} aria-hidden="true">
        *
      </span>
      <textarea
        name="description"
        value={m.description}
        onChange={(e) => m.setDescription(e.target.value)}
        aria-required="true"
        aria-invalid={!!m.descriptionError}
        aria-describedby={m.descriptionError ? 'description-error' : 'description-hint'}
        placeholder={
          m.kind === 'problem'
            ? 'Что вы делали и что пошло не так'
            : m.kind === 'idea'
              ? 'Что вы хотите предложить'
              : 'О чём хотите спросить'
        }
      />
    </label>
    {m.descriptionError ? (
      <p id="description-error" role="alert" className={styles.error}>
        {m.descriptionError}
      </p>
    ) : (
      <p id="description-hint" className={styles.hint}>
        От 10 до 3000 символов
      </p>
    )}
    <MobileFeedbackSection model={m} />
    <label className={styles.field}>
      Почта для ответа
      <input
        name="email"
        type="email"
        value={m.email}
        onChange={(e) => m.setEmail(e.target.value)}
        autoComplete="email"
        placeholder="mail@example.com"
        maxLength={254}
        aria-invalid={!!m.emailProblem}
        aria-describedby={m.emailProblem ? 'email-error' : 'email-hint'}
      />
    </label>
    {m.emailProblem ? (
      <p id="email-error" className={styles.error} role="alert">
        {m.emailProblem}
      </p>
    ) : (
      <p id="email-hint" className={styles.hint}>
        Оставьте почту, если нужен ответ
      </p>
    )}
  </div>
);

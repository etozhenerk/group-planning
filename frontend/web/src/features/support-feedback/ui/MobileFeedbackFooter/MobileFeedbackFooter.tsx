import { TriangleAlert } from 'lucide-react';
import { ButtonSpinner } from '@/shared/ui/ButtonSpinner';
import type { useFeedback } from '@/features/support-feedback/model/useFeedback';
import styles from '@/features/support-feedback/ui/MobileFeedbackFooter/MobileFeedbackFooter.module.css';

export type MobileFeedbackFooterProps = {
  model: ReturnType<typeof useFeedback>;
  pinned: boolean;
};

export const MobileFeedbackFooter = ({ model: m, pinned }: MobileFeedbackFooterProps) => (
  <div className={styles.footer} data-pinned={pinned}>
    {m.mutation.error && (
      <div className={styles.error} role="alert">
        <TriangleAlert aria-hidden="true" />
        <span>
          <strong>
            {m.frozen ? 'Отправка не подтверждена' : 'Не удалось отправить обращение'}
          </strong>
          <small>Текст и скриншот сохранены. Повторите отправку.</small>
        </span>
      </div>
    )}
    <button
      type="submit"
      disabled={m.mutation.isPending || m.reading}
      aria-busy={m.mutation.isPending}
    >
      {m.mutation.isPending && <ButtonSpinner />}
      {m.mutation.isPending
        ? 'Отправляем…'
        : m.mutation.error
          ? 'Повторить отправку'
          : 'Отправить обращение'}
    </button>
  </div>
);

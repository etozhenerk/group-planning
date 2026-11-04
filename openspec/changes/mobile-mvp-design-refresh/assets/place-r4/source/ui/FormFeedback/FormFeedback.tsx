import { TriangleAlert } from 'lucide-react';
import styles from '@preview/ui/FormFeedback/FormFeedback.module.css';
export type FormFeedbackProps = { problem: string };
export const FormFeedback = ({ problem }: FormFeedbackProps) => {
  if (!problem) {
    return null;
  }
  return (
    <div className={styles.notice} role="alert">
      <span className={styles.icon}>
        <TriangleAlert size={18} />
      </span>
      <div className={styles.copy}>
        <strong>
          {problem === 'error'
            ? 'Не удалось создать опрос'
            : problem === 'uncertain'
              ? 'Создание опроса не подтверждено'
              : problem}
        </strong>
        {['error', 'uncertain'].includes(problem) && (
          <span>
            {problem === 'error'
              ? 'Место и пояснение остались в форме.'
              : 'Повторите отправку — данные менять не нужно.'}
          </span>
        )}
      </div>
    </div>
  );
};

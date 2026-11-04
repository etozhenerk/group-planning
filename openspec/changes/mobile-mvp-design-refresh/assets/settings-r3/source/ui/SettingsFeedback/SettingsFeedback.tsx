import { TriangleAlert } from 'lucide-react';
import styles from '@preview/ui/SettingsFeedback/SettingsFeedback.module.css';
export type SettingsFeedbackProps = { problem: string };
export const SettingsFeedback = ({ problem }: SettingsFeedbackProps) => {
  if (!problem) {
    return null;
  }
  const title =
    problem === 'error'
      ? 'Не удалось сохранить'
      : problem === 'uncertain'
        ? 'Сохранение не подтверждено'
        : problem === 'conflict'
          ? 'Встреча изменилась'
          : problem;
  const text =
    problem === 'error'
      ? 'Ваши правки остались в форме.'
      : problem === 'uncertain'
        ? 'Повторите отправку — данные менять не нужно.'
        : problem === 'conflict'
          ? 'Проверьте обновлённые данные.'
          : '';
  return (
    <div className={styles.notice} role="alert">
      <span className={styles.icon}>
        <TriangleAlert size={18} strokeWidth={1.7} />
      </span>
      <div className={styles.copy}>
        <strong>{title}</strong>
        {text && <span>{text}</span>}
      </div>
    </div>
  );
};

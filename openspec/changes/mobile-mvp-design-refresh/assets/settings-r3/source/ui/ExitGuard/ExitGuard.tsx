import styles from '@preview/ui/ExitGuard/ExitGuard.module.css';
export type ExitGuardProps = { stay: () => void; leave: () => void };
export const ExitGuard = ({ stay, leave }: ExitGuardProps) => (
  <div className={styles.guard}>
    <p>Правки встречи не сохранятся.</p>
    <button className={styles.stay} onClick={stay}>
      Продолжить редактирование
    </button>
    <button className={styles.leave} onClick={leave}>
      Выйти без сохранения
    </button>
  </div>
);

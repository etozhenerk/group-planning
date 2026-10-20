import styles from '@/app/ui/RouteError/RouteError.module.css';
import { Status } from '@/shared/ui/Status';

export const RouteError = () => {
  return (
    <main id="main" className={styles['entry-page']}>
      <Status
        title="Не удалось открыть страницу"
        text="Обновите страницу, чтобы попробовать снова."
        error
        action={() => window.location.reload()}
        actionLabel="Обновить страницу"
      />
    </main>
  );
};

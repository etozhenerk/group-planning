import styles from '@/app/ui/RouteLoading/RouteLoading.module.css';
import { Status } from '@/shared/ui/Status';

export const RouteLoading = () => {
  return (
    <main id="main" className={styles['entry-page']}>
      <Status title="Открываем Somewhere…" />
    </main>
  );
};

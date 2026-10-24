import { Brand } from '@/shared/ui/Brand';
import styles from '@/shared/ui/LoadingScreen/LoadingScreen.module.css';

export const LoadingScreen = () => {
  return (
    <main id="main" className={styles['screen']} aria-busy="true">
      <div className={styles['content']} role="status" aria-label="Загрузка">
        <Brand />
        <span className={styles['track']} aria-hidden="true" />
      </div>
    </main>
  );
};

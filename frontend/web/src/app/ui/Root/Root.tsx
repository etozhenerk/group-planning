import styles from '@/app/ui/Root/Root.module.css';
import { Outlet } from 'react-router';
import { useSessionLifecycle } from '@/app/ui/Root/hooks/useSessionLifecycle';
import { DeletionGate } from '@/features/delete-account';
import { isDemo } from '@/shared/config';

export const Root = () => {
  useSessionLifecycle();

  return (
    <div>
      <a className={styles['skip-link']} href="#main">
        К содержимому
      </a>
      {isDemo && (
        <div className={styles['demo-notice']}>
          Демостенд · данные хранятся до перезапуска
        </div>
      )}
      <DeletionGate>
        <Outlet />
      </DeletionGate>
    </div>
  );
};

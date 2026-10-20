import styles from '@/pages/auth-return/ui/AuthReturnPage/AuthReturnPage.module.css';
import { Link } from 'react-router';
import { Status } from '@/shared/ui/Status';
import { useAuthReturn } from '@/pages/auth-return/ui/AuthReturnPage/hooks/useAuthReturn';

export const AuthReturnPage = () => {
  const state = useAuthReturn();

  return (
    <main id="main" className={[styles['entry-page'], styles['stack']].join(' ')}>
      {state.failed ? (
        <>
          <Status
            title="Вход не завершён"
            text="Вернитесь к приглашению или странице входа и попробуйте ещё раз."
            error
          />
          <Link
            to={state.target}
            className={[styles['button'], styles['primary']].join(' ')}
          >
            Вернуться
          </Link>
        </>
      ) : (
        <Status title="Завершаем вход…" />
      )}
    </main>
  );
};

import { Link } from 'react-router';
import { Status } from '@/shared/ui/status';
import { useAuthReturn } from '@/pages/auth-return/model/useAuthReturn';

export const AuthReturnPage = () => {
  const state = useAuthReturn();

  return (
    <main id="main" className="entry-page stack">
      {state.failed ? (
        <>
          <Status
            title="Вход не завершён"
            text="Вернитесь к приглашению или странице входа и попробуйте ещё раз."
            error
          />
          <Link to={state.target} className="button primary">
            Вернуться
          </Link>
        </>
      ) : (
        <Status title="Завершаем вход…" />
      )}
    </main>
  );
};

import styles from '@/pages/auth-return/ui/AuthReturnPage/AuthReturnPage.module.css';
import { Link } from 'react-router';
import { Status } from '@/shared/ui/Status';
import { Brand } from '@/shared/ui/Brand';
import { LoadingScreen } from '@/shared/ui/LoadingScreen';
import { SignInButton } from '@/features/sign-in';
import { useAuthReturn } from '@/pages/auth-return/ui/AuthReturnPage/hooks/useAuthReturn';

export const AuthReturnPage = () => {
  const state = useAuthReturn();

  if (!state.failure) {
    return <LoadingScreen />;
  }

  return (
    <main id="main" className={styles['page']}>
      <div className={styles['content']}>
        <Brand />
        {state.failure === 'network' ? (
          <Status title="Не удалось войти" error action={state.retry} />
        ) : (
          <>
            <Status title="Войдите ещё раз" error />
            <SignInButton context={state.context} />
          </>
        )}
        <Link to={state.backTarget} className={styles['back']}>
          {state.backLabel}
        </Link>
      </div>
    </main>
  );
};

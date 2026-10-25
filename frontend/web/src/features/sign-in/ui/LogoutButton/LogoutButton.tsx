import styles from '@/features/sign-in/ui/LogoutButton/LogoutButton.module.css';
import { LogOut, LoaderCircle } from 'lucide-react';
import type { Session } from '@/entities/session';
import { useLogout } from '@/features/sign-in/model/useLogout';
import { errorText } from '@/shared/api';

export type LogoutButtonProps = { session: Session; showLabel?: boolean };

export const LogoutButton = ({ session, showLabel = false }: LogoutButtonProps) => {
  const action = useLogout(session);

  return (
    <div>
      <button
        type="button"
        className={[showLabel ? styles.labelled : styles['icon'], styles['ghost']].join(
          ' ',
        )}
        aria-label="Выйти из аккаунта"
        onClick={() => action.mutate()}
        disabled={action.isPending}
        aria-busy={action.isPending}
      >
        {action.isPending ? (
          <LoaderCircle size={20} aria-hidden="true" className={styles.spinner} />
        ) : !showLabel ? (
          <LogOut size={20} aria-hidden="true" />
        ) : (
          'Выйти'
        )}
      </button>
      {action.error && (
        <p role="alert" className={styles['error']}>
          {errorText(action.error)}
        </p>
      )}
    </div>
  );
};

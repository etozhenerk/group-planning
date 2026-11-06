import styles from '@/features/sign-in/ui/LogoutButton/LogoutButton.module.css';
import { LogOut, LoaderCircle, TriangleAlert } from 'lucide-react';
import type { Session } from '@/entities/session';
import { useLogout } from '@/features/sign-in/model/useLogout';
import { errorText } from '@/shared/api';
import { designTokens } from '@/shared/config/design-tokens';

export type LogoutButtonProps = {
  session: Session;
  showLabel?: boolean;
  profile?: boolean;
};

export const LogoutButton = ({
  session,
  showLabel = false,
  profile = false,
}: LogoutButtonProps) => {
  const action = useLogout(session);
  const feedback = action.error && (
    <p role="alert" className={styles.error}>
      {profile && <TriangleAlert size={designTokens.componentMobileFieldIconSize} />}
      {profile ? 'Не удалось выйти. Попробуйте ещё раз.' : errorText(action.error)}
    </p>
  );

  return (
    <div className={profile ? styles.profile : undefined}>
      {profile && feedback}
      <button
        type="button"
        className={[
          profile ? styles.profileButton : showLabel ? styles.labelled : styles.icon,
          styles.ghost,
        ].join(' ')}
        aria-label="Выйти из аккаунта"
        onClick={() => action.mutate()}
        disabled={action.isPending}
        aria-busy={action.isPending}
      >
        {action.isPending ? (
          <LoaderCircle
            size={designTokens.spaceS20}
            aria-hidden="true"
            className={styles.spinner}
          />
        ) : (
          (profile || !showLabel) && (
            <LogOut size={designTokens.spaceS20} aria-hidden="true" />
          )
        )}
        {profile ? (
          <span>{action.isPending ? 'Выходим…' : 'Выйти из аккаунта'}</span>
        ) : showLabel && !action.isPending ? (
          'Выйти'
        ) : null}
      </button>
      {!profile && feedback}
    </div>
  );
};

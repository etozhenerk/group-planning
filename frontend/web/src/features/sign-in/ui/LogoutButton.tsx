import { LogOut } from 'lucide-react';
import type { Session } from '@/entities/session';
import { useLogout } from '@/features/sign-in/model/useLogout';
import { errorText } from '@/shared/api';

export type LogoutButtonProps = { session: Session };

export const LogoutButton = ({ session }: LogoutButtonProps) => {
  const action = useLogout(session);

  return (
    <div>
      <button
        type="button"
        className="icon ghost"
        aria-label="Выйти из аккаунта"
        onClick={() => action.mutate()}
        disabled={action.isPending}
      >
        <LogOut size={20} aria-hidden="true" />
      </button>
      {action.error && (
        <p role="alert" className="error">
          {errorText(action.error)}
        </p>
      )}
    </div>
  );
};

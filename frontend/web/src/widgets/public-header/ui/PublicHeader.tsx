import { Link } from 'react-router';
import { Brand } from '@/shared/ui/brand';
import { Avatar } from '@/shared/ui/avatar';
import { SignInButton, LogoutButton } from '@/features/sign-in';
import { useSession } from '@/entities/session';

export type PublicHeaderProps = { landing?: boolean };

export const PublicHeader = ({ landing = false }: PublicHeaderProps) => {
  const session = useSession();

  return (
    <header className="public-header">
      <Brand />
      <div className="row">
        {landing && (
          <a className="header-how" href="#examples">
            Как это работает
          </a>
        )}
        {session.data ? (
          <>
            <Link className="button ghost" to="/meetings">
              Мои встречи
            </Link>
            <Avatar name={session.data.user.displayName} size="small" />
            <LogoutButton session={session.data} />
          </>
        ) : (
          <SignInButton context={{ kind: 'home' }} label="Войти" primary={false} />
        )}
      </div>
    </header>
  );
};

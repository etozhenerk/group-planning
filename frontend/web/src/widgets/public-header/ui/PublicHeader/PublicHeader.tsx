import styles from '@/widgets/public-header/ui/PublicHeader/PublicHeader.module.css';
import { Link } from 'react-router';
import { Brand } from '@/shared/ui/Brand';
import { Avatar } from '@/shared/ui/Avatar';
import { SignInButton, LogoutButton } from '@/features/sign-in';
import { useSession } from '@/entities/session';

export type PublicHeaderProps = { landing?: boolean };

export const PublicHeader = ({ landing = false }: PublicHeaderProps) => {
  const session = useSession();

  return (
    <header className={styles['public-header']}>
      <Brand variant="header" />
      <div className={styles['row']}>
        {landing && (
          <a className={styles['header-how']} href="#examples">
            Как это работает
          </a>
        )}
        {session.data ? (
          <>
            <Link
              className={[styles['button'], styles['ghost']].join(' ')}
              to="/meetings"
            >
              Мои встречи
            </Link>
            <span className={styles['profile-avatar']}>
              <Avatar name={session.data.user.displayName} size="small" />
            </span>
            <LogoutButton session={session.data} />
          </>
        ) : (
          <SignInButton
            context={{ kind: 'home' }}
            label="Войти"
            primary={false}
            compact
          />
        )}
      </div>
    </header>
  );
};

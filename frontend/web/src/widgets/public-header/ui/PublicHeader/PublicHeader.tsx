import { useRsvpHeaderLayout } from '@/widgets/public-header/ui/PublicHeader/hooks/useRsvpHeaderLayout';
import { useMobileLayout } from '@/shared/lib/media';
import styles from '@/widgets/public-header/ui/PublicHeader/PublicHeader.module.css';
import { Link } from 'react-router';
import { Brand } from '@/shared/ui/Brand';
import { Avatar } from '@/shared/ui/Avatar';
import { AccountMenu, SignInButton, LogoutButton } from '@/features/sign-in';
import { useSession } from '@/entities/session';

export type PublicHeaderProps = {
  landing?: boolean;
  invitation?: boolean;
  result?: boolean;
};

export const PublicHeader = ({
  landing = false,
  invitation = false,
  result = false,
}: PublicHeaderProps) => {
  const session = useSession();
  const mobile = useMobileLayout();
  const resultLayout = useRsvpHeaderLayout();

  return (
    <header
      className={styles['public-header']}
      data-invitation={invitation}
      data-result={result}
      data-result-layout={resultLayout}
      data-mobile={mobile}
    >
      <Brand variant={result ? 'result' : invitation && mobile ? 'mobile' : 'header'} />
      <div className={styles['row']} data-authenticated={!!session.data}>
        {landing && (
          <a className={styles['header-how']} href="#examples">
            Как это работает
          </a>
        )}
        {session.data ? (
          <>
            {!(invitation && mobile) && (
              <Link
                className={[styles['button'], styles['ghost']].join(' ')}
                to="/meetings"
              >
                Мои встречи
              </Link>
            )}
            {result ? (
              <AccountMenu session={session.data} />
            ) : (
              <>
                <span className={styles['profile-avatar']}>
                  <Avatar
                    name={session.data.user.displayName}
                    mobileSrc={session.data.user.avatarUrl ?? null}
                    size="small"
                  />
                </span>
                <LogoutButton session={session.data} />
              </>
            )}
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

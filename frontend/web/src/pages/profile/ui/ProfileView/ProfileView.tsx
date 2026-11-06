import { Link } from 'react-router';
import { useMobileLayout } from '@/shared/lib/media';
import { MobileProfileView } from '@/pages/profile/ui/MobileProfileView';
import { useProfile } from '@/entities/session';
import type { Session } from '@/entities/session';
import { Navigation } from '@/widgets/navigation';
import { LogoutButton } from '@/features/sign-in';
import { ProfileDetails } from '@/pages/profile/ui/ProfileDetails';
import { Workspace } from '@/shared/ui/Workspace';
import { ProfileSkeleton } from '@/pages/profile/ui/ProfileSkeleton';
import { Status } from '@/shared/ui/Status';
import styles from '@/pages/profile/ui/ProfileView/ProfileView.module.css';

export type ProfileViewProps = { session: Session };

export const ProfileView = ({ session }: ProfileViewProps) => {
  const query = useProfile(session.user.id);
  const mobile = useMobileLayout();

  if (mobile) {
    return <MobileProfileView session={session} query={query} />;
  }

  return (
    <Workspace navigation={<Navigation session={session} />}>
      <main id="main" className={styles.page}>
        <h1>Мой профиль</h1>
        {query.isPending ? (
          <ProfileSkeleton />
        ) : query.error ? (
          <Status
            title="Не удалось загрузить профиль"
            error
            action={() => void query.refetch()}
          />
        ) : (
          query.data && (
            <ProfileDetails
              personal={query.data}
              name={query.data.display_name}
              avatar={query.data.avatar_url}
              email={query.data.email}
              phone={query.data.phone}
            />
          )
        )}
        <div className={styles.actions}>
          <Link to="/meetings">Мои встречи</Link>
        </div>
        <nav className={styles.links} aria-label="О сервисе">
          <Link to="/about" state={{ returnTo: '/profile' }}>
            О приложении
          </Link>
          <Link to="/help" state={{ returnTo: '/profile' }}>
            Помощь
          </Link>
          <Link to="/support?screen=profile" state={{ returnTo: '/profile' }}>
            Сообщить о проблеме
          </Link>
          <Link to="/privacy" state={{ returnTo: '/profile' }}>
            Конфиденциальность
          </Link>
          <Link to="/cookies" state={{ returnTo: '/profile' }}>
            Cookie
          </Link>
        </nav>
        <div className={styles.actions}>
          <LogoutButton session={session} showLabel />
        </div>
      </main>
    </Workspace>
  );
};

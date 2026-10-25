import { Link } from 'react-router';
import { useProfile } from '@/entities/session';
import type { Session } from '@/entities/session';
import { Navigation } from '@/widgets/navigation';
import { LogoutButton } from '@/features/sign-in';
import { DeleteAccountButton } from '@/features/delete-account';
import { ProfileDetails } from '@/pages/profile/ui/ProfileDetails';
import { Workspace } from '@/shared/ui/Workspace';
import { ProfileSkeleton } from '@/pages/profile/ui/ProfileSkeleton';
import { Status } from '@/shared/ui/Status';
import styles from '@/pages/profile/ui/ProfileView/ProfileView.module.css';

export type ProfileViewProps = { session: Session };

export const ProfileView = ({ session }: ProfileViewProps) => {
  const query = useProfile(session.user.id);

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
          <LogoutButton session={session} showLabel />
        </div>
        <nav className={styles.links} aria-label="О сервисе">
          <Link to="/about">О приложении</Link>
          <Link to="/help">Помощь</Link>
          <Link to="/support?screen=profile">Сообщить о проблеме</Link>
          <Link to="/privacy">Конфиденциальность</Link>
          <Link to="/cookies">Cookie</Link>
        </nav>
        <div className={styles.deletion}>
          <DeleteAccountButton csrf={session.csrf} />
        </div>
      </main>
    </Workspace>
  );
};

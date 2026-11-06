import type { Session, useProfile } from '@/entities/session';
import { Navigation } from '@/widgets/navigation';
import { LogoutButton } from '@/features/sign-in';
import { Workspace } from '@/shared/ui/Workspace';
import { MobileProfileError } from '@/pages/profile/ui/MobileProfileError';
import { MobileProfileAccount } from '@/pages/profile/ui/MobileProfileAccount';
import { MobileProfileMenu } from '@/pages/profile/ui/MobileProfileMenu';
import styles from '@/pages/profile/ui/MobileProfileView/MobileProfileView.module.css';

export type MobileProfileViewProps = {
  session: Session;
  query: ReturnType<typeof useProfile>;
};

export const MobileProfileView = ({ session, query }: MobileProfileViewProps) => (
  <Workspace navigation={<Navigation session={session} />} mobileBrand={false} screen>
    <main id="main" className={styles.page}>
      <h1>Профиль</h1>
      {query.isPending ? (
        <div className={styles.skeleton} role="status" aria-label="Загрузка профиля">
          <span />
          <div>
            <i />
            <i />
          </div>
        </div>
      ) : query.error ? (
        <MobileProfileError retry={() => void query.refetch()} />
      ) : (
        query.data && <MobileProfileAccount profile={query.data} />
      )}
      <MobileProfileMenu />
      <div className={styles.logout}>
        <LogoutButton session={session} showLabel profile />
      </div>
    </main>
  </Workspace>
);

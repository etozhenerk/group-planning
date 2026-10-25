import styles from '@/widgets/navigation/ui/ProfileMenu/ProfileMenu.module.css';
import { Avatar } from '@/shared/ui/Avatar';
import { LogoutButton } from '@/features/sign-in';
import { DeleteAccountButton } from '@/features/delete-account';
import type { Session } from '@/entities/session';

export type ProfileMenuProps = { session: Session };

export const ProfileMenu = ({ session }: ProfileMenuProps) => (
  <details className={styles.profile}>
    <summary
      className={styles.trigger}
      aria-label={`Профиль: ${session.user.displayName}`}
    >
      <Avatar name={session.user.displayName} own />
      <span className={styles.name}>{session.user.displayName}</span>
    </summary>
    <div className={styles.menu}>
      <LogoutButton session={session} showLabel />
      <DeleteAccountButton csrf={session.csrf} />
    </div>
  </details>
);

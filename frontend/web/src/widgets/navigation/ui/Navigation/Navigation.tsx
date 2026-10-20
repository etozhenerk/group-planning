import styles from '@/widgets/navigation/ui/Navigation/Navigation.module.css';
import { Link } from 'react-router';
import { isDemo } from '@/shared/config';
import { CalendarDays } from 'lucide-react';
import { Brand } from '@/shared/ui/Brand';
import { Avatar } from '@/shared/ui/Avatar';
import { LogoutButton } from '@/features/sign-in';
import type { Session } from '@/entities/session';

export type NavigationProps = { session: Session };

export const Navigation = ({ session }: NavigationProps) => {
  return (
    <nav
      className={[styles['navigation'], isDemo ? styles['demo'] : '']
        .filter(Boolean)
        .join(' ')}
      aria-label="Основная навигация"
    >
      <div>
        <Brand variant="navigation" />
      </div>
      <div className={styles['navigation-links']}>
        <Link to="/meetings">
          <CalendarDays size={18} aria-hidden="true" />
          Мои встречи
        </Link>
      </div>
      <div className={styles['navigation-profile']}>
        <span className={styles['profile-avatar']}>
          <Avatar name={session.user.displayName} own />
        </span>
        <span className={styles['grow']}>{session.user.displayName}</span>
        <LogoutButton session={session} />
      </div>
    </nav>
  );
};

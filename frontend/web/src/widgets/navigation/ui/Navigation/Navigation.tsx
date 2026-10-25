import { NavLink, Link, useLocation } from 'react-router';
import { Calendar, Mail, UserRound, MessageCircleWarning } from 'lucide-react';
import { Avatar } from '@/shared/ui/Avatar';
import { Brand } from '@/shared/ui/Brand';
import type { Session } from '@/entities/session';
import styles from '@/widgets/navigation/ui/Navigation/Navigation.module.css';

export type NavigationProps = { session: Session | null; sticky?: boolean };

export const Navigation = ({ session }: NavigationProps) => {
  const { pathname } = useLocation();
  const profileSection = /^\/(profile|support|help|about|privacy|cookies)/.test(pathname);

  return (
    <nav
      className={styles.navigation}
      data-mobile={/^\/(meetings|invitations|profile)\/?$/.test(pathname)}
      aria-label="Основная навигация"
    >
      <div className={styles.brand}>
        <Brand variant="navigation" />
      </div>
      <div
        className={styles.links}
        data-section={profileSection ? 2 : pathname.startsWith('/invitations') ? 1 : 0}
      >
        <span className={styles.indicator} aria-hidden="true" />
        <NavLink
          to="/meetings"
          aria-label="Встречи"
          aria-current={pathname.startsWith('/meetings') ? 'page' : undefined}
        >
          <Calendar size={22} aria-hidden="true" />
          <span>
            <span className={styles.desktopPrefix}>Мои встречи</span>
            <span className={styles.mobileLabel}>Встречи</span>
          </span>
        </NavLink>
        <NavLink to="/invitations">
          <Mail size={22} aria-hidden="true" />
          <span>Приглашения</span>
        </NavLink>
        <Link className={styles.support} to="/support">
          <MessageCircleWarning size={17} />
          <span>Сообщить о проблеме</span>
        </Link>
        <Link
          className={styles.profile ?? ''}
          to="/profile"
          title={session?.user.displayName}
          aria-label="Профиль"
          aria-current={profileSection ? 'page' : undefined}
        >
          <span className={styles.desktopAvatar}>
            {session ? (
              <Avatar name={session.user.displayName} size="small" tone="sand" />
            ) : (
              <UserRound size={24} />
            )}
          </span>
          <UserRound className={styles.mobileIcon} size={22} aria-hidden="true" />
          <span>
            <strong className={styles.name}>
              {session?.user.displayName ?? 'Мой профиль'}
            </strong>
            <span>
              <span className={styles.desktopPrefix}>Мой профиль</span>
              <span className={styles.mobileLabel}>Профиль</span>
            </span>
          </span>
        </Link>
      </div>
    </nav>
  );
};

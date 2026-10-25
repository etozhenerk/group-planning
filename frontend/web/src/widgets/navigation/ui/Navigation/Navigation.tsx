import styles from '@/widgets/navigation/ui/Navigation/Navigation.module.css';
import { Link } from 'react-router';
import { isDemo } from '@/shared/config';
import { CalendarDays } from 'lucide-react';
import { Brand } from '@/shared/ui/Brand';
import { ProfileMenu } from '@/widgets/navigation/ui/ProfileMenu';
import type { Session } from '@/entities/session';

export type NavigationProps = { session: Session; sticky?: boolean };

export const Navigation = ({ session, sticky = false }: NavigationProps) => {
  return (
    <nav
      className={[
        styles['navigation'],
        isDemo ? styles['demo'] : '',
        sticky ? styles.sticky : '',
      ]
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
        <ProfileMenu session={session} />
      </div>
    </nav>
  );
};

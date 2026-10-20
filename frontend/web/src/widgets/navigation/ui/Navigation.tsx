import { Link } from 'react-router';
import { CalendarDays } from 'lucide-react';
import { Brand } from '@/shared/ui/brand';
import { Avatar } from '@/shared/ui/avatar';
import { LogoutButton } from '@/features/sign-in';
import type { Session } from '@/entities/session';

export type NavigationProps = { session: Session };

export const Navigation = ({ session }: NavigationProps) => {
  return (
    <nav className="navigation" aria-label="Основная навигация">
      <div className="navigation-brand">
        <Brand />
      </div>
      <div className="navigation-links">
        <Link to="/meetings">
          <CalendarDays size={18} aria-hidden="true" />
          Мои встречи
        </Link>
      </div>
      <div className="navigation-profile">
        <Avatar name={session.user.displayName} own />
        <span className="grow">{session.user.displayName}</span>
        <LogoutButton session={session} />
      </div>
    </nav>
  );
};

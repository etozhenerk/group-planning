import { Link } from 'react-router';
import { CircleHelp, MessageCircleWarning, Info, ChevronRight } from 'lucide-react';
import { designTokens } from '@/shared/config/design-tokens';
import styles from '@/pages/profile/ui/MobileProfileMenu/MobileProfileMenu.module.css';

export const MobileProfileMenu = () => (
  <nav className={styles.menu} aria-label="Помощь и приложение">
    {[
      { to: '/help', label: 'Помощь', Icon: CircleHelp },
      {
        to: '/support?screen=profile',
        label: 'Сообщить о проблеме',
        Icon: MessageCircleWarning,
      },
      { to: '/about', label: 'О приложении', Icon: Info },
    ].map(({ to, label, Icon }) => (
      <Link to={to} state={{ returnTo: '/profile' }} key={to}>
        <Icon size={designTokens.componentMobileProfileMenuIcon} />
        <span>{label}</span>
        <ChevronRight size={designTokens.componentMobileProfileMenuChevron} />
      </Link>
    ))}
    <div className={styles.documents}>
      <Link to="/privacy" state={{ returnTo: '/profile' }}>
        Конфиденциальность
      </Link>
      <Link to="/cookies" state={{ returnTo: '/profile' }}>
        Cookie
      </Link>
    </div>
  </nav>
);

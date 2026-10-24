import { NavLink } from 'react-router';
import styles from '@/widgets/home-tabs/ui/HomeTabs/HomeTabs.module.css';

export const HomeTabs = () => (
  <nav className={styles.tabs} aria-label="Раздел встреч">
    <NavLink to="/meetings" end>
      Встречи
    </NavLink>
    <NavLink to="/invitations" end>
      Приглашения
    </NavLink>
  </nav>
);

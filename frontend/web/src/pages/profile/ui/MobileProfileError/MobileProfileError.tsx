import { UserRound, RefreshCw } from 'lucide-react';
import { designTokens } from '@/shared/config/design-tokens';
import styles from '@/pages/profile/ui/MobileProfileError/MobileProfileError.module.css';

export type MobileProfileErrorProps = { retry: () => void };

export const MobileProfileError = ({ retry }: MobileProfileErrorProps) => (
  <section className={styles.error}>
    <UserRound
      className={styles.icon}
      size={designTokens.componentMobileProfileErrorIcon}
    />
    <h2>Профиль не загрузился</h2>
    <p>Повторите попытку, чтобы увидеть данные аккаунта.</p>
    <button type="button" onClick={retry}>
      <RefreshCw size={designTokens.componentMobileStateActionIconSize} />
      Повторить
    </button>
  </section>
);

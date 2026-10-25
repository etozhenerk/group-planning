import { Link } from 'react-router';
import { versionLabel } from '@/shared/config';
import styles from '@/pages/support/ui/SupportAside/SupportAside.module.css';

export type SupportAsideProps = Record<string, never>;

export const SupportAside = () => (
  <aside className={styles.aside}>
    <div className={styles.mark} aria-hidden="true">
      ↗
    </div>
    <h2>Поможем разобраться</h2>
    <p>Если ждёте ответ, оставьте почту. Обращение можно отправить и без неё.</p>
    <div className={styles.build}>
      <span>Вы используете</span>
      <strong>somewhere для Web</strong>
      <span>{versionLabel}</span>
    </div>
    <Link to="/help">Возможно, ответ уже есть в помощи ↗</Link>
  </aside>
);

import { Brand } from '@/shared/ui/Brand';
import { Link } from 'react-router';
import { versionLabel } from '@/shared/config';
import styles from '@/widgets/service-footer/ui/ServiceFooter/ServiceFooter.module.css';

export const ServiceFooter = () => (
  <footer className={styles.footer}>
    <div className={styles.groups}>
      <section>
        <Brand />
        <p>Место для планов с друзьями.</p>
      </section>
      <section>
        <h2>Сервис</h2>
        <Link to="/about">О приложении</Link>
        <Link to="/help">Помощь</Link>
      </section>
      <section>
        <h2>Обратная связь</h2>
        <Link to="/support?kind=problem">Сообщить о проблеме ↗</Link>
        <Link to="/support?kind=idea">Предложить идею</Link>
      </section>
      <section>
        <h2>Документы</h2>
        <Link to="/privacy">Конфиденциальность</Link>
        <Link to="/cookies">Cookie</Link>
      </section>
    </div>
    <div className={styles.bottom}>
      <Link to="/about">{versionLabel}</Link>
      <span>
        Developed by <strong>MintyDev</strong>
      </span>
    </div>
  </footer>
);

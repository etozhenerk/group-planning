import { Link } from 'react-router';
import { buildNumber, versionLabel } from '@/shared/config';
import styles from '@/pages/service/ui/AboutContent/AboutContent.module.css';

export type AboutContentProps = Record<string, never>;

export const AboutContent = () => (
  <section className={styles.panel}>
    <img className={styles.brand} src="/somewhere.svg" alt="" />
    <h2>somewhere</h2>
    <p>Договориться о встрече, обсудить детали и сохранить её вайб.</p>
    <dl>
      <div>
        <dt>Приложение</dt>
        <dd>Web</dd>
      </div>
      <div>
        <dt>Версия</dt>
        <dd>{versionLabel.replace(/^Версия /, '')}</dd>
      </div>
      {buildNumber !== null && (
        <div>
          <dt>Сборка</dt>
          <dd>{buildNumber}</dd>
        </div>
      )}
      <div>
        <dt>Разработчик</dt>
        <dd>MintyDev</dd>
      </div>
    </dl>
    <Link to="/support">Сообщить о проблеме ↗</Link>
    <span>
      Developed by <strong>MintyDev</strong>
    </span>
  </section>
);

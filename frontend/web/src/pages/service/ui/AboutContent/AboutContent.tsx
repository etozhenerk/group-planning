import { Link, useLocation } from 'react-router';
import { readReturnLocation } from '@/shared/lib/navigation';
import { buildNumber, versionLabel } from '@/shared/config';
import styles from '@/pages/service/ui/AboutContent/AboutContent.module.css';

export type AboutContentProps = Record<string, never>;

export const AboutContent = () => {
  const location = useLocation();
  const back = readReturnLocation(location.state);

  return (
    <section className={styles.panel}>
      <img className={styles.brand} src="/somewhere.svg" alt="" />
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
      <Link
        to="/support"
        state={{ returnTo: '/about', returnState: { returnTo: back.path } }}
      >
        Сообщить о проблеме ↗
      </Link>
      <span>
        Developed by <strong>MintyDev</strong>
      </span>
    </section>
  );
};

import { buildNumber, versionLabel } from '@/shared/config';
import styles from '@/pages/service/ui/MobileBuildDetails/MobileBuildDetails.module.css';

export type MobileBuildDetailsProps = Record<string, never>;

export const MobileBuildDetails = () => (
  <dl className={styles.details}>
    <div>
      <dt>Приложение</dt>
      <dd>Web</dd>
    </div>
    <div>
      <dt>Версия</dt>
      <dd>
        {versionLabel === 'Версия недоступна'
          ? 'Недоступна'
          : versionLabel.replace(/^Версия /, '')}
      </dd>
    </div>
    {buildNumber !== null && (
      <div>
        <dt>Сборка</dt>
        <dd>{buildNumber}</dd>
      </div>
    )}
  </dl>
);

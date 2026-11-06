import { useLocation } from 'react-router';
import { PageBack } from '@/shared/ui/PageBack';
import { readReturnLocation, returnLocationLabel } from '@/shared/lib/navigation';
import { useDocumentPosition } from '@/pages/service/model/useDocumentPosition';
import { MobileAboutBrand } from '@/pages/service/ui/MobileAboutBrand';
import { MobileBuildDetails } from '@/pages/service/ui/MobileBuildDetails';
import styles from '@/pages/service/ui/MobileAbout/MobileAbout.module.css';

export type MobileAboutProps = Record<string, never>;

export const MobileAbout = () => {
  const location = useLocation(),
    back = readReturnLocation(location.state, '/profile'),
    ref = useDocumentPosition('about');

  return (
    <main id="main" ref={ref} className={styles.page}>
      <header className={styles.header}>
        <PageBack
          to={back.path}
          state={back.state}
          label={returnLocationLabel(back.path)}
        />
        <h1>О приложении</h1>
      </header>
      <div className={styles.content}>
        <MobileAboutBrand />
        <MobileBuildDetails />
        <p className={styles.credit}>
          Developed by <strong>MintyDev</strong>
        </p>
      </div>
    </main>
  );
};

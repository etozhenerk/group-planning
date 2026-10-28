import { readReturnLocation } from '@/shared/lib/navigation';
import { Link, useLocation } from 'react-router';
import { useSession } from '@/entities/session';
import { Navigation } from '@/widgets/navigation';
import { Workspace } from '@/shared/ui/Workspace';
import { serviceContent } from '@/pages/service/model/content';
import type { ServiceKind } from '@/pages/service/model/content';
import { AboutContent } from '@/pages/service/ui/AboutContent';
import { HelpContent } from '@/pages/service/ui/HelpContent';
import { PolicyContent } from '@/pages/service/ui/PolicyContent';
import styles from '@/pages/service/ui/ServicePage/ServicePage.module.css';

export const ServicePage = () => {
  const session = useSession();
  const location = useLocation();
  const kind = location.pathname.slice(1) as ServiceKind;
  const content = serviceContent[kind] ?? serviceContent.about;
  const back = readReturnLocation(location.state);

  return (
    <Workspace navigation={<Navigation session={session.data ?? null} />}>
      <main id="main" className={styles.page}>
        <Link className={styles.back} to={back.path} state={back.state}>
          ← Назад
        </Link>
        <header className={styles.heading}>
          <h1>{content.title}</h1>
          {
            <p>
              {kind === 'about'
                ? 'Место для планов с друзьями.'
                : kind === 'help'
                  ? content.intro
                  : kind === 'privacy'
                    ? 'Как используются данные в somewhere.'
                    : 'Что сохраняется на устройстве и зачем.'}
            </p>
          }
        </header>
        {kind === 'about' ? (
          <AboutContent />
        ) : kind === 'help' ? (
          <HelpContent />
        ) : (
          <PolicyContent kind={kind === 'cookies' ? 'cookies' : 'privacy'} />
        )}
      </main>
    </Workspace>
  );
};

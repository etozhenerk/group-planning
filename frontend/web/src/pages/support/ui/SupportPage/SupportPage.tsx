import { Link, useSearchParams } from 'react-router';
import { useSession } from '@/entities/session';
import { Navigation } from '@/widgets/navigation';
import { Workspace } from '@/shared/ui/Workspace';
import { SupportAside } from '@/pages/support/ui/SupportAside';
import { FeedbackForm, screenOptions } from '@/features/support-feedback';
import type { FeedbackKind, FeedbackScreen } from '@/features/support-feedback';
import styles from '@/pages/support/ui/SupportPage/SupportPage.module.css';

export const SupportPage = () => {
  const session = useSession();
  const [params] = useSearchParams();
  const kind = params.get('kind');
  const screen = params.get('screen');

  return (
    <Workspace navigation={<Navigation session={session.data ?? null} />}>
      <main id="main" className={styles.page}>
        <Link className={styles.back} to="/meetings">
          ← К встречам
        </Link>
        <h1>Что-то пошло не так?</h1>
        <p className={styles.intro}>
          Расскажите, что случилось. Это поможет разобраться.
        </p>
        <div className={styles.layout}>
          <FeedbackForm
            kind={
              (kind && ['problem', 'idea', 'question'].includes(kind)
                ? kind
                : 'problem') as FeedbackKind
            }
            screen={
              (screen && Object.hasOwn(screenOptions, screen)
                ? screen
                : 'other') as FeedbackScreen
            }
          />
          <SupportAside />
        </div>
      </main>
    </Workspace>
  );
};

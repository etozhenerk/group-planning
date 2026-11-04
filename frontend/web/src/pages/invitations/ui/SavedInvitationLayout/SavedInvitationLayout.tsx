import type { ReactNode } from 'react';
import { useRef } from 'react';
import { PageBack } from '@/shared/ui/PageBack';
import { useVisualViewport } from '@/shared/lib/viewport';
import { isDemo } from '@/shared/config';
import styles from '@/pages/invitations/ui/SavedInvitationLayout/SavedInvitationLayout.module.css';

export type SavedInvitationLayoutProps = { children: ReactNode };

export const SavedInvitationLayout = ({ children }: SavedInvitationLayoutProps) => {
  const ref = useRef<HTMLElement>(null);
  useVisualViewport(ref);

  return (
    <main id="main" ref={ref} className={styles.page} data-demo={isDemo}>
      <header className={styles.header}>
        <PageBack to="/invitations" label="Вернуться к приглашениям" />
        <h1>Ваш ответ</h1>
      </header>
      <div className={styles.scroll}>{children}</div>
    </main>
  );
};

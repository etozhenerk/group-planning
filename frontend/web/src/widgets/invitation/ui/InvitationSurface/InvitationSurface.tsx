import type { ReactNode } from 'react';
import { useMobileLayout } from '@/shared/lib/media';
import { useInvitationViewport } from '@/widgets/invitation/model/useInvitationViewport';
import styles from '@/widgets/invitation/ui/InvitationSurface/InvitationSurface.module.css';

export type InvitationSurfaceProps = {
  header: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  notice?: ReactNode;
  actionsVisible?: boolean;
  card?: boolean;
  children: ReactNode;
};

export const InvitationSurface = ({
  header,
  actions,
  footer,
  notice,
  actionsVisible = true,
  card = true,
  children,
}: InvitationSurfaceProps) => {
  const mobile = useMobileLayout();
  const viewport = useInvitationViewport();

  return (
    <div className={styles.screen} data-mobile={mobile} ref={viewport.screen}>
      <div className={styles.header}>{header}</div>
      <main id="main" className={styles.scroll}>
        <article className={styles.card} data-card={card}>
          {!mobile && notice}
          {children}
          {actions && actionsVisible && (
            <section
              ref={viewport.footer}
              className={styles.actions}
              aria-label="Ответ на приглашение"
            >
              {actions}
            </section>
          )}
        </article>
        {footer}
      </main>
    </div>
  );
};

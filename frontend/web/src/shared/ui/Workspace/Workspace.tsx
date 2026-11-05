import { useNavigationInset } from '@/shared/ui/Workspace/hooks/useNavigationInset';
import { Brand } from '@/shared/ui/Brand';
import styles from '@/shared/ui/Workspace/Workspace.module.css';
import type { ReactNode } from 'react';
import { useRef } from 'react';
import { useVisualViewport } from '@/shared/lib/viewport';
import { isDemo } from '@/shared/config';
import { useMobileLayout } from '@/shared/lib/media';

export type WorkspaceProps = {
  navigation: ReactNode;
  children: ReactNode;
  conversation?: boolean;
  screen?: boolean;
  mobileBrand?: boolean;
};

export const Workspace = ({
  navigation,
  children,
  conversation = false,
  screen = false,
  mobileBrand = true,
}: WorkspaceProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const navigationRef = useRef<HTMLDivElement>(null);
  useNavigationInset(ref, navigationRef);
  const mobile = useMobileLayout();
  useVisualViewport(ref);

  return (
    <div
      ref={ref}
      data-mobile={mobile}
      data-screen={screen}
      className={[
        styles['workspace'],
        conversation ? styles['conversation-workspace'] : '',
        isDemo ? styles['demo'] : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles['navigation-slot']} ref={navigationRef}>
        {navigation}
      </div>
      <div
        className={[styles.content, conversation ? styles.conversationContent : ''].join(
          ' ',
        )}
      >
        {mobileBrand && (
          <div className={styles.mobileBrand}>
            <Brand variant="header" />
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

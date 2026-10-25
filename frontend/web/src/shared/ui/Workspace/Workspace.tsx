import { Brand } from '@/shared/ui/Brand';
import styles from '@/shared/ui/Workspace/Workspace.module.css';
import type { ReactNode } from 'react';
import { useRef } from 'react';
import { useVisualViewport } from '@/shared/lib/viewport';
import { isDemo } from '@/shared/config';

export type WorkspaceProps = {
  navigation: ReactNode;
  children: ReactNode;
  conversation?: boolean;
};

export const Workspace = ({
  navigation,
  children,
  conversation = false,
}: WorkspaceProps) => {
  const ref = useRef<HTMLDivElement>(null);
  useVisualViewport(ref, conversation);

  return (
    <div
      ref={ref}
      className={[
        styles['workspace'],
        conversation ? styles['conversation-workspace'] : '',
        isDemo ? styles['demo'] : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles['navigation-slot']}>{navigation}</div>
      <div
        className={[styles.content, conversation ? styles.conversationContent : ''].join(
          ' ',
        )}
      >
        <div className={styles.mobileBrand}>
          <Brand variant="header" />
        </div>
        {children}
      </div>
    </div>
  );
};

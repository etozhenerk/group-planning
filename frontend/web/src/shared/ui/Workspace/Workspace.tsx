import styles from '@/shared/ui/Workspace/Workspace.module.css';
import type { ReactNode } from 'react';
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
  return (
    <div
      className={[
        styles['workspace'],
        conversation ? styles['conversation-workspace'] : '',
        isDemo ? styles['demo'] : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles['navigation-slot']}>{navigation}</div>
      {children}
    </div>
  );
};

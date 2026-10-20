import type { ReactNode } from 'react';

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
    <div className={`workspace ${conversation ? 'conversation-workspace' : ''}`}>
      {navigation}
      {children}
    </div>
  );
};

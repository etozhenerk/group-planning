import type { ReactNode } from 'react';
import { DeletionContext } from '@/features/delete-account/model/context';
import { useDeletion } from '@/features/delete-account/model/useDeletion';
import { DeletionDialog } from '@/features/delete-account/ui/DeletionDialog';
import { Brand } from '@/shared/ui/Brand';
import styles from '@/features/delete-account/ui/DeletionGate/DeletionGate.module.css';

export type DeletionGateProps = { children: ReactNode };

export const DeletionGate = ({ children }: DeletionGateProps) => {
  const flow = useDeletion();

  return (
    <DeletionContext value={flow.show}>
      {flow.pending ? (
        <main id="main" className={styles.waiting}>
          <Brand />
        </main>
      ) : (
        children
      )}
      {flow.complete && (
        <div className={styles.notice} role="status">
          Аккаунт удалён
        </div>
      )}
      <DeletionDialog
        open={flow.open}
        busy={flow.busy}
        pending={flow.pending !== null}
        error={flow.error}
        needsLogin={flow.needsLogin}
        close={flow.close}
        submit={() => void flow.submit()}
        leave={() => void flow.leave()}
      />
    </DeletionContext>
  );
};

import { DelayedSkeleton } from '@/shared/ui/DelayedSkeleton';
import type { ReactNode } from 'react';
import { Workspace } from '@/shared/ui/Workspace';
import { Skeleton } from '@/shared/ui/Skeleton';
import { SkeletonRows } from '@/shared/ui/SkeletonRows';
import { SkeletonDetails } from '@/shared/ui/SkeletonDetails';
import { SkeletonConversation } from '@/shared/ui/SkeletonConversation';
import styles from '@/shared/ui/WorkspaceSkeleton/WorkspaceSkeleton.module.css';

export type WorkspaceSkeletonProps = {
  layout?: 'list' | 'conversation' | 'form';
  navigation?: ReactNode;
};

export const WorkspaceSkeleton = ({
  layout = 'list',
  navigation,
}: WorkspaceSkeletonProps) => (
  <DelayedSkeleton>
    <Workspace
      conversation={layout === 'conversation'}
      navigation={
        navigation ?? (
          <div className={styles.navigation} aria-hidden="true">
            <Skeleton width={190} height={32} />
            <div className={styles.links}>
              <Skeleton height={24} width="75%" />
            </div>
            <div className={styles.profile}>
              <Skeleton width={36} height={36} round />
              <Skeleton width="55%" />
            </div>
          </div>
        )
      }
    >
      <main id="main" className={styles.content} data-layout={layout}>
        <div className={styles.heading} aria-hidden="true">
          <Skeleton width="55%" height={28} />
          <Skeleton width={44} height={44} />
        </div>
        {layout === 'conversation' ? (
          <SkeletonConversation />
        ) : layout === 'form' ? (
          <SkeletonDetails label="Загрузка встречи" fields />
        ) : (
          <>
            <div className={styles.filters} aria-hidden="true">
              <Skeleton width={150} height={40} />
              <Skeleton width={96} height={40} />
            </div>
            <SkeletonRows label="Загрузка встреч" />
          </>
        )}
      </main>
      {layout === 'conversation' && (
        <aside className={styles.aside}>
          <SkeletonDetails label="Загрузка деталей" />
          <SkeletonRows label="Загрузка участников" variant="people" />
        </aside>
      )}
    </Workspace>
  </DelayedSkeleton>
);

import { DelayedSkeleton } from '@/shared/ui/DelayedSkeleton';
import { Skeleton } from '@/shared/ui/Skeleton';
import styles from '@/shared/ui/SkeletonDetails/SkeletonDetails.module.css';

export type SkeletonDetailsProps = { label: string; fields?: boolean };

export const SkeletonDetails = ({ label, fields = false }: SkeletonDetailsProps) => (
  <DelayedSkeleton>
    <div className={styles.details} role="status" aria-label={label} aria-busy="true">
      <Skeleton width="72%" height={28} />
      <div className={styles.lines}>
        <Skeleton width="65%" height={fields ? 44 : 16} />
        <Skeleton width="85%" height={fields ? 44 : 16} />
      </div>
      <div className={styles.lines}>
        <Skeleton />
        <Skeleton width="72%" />
      </div>
      <Skeleton width={190} height={44} />
    </div>
  </DelayedSkeleton>
);

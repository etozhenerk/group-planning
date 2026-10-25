import { Skeleton } from '@/shared/ui/Skeleton';
import styles from '@/pages/profile/ui/ProfileSkeleton/ProfileSkeleton.module.css';

export type ProfileSkeletonProps = Record<string, never>;

export const ProfileSkeleton = () => (
  <div
    className={styles.root}
    role="status"
    aria-label="Загрузка профиля"
    aria-busy="true"
  >
    <div className={styles.panel}>
      <div className={styles.identity}>
        <Skeleton width={86} height={86} round />
        <div className={styles.lines}>
          <Skeleton width="70%" height={25} />
          <Skeleton width="95%" height={14} />
        </div>
      </div>
      <div className={styles.provider}>
        <Skeleton width={130} height={18} />
        <Skeleton width={100} height={28} />
      </div>
    </div>
    <Skeleton width={95} height={12} />
    <div className={styles.panel}>
      <Skeleton width="70%" height={48} />
      <Skeleton width="65%" height={48} />
    </div>
    <Skeleton width="75%" height={12} />
  </div>
);

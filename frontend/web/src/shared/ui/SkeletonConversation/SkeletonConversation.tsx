import { Skeleton } from '@/shared/ui/Skeleton';
import styles from '@/shared/ui/SkeletonConversation/SkeletonConversation.module.css';

export const SkeletonConversation = () => (
  <div
    className={styles.conversation}
    role="status"
    aria-label="Загрузка разговора"
    aria-busy="true"
  >
    <div className={styles.messages}>
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className={styles.message} data-own={index % 2 === 1}>
          <Skeleton width={30} height={30} round />
          <div className={styles.bubble}>
            <Skeleton width="40%" height={12} />
            <Skeleton />
            <Skeleton width={index % 2 ? '58%' : '82%'} />
          </div>
        </div>
      ))}
    </div>
    <div className={styles.composer}>
      <Skeleton width={40} height={40} round />
      <Skeleton height={48} />
    </div>
  </div>
);

import { Skeleton } from '@/shared/ui/Skeleton';
import styles from '@/shared/ui/SkeletonRows/SkeletonRows.module.css';

export type SkeletonRowsProps = {
  label: string;
  variant?: 'cards' | 'people' | 'agenda';
  count?: number;
};

export const SkeletonRows = ({
  label,
  variant = 'cards',
  count = 3,
}: SkeletonRowsProps) => (
  <div
    role="status"
    aria-label={label}
    aria-busy="true"
    className={styles.rows}
    data-variant={variant}
  >
    {Array.from({ length: count }, (_, index) => (
      <div className={styles.row} key={index}>
        <div className={styles.picture}>
          <Skeleton
            width="100%"
            height={variant === 'cards' ? 88 : 36}
            round={variant === 'people'}
          />
        </div>
        <div className={styles.lines}>
          <Skeleton
            width={index === 1 ? '60%' : '78%'}
            height={variant === 'cards' ? 20 : 14}
          />
          <Skeleton width="48%" height={12} />
          {variant === 'cards' && <Skeleton width="62%" height={12} />}
        </div>
      </div>
    ))}
  </div>
);

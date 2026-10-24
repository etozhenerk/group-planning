import type { CSSProperties } from 'react';
import styles from '@/shared/ui/Skeleton/Skeleton.module.css';

export type SkeletonProps = {
  width?: CSSProperties['width'];
  height?: number;
  round?: boolean;
};

export const Skeleton = ({
  width = '100%',
  height = 16,
  round = false,
}: SkeletonProps) => (
  <span
    aria-hidden="true"
    className={styles.block}
    style={{ width, height, borderRadius: round ? '50%' : undefined }}
  />
);

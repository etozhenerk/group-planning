import type { ReactNode } from 'react';
import { useAppearanceDelay } from '@/shared/ui/DelayedSkeleton/hooks/useAppearanceDelay';
import styles from '@/shared/ui/DelayedSkeleton/DelayedSkeleton.module.css';

export type DelayedSkeletonProps = { children: ReactNode };

export const DelayedSkeleton = ({ children }: DelayedSkeletonProps) => {
  const visible = useAppearanceDelay();

  return (
    <div className={styles.delay} data-visible={visible}>
      {children}
    </div>
  );
};

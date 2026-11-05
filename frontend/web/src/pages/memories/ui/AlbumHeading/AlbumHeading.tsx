import type { ReactNode } from 'react';
import type { Meeting } from '@/entities/meeting';
import { useMobileLayout } from '@/shared/lib/media';
import { AlbumFacts } from '@/pages/memories/ui/AlbumFacts';
import styles from '@/pages/memories/ui/AlbumHeading/AlbumHeading.module.css';

export type AlbumHeadingProps = { meeting: Meeting | undefined; actions: ReactNode };

export const AlbumHeading = ({ meeting, actions }: AlbumHeadingProps) => {
  const mobile = useMobileLayout();

  return (
    <header className={styles.heading} data-mobile={mobile}>
      <div>
        {!mobile && <AlbumFacts meeting={meeting} />}
        <h1>{meeting?.title ?? 'Вайб встречи'}</h1>
        {mobile && <AlbumFacts meeting={meeting} />}
      </div>
      {actions}
    </header>
  );
};

import { Link } from 'react-router';
import { Grid2X2, Layers } from 'lucide-react';
import { PageBack } from '@/shared/ui/PageBack';
import { useMobileLayout } from '@/shared/lib/media';
import { designTokens } from '@/shared/config/design-tokens';
import type { useMemoriesView } from '@/pages/memories/model/useMemoriesView';
import styles from '@/pages/memories/ui/AlbumNavigation/AlbumNavigation.module.css';

export type AlbumNavigationProps = {
  id: string;
  view: ReturnType<typeof useMemoriesView>;
};

export const AlbumNavigation = ({ id, view }: AlbumNavigationProps) => {
  const mobile = useMobileLayout();
  const to = view.fromChat ? `/meetings/${id}` : view.returnPath;
  const label = view.fromChat ? 'К встрече' : 'Прошедшие встречи';

  return mobile ? (
    <div className={styles.nav}>
      <PageBack to={to} label={label} />
      {!view.query.access.denied && view.photos.length > 0 && (
        <div className={styles.controls} data-testid="album-view-controls">
          <span aria-live="polite" data-testid="album-counter">
            {view.album.index + 1}
            <span className={styles.total}>
              {' '}
              / {view.photos.length}
              {view.query.hasNextPage ? ' +' : ''}
            </span>
          </span>
          <button
            type="button"
            onClick={() => view.album.setGrid(!view.album.grid)}
            aria-label={view.album.grid ? 'Показать стопкой' : 'Показать сеткой'}
          >
            {view.album.grid ? (
              <Layers size={designTokens.componentMobileVibeViewIconSize} />
            ) : (
              <Grid2X2 size={designTokens.componentMobileVibeViewIconSize} />
            )}
          </button>
        </div>
      )}
    </div>
  ) : (
    <Link className={styles.back} to={to}>
      {view.fromChat ? '← К встрече' : '‹ Прошедшие встречи'}
    </Link>
  );
};

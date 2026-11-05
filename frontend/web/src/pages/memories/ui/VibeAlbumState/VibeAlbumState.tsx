import { Images, ImageOff, LockKeyhole } from 'lucide-react';
import { designTokens } from '@/shared/config/design-tokens';
import styles from '@/pages/memories/ui/VibeAlbumState/VibeAlbumState.module.css';

export type VibeAlbumStateProps = {
  kind: 'empty' | 'error' | 'loading' | 'denied';
  retry?: (() => void) | undefined;
};

export const VibeAlbumState = ({ kind, retry }: VibeAlbumStateProps) => (
  <section className={styles.state} role={kind === 'loading' ? 'status' : undefined}>
    {kind === 'loading' ? (
      <div className={styles.skeleton} />
    ) : (
      <>
        <div className={styles.icon}>
          {kind === 'denied' ? (
            <LockKeyhole size={designTokens.componentMobileVibeStateIcon} />
          ) : kind === 'error' ? (
            <ImageOff size={designTokens.componentMobileVibeStateIcon} />
          ) : (
            <Images size={designTokens.componentMobileVibeStateIcon} />
          )}
        </div>
        <h2>
          {kind === 'empty'
            ? 'Как всё прошло?'
            : kind === 'denied'
              ? 'Доступ к фото закрыт'
              : 'Альбом не загрузился'}
        </h2>
      </>
    )}
    <p>
      {kind === 'empty'
        ? 'Добавьте фото встречи — их увидят участники.'
        : kind === 'denied'
          ? 'Фото доступны участникам встречи.'
          : kind === 'loading'
            ? 'Загружаем фото…'
            : 'Не удалось получить фотографии. Попробуйте ещё раз.'}
    </p>
    {kind === 'error' && (
      <button type="button" onClick={retry}>
        Повторить загрузку
      </button>
    )}
  </section>
);

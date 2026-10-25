import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import styles from '@/entities/meeting/ui/CoverPixels/CoverPixels.module.css';

export type CoverPixelsProps = { src: string };

export const CoverPixels = ({ src }: CoverPixelsProps) => {
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading');

  return (
    <div className={styles.pixels} aria-busy={state === 'loading'}>
      {state === 'failed' ? (
        <ImageOff aria-label="Фото недоступно" size={24} />
      ) : (
        <>
          <img
            src={src}
            alt="Обложка встречи"
            onLoad={() => setState('ready')}
            onError={() => setState('failed')}
            data-ready={state === 'ready'}
          />
          {state === 'loading' && (
            <div className={styles.loading} role="status" aria-label="Загрузка фото" />
          )}
        </>
      )}
    </div>
  );
};

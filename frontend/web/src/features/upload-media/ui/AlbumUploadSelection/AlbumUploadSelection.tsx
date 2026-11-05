import { Images } from 'lucide-react';
import { designTokens } from '@/shared/config/design-tokens';
import type { UploadItem } from '@/features/upload-media/model/types';
import { AlbumUploadItem } from '@/features/upload-media/ui/AlbumUploadItem';
import styles from '@/features/upload-media/ui/AlbumUploadSelection/AlbumUploadSelection.module.css';

export type AlbumUploadSelectionProps = {
  items: UploadItem[];
  busy: boolean;
  partial: boolean;
  remove: (id: string) => void;
};

export const AlbumUploadSelection = ({
  items,
  busy,
  partial,
  remove,
}: AlbumUploadSelectionProps) =>
  items.length ? (
    <>
      <p className={styles.count}>
        {partial ? 'Не добавлено фото: ' : 'Выбрано фото: '}
        {items.length}
      </p>
      <ul className={styles.carousel} aria-label="Выбранные фотографии">
        {items.map((item) => (
          <AlbumUploadItem
            key={item.id}
            item={item}
            busy={busy}
            remove={() => remove(item.id)}
          />
        ))}
      </ul>
    </>
  ) : (
    <div className={styles.empty}>
      <Images size={designTokens.componentMobileVibeUploadEmptyIcon} />
      <strong>Фото с вашей встречи</strong>
      <p>Выберите снимки — их увидят участники.</p>
    </div>
  );

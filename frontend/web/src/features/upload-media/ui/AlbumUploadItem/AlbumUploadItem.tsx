import { X } from 'lucide-react';
import { designTokens } from '@/shared/config/design-tokens';
import type { UploadItem } from '@/features/upload-media/model/types';
import styles from '@/features/upload-media/ui/AlbumUploadItem/AlbumUploadItem.module.css';

export type AlbumUploadItemProps = {
  item: UploadItem;
  busy: boolean;
  remove: () => void;
};

export const AlbumUploadItem = ({ item, busy, remove }: AlbumUploadItemProps) => (
  <li className={styles.item}>
    <div className={styles.photo}>
      {item.preview && <img src={item.preview} alt={item.file.name} />}
      <button
        type="button"
        disabled={busy}
        onClick={remove}
        aria-label={`Убрать ${item.file.name}`}
      >
        <X size={designTokens.componentMobileFieldIconSize} />
      </button>
    </div>
    {item.state === 'ready' && item.error && <p role="alert">{item.error}</p>}
  </li>
);

import { ChatIcon } from '@/shared/ui/ChatIcon';
import type { UploadItem } from '@/features/upload-media/model/types';
import styles from '@/features/upload-media/ui/UploadItemRow/UploadItemRow.module.css';

export type UploadItemRowProps = {
  item: UploadItem;
  remove: () => void;
  busy: boolean;
  caption: (value: string) => void;
};

export const UploadItemRow = ({ item, remove, busy, caption }: UploadItemRowProps) => (
  <li className={styles.item} data-photo={!!item.preview}>
    {item.preview ? (
      <div className={styles.photo}>
        <img src={item.preview} alt={item.file.name} className={styles.preview} />
        <button
          className={styles.remove}
          type="button"
          onClick={remove}
          disabled={busy}
          aria-label={`Убрать ${item.file.name}`}
        >
          <ChatIcon name="close" size={20} aria-hidden="true" />
        </button>
      </div>
    ) : (
      <div className={styles.file}>
        <ChatIcon name="file" size={24} aria-hidden="true" />
        <div>
          <strong>{item.file.name}</strong>
          <small>
            {item.file.name.split('.').at(-1)?.toUpperCase()} ·{' '}
            {new Intl.NumberFormat('ru', { maximumFractionDigits: 1 }).format(
              item.file.size / 1024 / 1024,
            )}{' '}
            МБ
          </small>
        </div>
        <button
          type="button"
          onClick={remove}
          disabled={busy}
          aria-label={`Убрать ${item.file.name}`}
        >
          <ChatIcon name="close" size={20} aria-hidden="true" />
        </button>
      </div>
    )}
    {item.state === 'ready' && item.error && <p role="alert">{item.error}</p>}
    {!item.preview && (
      <label className={styles.caption}>
        Подпись
        <textarea
          aria-label={`Подпись к ${item.file.name}`}
          placeholder="Добавьте пару слов"
          value={item.caption}
          disabled={busy || item.state !== 'ready'}
          onChange={(event) => {
            if (Array.from(event.target.value).length <= 2000) {
              caption(event.target.value);
            }
          }}
        />
      </label>
    )}
  </li>
);

import { ChatIcon } from '@/shared/ui/ChatIcon';
import type { UploadItem } from '@/features/upload-media/model/types';
import styles from '@/features/upload-media/ui/UploadItemRow/UploadItemRow.module.css';

export type UploadItemRowProps = {
  item: UploadItem;
  remove: () => void;
  retry: () => void;
  caption: (value: string) => void;
};

export const UploadItemRow = ({ item, remove, retry, caption }: UploadItemRowProps) => (
  <li className={styles.item} data-photo={!!item.preview}>
    {item.preview ? (
      <img src={item.preview} alt="" className={styles.preview} />
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
        {item.state !== 'done' && (
          <button type="button" onClick={remove} aria-label={`Убрать ${item.file.name}`}>
            ×
          </button>
        )}
      </div>
    )}
    {(item.state !== 'ready' || item.error) && (
      <div className={styles.info}>
        {item.state === 'uploading' && (
          <progress
            max={100}
            value={item.progress}
            aria-label={`Загрузка ${item.file.name}`}
          />
        )}
        {item.state === 'done' && <span role="status">Добавлено</span>}
        {item.error && <p role="alert">{item.error}</p>}
        {item.state === 'failed' && (
          <button type="button" onClick={retry}>
            Повторить
          </button>
        )}
      </div>
    )}
    {item.preview && item.state !== 'done' && (
      <button
        className={styles.remove}
        type="button"
        onClick={remove}
        aria-label={`Убрать ${item.file.name}`}
      >
        Убрать фото
      </button>
    )}
    {!item.preview && (
      <label className={styles.caption}>
        Подпись
        <textarea
          aria-label={`Подпись к ${item.file.name}`}
          placeholder="Добавьте пару слов"
          value={item.caption}
          disabled={item.state !== 'ready'}
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

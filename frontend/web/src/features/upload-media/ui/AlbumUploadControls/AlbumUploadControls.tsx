import { Plus, TriangleAlert } from 'lucide-react';
import { designTokens } from '@/shared/config/design-tokens';
import { ButtonSpinner } from '@/shared/ui/ButtonSpinner';
import type { useMediaUpload } from '@/features/upload-media/model/useMediaUpload';
import type { UploadItem } from '@/features/upload-media/model/types';
import { useUploadPicker } from '@/features/upload-media/ui/UploadActions/hooks/useUploadPicker';
import styles from '@/features/upload-media/ui/AlbumUploadControls/AlbumUploadControls.module.css';

export type AlbumUploadControlsProps = {
  upload: ReturnType<typeof useMediaUpload>;
  items: UploadItem[];
  partial: boolean;
  complete: boolean;
};

export const AlbumUploadControls = ({
  upload,
  items,
  partial,
  complete,
}: AlbumUploadControlsProps) => {
  const { input, button } = useUploadPicker();
  const failed = items.filter((item) => item.state === 'failed');
  const problem =
    upload.error ||
    (!upload.busy && failed.length
      ? partial
        ? `Остальные снимки уже в альбоме. Повтор добавит только ${items.length === 1 ? 'оставшийся' : 'оставшиеся'}.`
        : `${failed[0]?.error ?? 'Не удалось добавить фото.'} Выбранные снимки остались в форме.`
      : '');

  const ready = items.some(
    (item) => item.state === 'failed' || (item.state === 'ready' && !item.error),
  );

  const invalid = items.some((item) => item.state === 'ready' && !!item.error);
  const title = upload.busy
    ? 'Добавляем фотографии'
    : problem
      ? 'Повторить отправку'
      : 'Добавить в альбом';

  return (
    <>
      <button
        className={styles.choose}
        ref={button}
        type="button"
        disabled={upload.busy}
        onClick={() => input.current?.click()}
      >
        <Plus size={designTokens.componentMobileFieldIconSize} />
        {items.length ? 'Выбрать ещё' : 'Выбрать фото'}
      </button>
      <input
        ref={input}
        hidden
        type="file"
        accept={upload.limits.data?.photo_types.join(',') ?? 'image/*'}
        multiple
        aria-label="Файлы для альбома"
        onChange={(event) => {
          upload.choose(event.target.files);
          event.target.value = '';
          button.current?.focus({ preventScroll: true });
        }}
      />
      {items.length > 0 && <p className={styles.hint}>Видно участникам встречи</p>}
      <div className={styles.footer} data-testid="upload-footer">
        {problem && (
          <div className={styles.problem} role="alert">
            <TriangleAlert size={designTokens.componentMobileFieldIconSize} />
            <span>{problem}</span>
          </div>
        )}
        <button
          className={styles.submit}
          type="button"
          disabled={!items.length || upload.busy || complete || invalid || !ready}
          aria-busy={upload.busy}
          aria-label={title}
          onClick={upload.upload}
        >
          {upload.busy ? (
            <>
              <ButtonSpinner />
              <span>Добавляем фото…</span>
            </>
          ) : problem ? (
            'Повторить отправку'
          ) : (
            'Добавить в альбом'
          )}
        </button>
      </div>
    </>
  );
};

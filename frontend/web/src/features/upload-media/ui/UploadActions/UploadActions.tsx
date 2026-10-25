import { Plus } from 'lucide-react';
import { ButtonSpinner } from '@/shared/ui/ButtonSpinner';
import styles from '@/features/upload-media/ui/UploadActions/UploadActions.module.css';

export type UploadActionsProps = {
  photo: boolean;
  hasFiles: boolean;
  accept: string;
  choose: (files: FileList | null) => void;
  busy: boolean;
  ready: boolean;
  complete: boolean;
  memory: boolean;
  send: () => void;
  done: () => void;
};

export const UploadActions = ({
  photo,
  hasFiles,
  accept,
  choose,
  busy,
  ready,
  complete,
  memory,
  send,
  done,
}: UploadActionsProps) => (
  <div className={styles.actions}>
    <label className={styles.picker}>
      <Plus size={18} aria-hidden="true" />
      {hasFiles ? 'Выбрать ещё' : photo ? 'Выбрать фото' : 'Выбрать файлы'}
      <input
        type="file"
        multiple
        accept={accept}
        aria-label={photo ? 'Выбрать фото' : 'Выбрать файлы'}
        onChange={(event) => {
          choose(event.target.files);
          event.target.value = '';
        }}
      />
    </label>
    {complete ? (
      <button className={styles.primary} type="button" onClick={done}>
        Готово
      </button>
    ) : (
      <button
        className={styles.primary}
        type="button"
        disabled={!ready || busy}
        aria-busy={busy}
        aria-label={busy ? 'Загрузка файлов' : undefined}
        onClick={send}
      >
        {busy ? <ButtonSpinner /> : memory ? 'Добавить в альбом' : 'Отправить'}
      </button>
    )}
  </div>
);

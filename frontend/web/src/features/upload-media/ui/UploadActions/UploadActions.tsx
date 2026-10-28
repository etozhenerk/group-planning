import { Plus } from 'lucide-react';
import { ButtonSpinner } from '@/shared/ui/ButtonSpinner';
import { useUploadPicker } from '@/features/upload-media/ui/UploadActions/hooks/useUploadPicker';
import styles from '@/features/upload-media/ui/UploadActions/UploadActions.module.css';

export type UploadActionsProps = {
  photo: boolean;
  hasFiles: boolean;
  accept: string;
  choose: (files: FileList | null) => void;
  busy: boolean;
  ready: boolean;
  memory: boolean;
  retry: boolean;
  send: () => void;
};

export const UploadActions = ({
  photo,
  hasFiles,
  accept,
  choose,
  busy,
  ready,
  memory,
  retry,
  send,
}: UploadActionsProps) => {
  const { input, button } = useUploadPicker();

  return (
    <div className={styles.actions}>
      <button
        type="button"
        className={styles.picker}
        ref={button}
        disabled={busy}
        onClick={() => input.current?.click()}
      >
        <Plus size={18} aria-hidden="true" />
        {hasFiles ? 'Выбрать ещё' : photo ? 'Выбрать фото' : 'Выбрать файлы'}
      </button>
      <input
        ref={input}
        type="file"
        hidden
        multiple
        accept={accept}
        aria-label={photo ? 'Выбрать фото' : 'Выбрать файлы'}
        onChange={(event) => {
          choose(event.target.files);
          event.target.value = '';
          button.current?.focus({ preventScroll: true });
        }}
      />
      <button
        className={styles.primary}
        type="button"
        disabled={!ready || busy}
        aria-busy={busy}
        aria-label={busy ? 'Загрузка файлов' : undefined}
        onClick={send}
      >
        {busy ? (
          <ButtonSpinner />
        ) : retry ? (
          'Повторить отправку'
        ) : memory ? (
          'Добавить в альбом'
        ) : (
          'Отправить'
        )}
      </button>
    </div>
  );
};

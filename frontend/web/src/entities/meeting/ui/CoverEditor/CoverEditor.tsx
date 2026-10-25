import { useRef } from 'react';
import type { PreparedCover } from '@/entities/meeting/model/cover';
import { coverDataURL } from '@/entities/meeting/model/cover';
import { MeetingCover } from '@/entities/meeting/ui/MeetingCover';
import { useCoverSelection } from '@/entities/meeting/ui/CoverEditor/hooks/useCoverSelection';
import styles from '@/entities/meeting/ui/CoverEditor/CoverEditor.module.css';

export type CoverEditorProps = {
  value: PreparedCover | null | undefined;
  original?: { url: string | null; meeting: string; user: string };
  disabled: boolean;
  onChange: (cover: PreparedCover | null) => void;
  onBusy: (busy: boolean) => void;
  invalid?: boolean;
};

export const CoverEditor = ({
  value,
  original,
  disabled,
  onChange,
  onBusy,
  invalid = false,
}: CoverEditorProps) => {
  const input = useRef<HTMLInputElement>(null);
  const selection = useCoverSelection(onChange, onBusy);
  const existing = value === undefined ? original : undefined;
  const hasPhoto = !!value || !!existing?.url;

  return (
    <section className={styles.editor} aria-label="Обложка">
      <span>
        Обложка <small>необязательно</small>
      </span>
      {selection.busy ? (
        <div
          className={styles.skeleton}
          role="status"
          aria-label="Подготовка фото"
          aria-busy="true"
        />
      ) : value ? (
        <img
          className={styles.preview}
          src={coverDataURL(value)}
          alt="Выбранная обложка"
        />
      ) : existing?.url ? (
        <MeetingCover
          url={existing.url}
          meeting={existing.meeting}
          user={existing.user}
        />
      ) : null}
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png"
        aria-label="Выбрать фото"
        hidden
        disabled={disabled || selection.busy}
        onChange={(event) => {
          void selection.choose(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
      <div className={styles.actions}>
        <button
          type="button"
          disabled={disabled || selection.busy}
          onClick={() => input.current?.click()}
        >
          {hasPhoto ? 'Заменить' : 'Добавить фото'}
        </button>
        {hasPhoto && (
          <button
            type="button"
            disabled={disabled || selection.busy}
            onClick={selection.remove}
          >
            Убрать фото
          </button>
        )}
      </div>
      {(selection.problem || invalid) && (
        <p role="alert" className={styles.error}>
          {selection.problem || 'Не удалось сохранить фото. Выберите другое.'}
        </p>
      )}
    </section>
  );
};

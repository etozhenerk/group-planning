import { CoverActions } from '@/entities/meeting/ui/CoverActions';
import { ImagePlus } from 'lucide-react';
import { useMobileLayout } from '@/shared/lib/media';
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
  compact?: boolean;
  prominent?: boolean;
};

export const CoverEditor = ({
  value,
  original,
  disabled,
  onChange,
  onBusy,
  invalid = false,
  compact = false,
  prominent = false,
}: CoverEditorProps) => {
  const mobile = useMobileLayout() && compact;
  const input = useRef<HTMLInputElement>(null);
  const selection = useCoverSelection(onChange, onBusy);
  const existing = value === undefined ? original : undefined;
  const hasPhoto = !!value || !!existing?.url;

  return (
    <section
      className={styles.editor}
      aria-label="Обложка"
      data-compact={mobile}
      data-prominent={prominent}
    >
      <span className={styles.label}>
        Обложка{' '}
        <small>
          {mobile ? (hasPhoto ? 'Фото встречи' : 'Не добавлена') : 'необязательно'}
        </small>
      </span>
      <div className={styles.media}>
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
            fill={mobile}
            url={existing.url}
            meeting={existing.meeting}
            user={existing.user}
          />
        ) : mobile ? (
          <ImagePlus aria-hidden="true" />
        ) : null}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png"
        aria-label="Выбрать фото"
        hidden
        disabled={disabled || selection.busy}
        onChange={selection.choose}
      />
      <CoverActions
        compact={mobile}
        prominent={prominent}
        hasPhoto={hasPhoto}
        disabled={disabled || selection.busy}
        choose={() => input.current?.click()}
        remove={selection.remove}
      />
      {(selection.problem || invalid) && (
        <p role="alert" className={styles.error}>
          {selection.problem || 'Не удалось сохранить фото. Выберите другое.'}
        </p>
      )}
    </section>
  );
};

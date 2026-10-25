import { Paperclip } from 'lucide-react';
import type { Screenshot } from '@/features/support-feedback/model/types';
import styles from '@/features/support-feedback/ui/FeedbackScreenshot/FeedbackScreenshot.module.css';

export type FeedbackScreenshotProps = {
  value: Screenshot | null;
  error: string;
  reading: boolean;
  choose: (file: File | undefined) => Promise<void>;
  remove: () => void;
};

export const FeedbackScreenshot = ({
  value,
  error,
  reading,
  choose,
  remove,
}: FeedbackScreenshotProps) => (
  <div className={styles.screenshot}>
    <label>
      <Paperclip size={23} />
      <span>
        <strong>Прикрепить скриншот</strong>
        <small>PNG, JPG или WebP, до 5 МБ</small>
      </span>
      <input
        type="file"
        aria-label="Прикрепить скриншот"
        accept="image/png,image/jpeg,image/webp"
        disabled={reading}
        onChange={(event) => {
          void choose(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
    </label>
    {reading && <p role="status">Подготовка скриншота…</p>}
    {value && (
      <div className={styles.preview}>
        <img
          src={`data:${value.content_type};base64,${value.data_base64}`}
          alt="Выбранный скриншот"
        />
        <span>{value.file_name}</span>
        <button type="button" onClick={remove}>
          Убрать скриншот
        </button>
      </div>
    )}
    {error && <p role="alert">{error}</p>}
  </div>
);

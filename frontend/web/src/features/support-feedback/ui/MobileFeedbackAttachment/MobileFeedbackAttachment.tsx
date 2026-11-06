import { designTokens } from '@/shared/config/design-tokens';
import { Paperclip, X, ImageOff } from 'lucide-react';
import type { useFeedback } from '@/features/support-feedback/model/useFeedback';
import styles from '@/features/support-feedback/ui/MobileFeedbackAttachment/MobileFeedbackAttachment.module.css';

export type MobileFeedbackAttachmentProps = { model: ReturnType<typeof useFeedback> };

export const MobileFeedbackAttachment = ({ model: m }: MobileFeedbackAttachmentProps) => (
  <div className={styles.attachment}>
    {m.screenshot ? (
      <div className={styles.selected}>
        <img
          src={`data:${m.screenshot.content_type};base64,${m.screenshot.data_base64}`}
          alt="Выбранный скриншот"
        />
        <div>
          <strong>{m.screenshot.file_name}</strong>
          <small>Скриншот прикреплён</small>
        </div>
        <button
          type="button"
          aria-label="Убрать скриншот"
          onClick={() => m.setScreenshot(null)}
        >
          <X aria-hidden="true" />
        </button>
      </div>
    ) : (
      <label className={styles.choose}>
        <Paperclip
          aria-hidden="true"
          strokeWidth={Number.parseFloat(
            designTokens.componentMobileUnreadIconStrokeWidth,
          )}
        />
        <span>
          Прикрепить скриншот<small>PNG, JPG или WebP, до 5 МБ</small>
        </span>
        <input
          type="file"
          aria-label="Прикрепить скриншот"
          accept="image/png,image/jpeg,image/webp"
          disabled={m.reading}
          onChange={(e) => {
            void m.choose(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </label>
    )}
    {m.reading && <p role="status">Подготовка скриншота…</p>}
    {m.fileError && (
      <p role="alert" className={styles.error}>
        <ImageOff aria-hidden="true" />
        {m.fileError}
      </p>
    )}
  </div>
);

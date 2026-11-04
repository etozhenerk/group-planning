import { useRef } from "react";
import { Paperclip, X, ImageOff } from "lucide-react";
import type { HelpModel } from "@h/model/useHelpPreview";
import styles from "@h/ui/FeedbackAttachment/FeedbackAttachment.module.css";
export type FeedbackAttachmentProps = { model: HelpModel };
export const FeedbackAttachment = ({ model: m }: FeedbackAttachmentProps) => {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className={styles.attachment}>
      {m.screenshot ? (
        <div className={styles.selected}>
          <img
            src={
              "data:" +
              m.screenshot.content_type +
              ";base64," +
              m.screenshot.data_base64
            }
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
            <X size={19} />
          </button>
        </div>
      ) : (
        <button
          className={styles.choose}
          type="button"
          onClick={() => input.current?.click()}
          disabled={m.reading}
        >
          <Paperclip size={21} strokeWidth={1.6} />
          <span>
            {m.reading ? "Открываем скриншот…" : "Прикрепить скриншот"}
            <small>PNG, JPG или WebP · до 5 МБ</small>
          </span>
        </button>
      )}
      <input
        ref={input}
        hidden
        type="file"
        aria-label="Файл скриншота"
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => {
          void m.choose(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {m.fileError && (
        <p className={styles.error} role="alert">
          <ImageOff size={17} />
          {m.fileError}
        </p>
      )}
    </div>
  );
};

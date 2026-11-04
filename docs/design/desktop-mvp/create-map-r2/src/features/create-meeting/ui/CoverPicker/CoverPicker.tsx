import { ImagePlus, Upload, Trash2 } from "lucide-react";
import { useCoverFile } from "@future/features/create-meeting/model/useCoverFile";
import { FieldMessage } from "@future/shared/ui/FieldMessage";
import styles from "@future/features/create-meeting/ui/CoverPicker/CoverPicker.module.css";

export type CoverPickerProps = {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  onBusy: (busy: boolean) => void;
};
export const CoverPicker = ({
  value,
  onChange,
  disabled,
  onBusy,
}: CoverPickerProps) => {
  const file = useCoverFile(onChange, onBusy);
  return (
    <section className={styles.editor} aria-label="Обложка встречи">
      <h2>Обложка</h2>
      <button
        type="button"
        className={styles.media}
        data-filled={!!value}
        onClick={() => file.input.current?.click()}
        disabled={disabled}
        aria-label={value ? "Изменить фото обложки" : "Добавить фото обложки"}
      >
        {value ? (
          <img src={value} alt="Обложка встречи" />
        ) : (
          <div className={styles.empty}>
            <ImagePlus size={38} strokeWidth={1.3} />
            <span>Фото для вашей встречи</span>
          </div>
        )}
      </button>
      <div className={styles.tools}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => file.input.current?.click()}
        >
          <Upload size={16} strokeWidth={1.7} />
          {value ? "Изменить фото" : "Добавить фото"}
        </button>
        {value && (
          <button
            type="button"
            disabled={disabled}
            aria-label="Убрать обложку"
            onClick={() => onChange("")}
          >
            <Trash2 size={16} strokeWidth={1.7} />
          </button>
        )}
      </div>
      <p className={styles.hint}>JPG, PNG или WebP до 5 МБ</p>
      {file.error && <FieldMessage id="cover-error" error={file.error} />}
      <input
        ref={file.input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={file.choose}
        hidden
        disabled={disabled}
        aria-label="Файл обложки"
      />
    </section>
  );
};

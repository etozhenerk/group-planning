import { Map } from "lucide-react";
import { TextField } from "@future/shared/ui/TextField";
import styles from "@future/features/select-place/ui/PlaceField/PlaceField.module.css";

export type PlaceFieldProps = {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  onOpen: () => void;
  selected: boolean;
};
export const PlaceField = ({
  value,
  onChange,
  disabled,
  onOpen,
  selected,
}: PlaceFieldProps) => (
  <div className={styles.field}>
    <TextField
      label="Место"
      value={value}
      onChange={onChange}
      placeholder="Адрес, название или ориентир"
      maxLength={500}
      disabled={disabled}
    />
    <button
      type="button"
      className={styles.map}
      onClick={onOpen}
      disabled={disabled}
    >
      <Map size={16} strokeWidth={1.7} />
      {selected ? "Изменить на карте" : "Выбрать на карте"}
    </button>
  </div>
);

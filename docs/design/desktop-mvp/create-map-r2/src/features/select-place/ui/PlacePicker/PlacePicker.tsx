import { X } from "lucide-react";
import { useModal } from "@future/shared/lib/dialog";
import { usePlacePicker } from "@future/features/select-place/model/usePlacePicker";
import { SearchPanel } from "@future/features/select-place/ui/SearchPanel";
import { MapSurface } from "@future/features/select-place/ui/MapSurface";
import styles from "@future/features/select-place/ui/PlacePicker/PlacePicker.module.css";

export type PlacePickerProps = {
  model: ReturnType<typeof usePlacePicker>;
  confirm: () => void;
};
export const PlacePicker = ({ model, confirm }: PlacePickerProps) => {
  const ref = useModal(model.open, 'input[aria-label="Поиск места"]');
  return (
    <dialog
      className={styles.dialog}
      ref={ref}
      aria-labelledby="place-picker-title"
      onCancel={(event) => {
        event.preventDefault();
        model.close();
      }}
    >
      <header className={styles.header}>
        <h2 id="place-picker-title">Выберите место встречи</h2>
        <button
          type="button"
          aria-label="Закрыть выбор места"
          onClick={model.close}
        >
          <X size={20} strokeWidth={1.7} />
        </button>
      </header>
      <div className={styles.body}>
        <SearchPanel
          query={model.query}
          setQuery={model.setQuery}
          results={model.results}
          candidate={model.candidate}
          choose={model.choose}
          confirm={confirm}
          mode={model.mode}
          retry={() => model.setMode("ready")}
        />
        <MapSurface
          candidate={model.candidate}
          point={model.point}
          mode={model.mode}
          retry={() => model.setMode("ready")}
          manual={model.close}
        />
      </div>
    </dialog>
  );
};

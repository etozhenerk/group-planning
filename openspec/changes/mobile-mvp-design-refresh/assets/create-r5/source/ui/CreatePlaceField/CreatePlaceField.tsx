import { useEffect, useState } from "react";
import { Map, MapPin } from "lucide-react";
import { CreateMapDialog } from "@preview/ui/CreateMapDialog";
import type { PlaceLocation } from "@preview/placeLocations";
import styles from "@preview/ui/CreatePlaceField/CreatePlaceField.module.css";
export type CreatePlaceFieldProps = {
  value: string;
  change: (value: string) => void;
  disabled: boolean;
};
export const CreatePlaceField = ({
  value,
  change,
  disabled,
}: CreatePlaceFieldProps) => {
  const [open, setOpen] = useState(
      new URLSearchParams(location.search).get("state") === "map",
    ),
    [chosen, setChosen] = useState<PlaceLocation | null>(null);
  useEffect(()=>{const reset=(event:MessageEvent)=>{if(event.source===parent&&event.data?.type==="create-preview-state"){setOpen(event.data.value==="map");setChosen(null)}};window.addEventListener("message",reset);return()=>window.removeEventListener("message",reset)},[]);
  useEffect(() => {
    if (chosen && value !== chosen.name + ", " + chosen.address)
      setChosen(null);
  }, [value]);
  return (
    <div className={styles.field}>
      <label htmlFor="create-place">Место</label>
      {chosen ? (
        <div className={styles.selected}>
          <MapPin size={20} />
          <div>
            <strong>{chosen.name}</strong>
            <span>{chosen.address}</span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => setOpen(true)}
            >
              Изменить место
            </button>
          </div>
        </div>
      ) : (
        <input
          id="create-place"
          maxLength={500}
          value={value}
          disabled={disabled}
          onChange={(event) => change(event.target.value)}
          placeholder="Адрес, название или ориентир"
        />
      )}
      {!chosen ? (
        <button
          type="button"
          className={styles.mapButton}
          disabled={disabled}
          onClick={() => setOpen(true)}
        >
          <Map size={18} />
          Выбрать на карте
        </button>
      ) : (
        <button
          className={styles.manual}
          type="button"
          disabled={disabled}
          onClick={() => setChosen(null)}
        >
          Ввести адрес вручную
        </button>
      )}
      {open && (
        <CreateMapDialog
          selected={chosen}
          close={() => setOpen(false)}
          choose={(place) => {
            setChosen(place);
            change(place.name + ", " + place.address);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
};

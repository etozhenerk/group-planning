import { useLayoutEffect, useRef } from "react";
import { PlacePicker } from "@preview/ui/PlacePicker";
import type { PlaceLocation } from "@preview/placeLocations";
import styles from "@preview/ui/CreateMapDialog/CreateMapDialog.module.css";
export type CreateMapDialogProps = {
  selected: PlaceLocation | null;
  choose: (place: PlaceLocation) => void;
  close: () => void;
};
export const CreateMapDialog = ({
  selected,
  choose,
  close,
}: CreateMapDialogProps) => {
  const ref = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    const element = ref.current,
      previous = document.activeElement;
    element?.showModal();
    return () => {
      element?.close();
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={styles.overlay}
      aria-label="Выбрать место"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <PlacePicker
        selected={selected}
        choose={choose}
        cancel={close}
        mode="map" backLabel="К созданию встречи"
      />
    </dialog>
  );
};

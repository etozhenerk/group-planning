import { MapPin, Plus, Minus, LoaderCircle, Map, RotateCw } from "lucide-react";
import { useMapPan } from "@future/features/select-place/model/useMapPan";
import type { Place } from "@future/features/select-place/model/places";
import styles from "@future/features/select-place/ui/MapSurface/MapSurface.module.css";

export type MapSurfaceProps = {
  candidate: Place;
  point: (x: number, y: number) => void;
  mode: string;
  retry: () => void;
  manual: () => void;
};
export const MapSurface = ({
  candidate,
  point,
  mode,
  retry,
  manual,
}: MapSurfaceProps) => {
  const pan = useMapPan(point);
  return (
    <div
      className={styles.surface}
      aria-label="Карта выбора места"
      data-testid="map-surface"
      onPointerDown={["loading", "error"].includes(mode) ? undefined : pan.down}
      onPointerMove={pan.move}
      onPointerUp={pan.up}
      onPointerCancel={pan.cancel}
    >
      <div
        className={styles.world}
        style={{
          transform: `translate(${pan.view.x}px,${pan.view.y}px) scale(${pan.view.zoom})`,
        }}
      >
        <img
          src="./map-base.png"
          alt="Схема района Покровки в Москве"
          draggable={false}
        />
        <div
          className={styles.marker}
          style={{ left: candidate.x + "%", top: candidate.y + "%" }}
        >
          <span>{candidate.name}</span>
          <MapPin size={44} fill="currentColor" strokeWidth={1.5} />
          <i />
        </div>
      </div>
      <div className={styles.tools}>
        <button
          type="button"
          aria-label="Приблизить карту"
          onClick={() => pan.zoom(0.2)}
        >
          <Plus size={20} strokeWidth={1.7} />
        </button>
        <button
          type="button"
          aria-label="Отдалить карту"
          onClick={() => pan.zoom(-0.2)}
        >
          <Minus size={20} strokeWidth={1.7} />
        </button>
      </div>
      <p className={styles.tip}>Нажмите на карту, чтобы выбрать точку</p>
      <div className={styles.credit}>
        <a
          href="https://yandex.ru/maps/?ll=37.6421%2C55.7585&z=16"
          target="_blank"
          rel="noreferrer"
        >
          © Яндекс · Яндекс Карты
        </a>
        <span>Схема для макета</span>
      </div>
      {["loading", "error"].includes(mode) && (
        <div className={styles.overlay}>
          <div
            className={styles.problem}
            role={mode === "error" ? "alert" : "status"}
          >
            {mode === "loading" ? (
              <LoaderCircle className={styles.spinner} size={28} />
            ) : (
              <Map size={32} strokeWidth={1.5} />
            )}
            <h3>
              {mode === "loading" ? "Загружаем карту" : "Карта не загрузилась"}
            </h3>
            {mode === "error" && (
              <>
                <p>Вы можете повторить загрузку или указать адрес в форме.</p>
                <button type="button" onClick={retry}>
                  <RotateCw size={16} />
                  Повторить загрузку
                </button>
                <button
                  type="button"
                  className={styles.manual}
                  onClick={manual}
                >
                  Ввести адрес вручную
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

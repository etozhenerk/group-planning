import { useMapViewport } from "@preview/useMapViewport";
import { MapPin, Plus, Minus } from "lucide-react";
import type { PlaceLocation } from "@preview/placeLocations";
import { locations } from "@preview/placeLocations";
import styles from "@preview/ui/MapCanvas/MapCanvas.module.css";
export type MapCanvasProps = {
  selected: PlaceLocation;
  choose: (place: PlaceLocation) => void;
};
export const MapCanvas = ({ selected, choose }: MapCanvasProps) => {
  const viewport = useMapViewport(() => choose(locations[2]));
  return (
    <div
      className={styles.map}
      tabIndex={0}
      role="region"
      aria-label="Карта выбора места"
      data-testid="map-viewport"
      data-pan-y={viewport.view.y}
      data-pan-x={viewport.view.x}
      data-zoom={viewport.view.scale}
      {...viewport.events}
    >
      <div
        className={styles.world}
        style={{
          transform: `translate(${viewport.view.x}px,${viewport.view.y}px) scale(${viewport.view.scale})`,
        }}
      >
        <svg
          className={styles.scheme}
          viewBox="0 0 390 500"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="blocks"
              width="85"
              height="95"
              patternTransform="rotate(-23)"
              patternUnits="userSpaceOnUse"
            >
              <rect width="85" height="95" fill="#e7e5df" />
              <rect
                x="10"
                y="10"
                width="28"
                height="24"
                rx="2"
                fill="#d5d3cd"
              />
              <rect
                x="44"
                y="10"
                width="28"
                height="24"
                rx="2"
                fill="#d9d6cf"
              />
              <rect
                x="10"
                y="42"
                width="62"
                height="17"
                rx="2"
                fill="#d6d4cf"
              />
              <rect
                x="10"
                y="65"
                width="25"
                height="20"
                rx="2"
                fill="#d4d2cd"
              />
              <rect
                x="42"
                y="65"
                width="30"
                height="20"
                rx="2"
                fill="#d4d2cd"
              />
              <path d="M0 0V95M0 0H85" stroke="#f7f5ee" strokeWidth="12" />
            </pattern>
          </defs>
          <rect width="390" height="500" fill="url(#blocks)" />
          <path d="M282-20L420 10V168L335 205 284 145 259 53Z" fill="#c9d8b7" />
          <path
            d="M332-20L363 116 394 158"
            fill="none"
            stroke="#b3cfcf"
            strokeWidth="24"
          />
          <path
            d="M343-20L373 116 404 158"
            fill="none"
            stroke="#e9eee1"
            strokeWidth="4"
          />
          <path
            d="M-20 327Q137 288 410 185"
            fill="none"
            stroke="#d2cfc4"
            strokeWidth="25"
          />
          <path
            d="M-20 327Q137 288 410 185"
            fill="none"
            stroke="#fffdf5"
            strokeWidth="20"
          />
          <path
            d="M72-20L282 520"
            fill="none"
            stroke="#ceccc6"
            strokeWidth="16"
          />
          <path
            d="M72-20L282 520"
            fill="none"
            stroke="#fffdf8"
            strokeWidth="12"
          />
          <path
            d="M-20 132L410 398"
            fill="none"
            stroke="#d6d3ca"
            strokeWidth="12"
          />
          <path
            d="M-20 132L410 398"
            fill="none"
            stroke="#fbfaf5"
            strokeWidth="9"
          />
          <g fontFamily="system-ui" fontSize="11" fill="#6f716b">
            <text x="223" y="228" transform="rotate(-21 223 228)">
              Покровка
            </text>
            <text x="18" y="309" transform="rotate(-17 18 309)">
              Маросейка
            </text>
            <text x="212" y="382" transform="rotate(68 212 382)">
              Армянский переулок
            </text>
            <text x="295" y="93" fill="#6c8563">
              Чистые
            </text>
            <text x="299" y="109" fill="#6c8563">
              пруды
            </text>
          </g>
          <g fill="#a9a79e" fontFamily="system-ui" fontSize="8">
            <text x="75" y="256">
              10
            </text>
            <text x="149" y="223">
              12
            </text>
            <text x="223" y="203">
              16
            </text>
            <text x="267" y="183">
              18
            </text>
            <text x="111" y="364">
              8
            </text>
            <text x="54" y="401">
              6
            </text>
          </g>
        </svg>
        <div
          className={styles.pin}
          style={{
            left:
              (selected.kind === "point"
                ? 54
                : selected.id === "demo-cafe"
                  ? 70
                  : 40) + "%",
            top:
              (selected.kind === "point"
                ? 54
                : selected.id === "demo-cafe"
                  ? 43
                  : 62) + "%",
          }}
        >
          <span className={styles.label}>
            {selected.kind === "point"
              ? "Точка встречи"
              : selected.id === "demo-cafe"
                ? "Кафе"
                : "Пиццерия"}
          </span>
          <MapPin size={42} fill="currentColor" strokeWidth={1.6} />
          <span className={styles.shadow} />
        </div>
      </div>
      <div className={styles.tools}>
        <button
          type="button"
          aria-label="Приблизить карту"
          onClick={() => viewport.zoom(0.2)}
        >
          <Plus size={20} />
        </button>
        <button
          type="button"
          aria-label="Отдалить карту"
          onClick={() => viewport.zoom(-0.2)}
        >
          <Minus size={20} />
        </button>
      </div>
      <button
        type="button"
        className={styles.pickPoint}
        onClick={() => choose(locations[2])}
      >
        Выбрать точку на карте
      </button>
      <div className={styles.scale}>100 м</div>
      <small className={styles.credit}>Схема для превью</small>
    </div>
  );
};

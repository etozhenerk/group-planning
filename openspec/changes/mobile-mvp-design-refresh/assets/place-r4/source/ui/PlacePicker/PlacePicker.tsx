import { useFullscreenMap } from "@preview/useFullscreenMap";
import { MapHeader } from "@preview/ui/MapHeader";
import { useState } from "react";
import { Search, MapPin, TriangleAlert, X, ChevronRight } from "lucide-react";
import { MapCanvas } from "@preview/ui/MapCanvas";
import { locations } from "@preview/placeLocations";
import type { PlaceLocation } from "@preview/placeLocations";
import styles from "@preview/ui/PlacePicker/PlacePicker.module.css";
export type PlacePickerProps = {
  selected: PlaceLocation | null;
  choose: (place: PlaceLocation) => void;
  cancel: () => void;
  mode: string; backLabel?:string;
};
export const PlacePicker = ({
  selected,
  choose,
  cancel,
  mode,
  backLabel="К предложению места",
}: PlacePickerProps) => {
  const root = useFullscreenMap();
  const [query, setQuery] = useState(""),
    [candidate, setCandidate] = useState<PlaceLocation>(
      selected ?? locations[0],
    ),
    [problem, setProblem] = useState(mode === "map-error");
  const results = locations.filter(
    (place) =>
      place.kind === "business" &&
      (place.name + " " + place.address)
        .toLowerCase()
        .includes(query.toLowerCase().trim()),
  );
  return (
    <div ref={root} className={styles.picker} data-testid="fullscreen-map">
      <MapHeader back={cancel} label={backLabel}/>
      <div className={styles.mapArea}>
        {problem ? (
          <div className={styles.problem} role="alert">
            <TriangleAlert size={24} />
            <strong>Карта не загрузилась</strong>
            <p>Можно повторить или указать адрес в форме.</p>
            <button type="button" onClick={() => setProblem(false)}>
              Повторить
            </button>
            <button type="button" onClick={cancel}>
              Ввести адрес вручную
            </button>
          </div>
        ) : (
          <MapCanvas
            selected={candidate}
            choose={(place) => {
              setCandidate(place);
              setQuery("");
            }}
          />
        )}
        <div className={styles.searchPanel}>
          <div className={styles.search}>
            <Search size={18} />
            <input
              aria-label="Поиск места"
              placeholder="Найти место или адрес"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query && (
              <button
                type="button"
                aria-label="Очистить поиск"
                onClick={() => setQuery("")}
              >
                <X size={16} />
              </button>
            )}
          </div>
          {!!query && (
            <div className={styles.results}>
              {results.length ? (
                results.map((place) => (
                  <button
                    key={place.id}
                    type="button"
                    className={styles.result}
                    onClick={() => {
                      setCandidate(place);
                      setQuery("");
                    }}
                  >
                    <MapPin size={18} />
                    <span>
                      <strong>{place.name}</strong>
                      <small>{place.address}</small>
                    </span>
                    <ChevronRight size={16} />
                  </button>
                ))
              ) : (
                <p className={styles.empty}>
                  Ничего не нашли. Попробуйте другой запрос или отметьте точку
                  на карте.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      <div className={styles.footer} data-testid="map-picker-footer">
        <div className={styles.chosen}>
          <span className={styles.placeIcon}>
            <MapPin size={22} />
          </span>
          <div>
            <small>
              {candidate.kind === "point" ? "Выбрана точка" : "Выбрано место"}
            </small>
            <strong>{candidate.name}</strong>
            <p>{candidate.address}</p>
          </div>
        </div>
        <button
          className={styles.confirm}
          type="button"
          disabled={problem}
          onClick={() => choose(candidate)}
        >
          Выбрать это место
        </button>
      </div>
    </div>
  );
};

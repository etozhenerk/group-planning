import { Search, MapPin, X, Check, TriangleAlert } from "lucide-react";
import type { Place } from "@future/features/select-place/model/places";
import styles from "@future/features/select-place/ui/SearchPanel/SearchPanel.module.css";

export type SearchPanelProps = {
  query: string;
  setQuery: (query: string) => void;
  results: Place[];
  candidate: Place;
  choose: (place: Place) => void;
  confirm: () => void;
  mode: string;
  retry: () => void;
};
export const SearchPanel = ({
  query,
  setQuery,
  results,
  candidate,
  choose,
  confirm,
  mode,
  retry,
}: SearchPanelProps) => (
  <aside className={styles.panel} aria-label="Поиск и выбор места">
    <div className={styles.search}>
      <Search size={18} strokeWidth={1.7} />
      <input
        aria-label="Поиск места"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Место или адрес"
        autoComplete="off"
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
    <div className={styles.results} aria-label="Результаты поиска">
      {mode === "search-error" ? (
        <div className={styles.empty} role="alert">
          <TriangleAlert size={22} />
          <strong>Не удалось найти место</strong>
          <p>Повторите поиск или выберите точку на карте.</p>
          <button type="button" onClick={retry}>
            Повторить поиск
          </button>
        </div>
      ) : results.length ? (
        results.map((place) => (
          <button
            type="button"
            key={place.id}
            className={styles.result}
            aria-pressed={place.id === candidate.id}
            onClick={() => choose(place)}
          >
            <MapPin size={19} strokeWidth={1.6} />
            <span>
              <strong>{place.name}</strong>
              <small>{place.address}</small>
            </span>
            {place.id === candidate.id && <Check size={17} strokeWidth={1.7} />}
          </button>
        ))
      ) : (
        <div className={styles.empty}>
          <Search size={23} strokeWidth={1.5} />
          <strong>Ничего не нашли</strong>
          <p>Попробуйте другой запрос или выберите точку на карте.</p>
        </div>
      )}
    </div>
    <div className={styles.selection}>
      <small>
        {candidate.kind === "point" ? "Выбрана точка" : "Выбрано место"}
      </small>
      <strong>{candidate.name}</strong>
      <p>{candidate.address}</p>
      <button
        type="button"
        className={styles.confirm}
        onClick={confirm}
        disabled={["loading", "error"].includes(mode)}
      >
        Выбрать это место
      </button>
    </div>
  </aside>
);

import { useState } from "react";
import { places } from "@future/features/select-place/model/places";
import type { Place } from "@future/features/select-place/model/places";

export const usePlacePicker = () => {
  const [open, setOpen] = useState(
    new URLSearchParams(location.search).has("map"),
  );
  const [selected, setSelected] = useState<Place | null>(null);
  const [candidate, setCandidate] = useState<Place>(places[0]!);
  const [query, setQuery] = useState("Покровка");
  const [mode, setMode] = useState(
    new URLSearchParams(location.search).get("mapState") ?? "ready",
  );
  const changeMode = (value: string) => {
    setMode(value);
    setQuery(value === "empty" ? "Несуществующий адрес" : "Покровка");
    setOpen(true);
  };
  return {
    open,
    selected,
    candidate,
    query,
    setQuery,
    mode,
    setMode,
    changeMode,
    show: () => {
      setCandidate(selected ?? places[0]!);
      setOpen(true);
    },
    close: () => setOpen(false),
    choose: (place: Place) => setCandidate(place),
    point: (x: number, y: number) =>
      setCandidate({
        id: "point",
        name: "Точка на карте",
        address: "Москва, улица Покровка",
        kind: "point",
        x,
        y,
      }),
    confirm: () => {
      setSelected(candidate);
      setOpen(false);
      return candidate.address;
    },
    clear: () => setSelected(null),
    results: places.filter((place) =>
      (place.name + " " + place.address)
        .toLocaleLowerCase("ru")
        .includes(query.toLocaleLowerCase("ru").trim()),
    ),
  };
};

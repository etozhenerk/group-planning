export type PlaceLocation = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  kind: "business" | "point";
  x: number;
  y: number;
};
export const locations: PlaceLocation[] = [
  {
    id: "demo-pizza",
    name: "Пиццерия на Маросейке",
    address: "Москва, Маросейка, 12",
    latitude: 55.7581,
    longitude: 37.6394,
    kind: "business",
    x: 38,
    y: 57,
  },
  {
    id: "demo-cafe",
    name: "Кафе на Покровке",
    address: "Москва, Покровка, 18",
    latitude: 55.7592,
    longitude: 37.6452,
    kind: "business",
    x: 72,
    y: 35,
  },
  {
    id: "demo-point",
    name: "Точка на карте",
    address: "Москва, Покровка, 12",
    latitude: 55.7585,
    longitude: 37.6421,
    kind: "point",
    x: 56,
    y: 46,
  },
];

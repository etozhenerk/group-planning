export type Place = {
  id: string;
  name: string;
  address: string;
  x: number;
  y: number;
  kind: "address" | "point";
};
export const places: Place[] = [
  {
    id: "pokrovka-8",
    name: "Покровка, 8",
    address: "Москва, улица Покровка, 8",
    x: 45,
    y: 58,
    kind: "address",
  },
  {
    id: "pokrovka-12",
    name: "Покровка, 12",
    address: "Москва, улица Покровка, 12",
    x: 55,
    y: 48,
    kind: "address",
  },
  {
    id: "pokrovka-18",
    name: "Покровка, 18",
    address: "Москва, улица Покровка, 18",
    x: 66,
    y: 38,
    kind: "address",
  },
];

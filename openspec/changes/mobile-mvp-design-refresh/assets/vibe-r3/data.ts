export type Photo = {
  id: string;
  src: string;
  name: string;
  author: string;
  type: string;
};
export const initialPhotos: Photo[] = [
  {
    id: "friends",
    src: "./friends.png",
    name: "Фото встречи 1.png",
    author: "Лена",
    type: "image/png",
  },
  {
    id: "boardgame",
    src: "./boardgame.png",
    name: "Фото встречи 2.png",
    author: "Саша",
    type: "image/png",
  },
  {
    id: "dinner",
    src: "./dinner.png",
    name: "Фото встречи 3.png",
    author: "Миша",
    type: "image/png",
  },
];
export const initialMode =
  new URLSearchParams(location.search).get("state") ?? "ready";
export const initialPlatform =
  new URLSearchParams(location.search).get("platform") ?? "web";

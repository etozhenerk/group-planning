import type { SavedInvitation } from "@/entities/meeting";

const base = {
  description: null,
  startsAt: "2026-11-06T17:00:00Z",
  startsOn: "2026-11-06",
  timezone: "Europe/Moscow",
  place: "Кафе «Соседи», Покровка, 8",
  coverUrl: "/dinner",
  myRsvp: "maybe" as const,
  myRsvpRevision: "1",
  organizer: { id: "lena", displayName: "Лена" },
};

export const invitations: SavedInvitation[] = [
  {
    path: "/i/dinner",
    preview: { ...base, meetingId: "dinner", title: "Ужин в пятницу" },
  },
  {
    path: "/i/boardgame",
    preview: {
      ...base,
      meetingId: "boardgame",
      title: "Настолки у Саши",
      startsAt: "2026-11-07T16:00:00Z",
      startsOn: "2026-11-07",
      place: "У Саши дома",
      coverUrl: "/boardgame",
      organizer: { id: "sasha", displayName: "Саша" },
    },
  },
  {
    path: "/i/coffee",
    preview: {
      ...base,
      meetingId: "coffee",
      title: "Воскресный кофе",
      startsAt: "2026-11-08T09:00:00Z",
      startsOn: "2026-11-08",
      place: null,
      coverUrl: null,
      organizer: { id: "dima", displayName: "Дима" },
    },
  },
];

export const moreInvitations: SavedInvitation[] = Array.from(
  { length: 6 },
  (_, index) => ({
    path: `/i/more-${index}`,
    preview: {
      ...base,
      meetingId: `more-${index}`,
      title: [
        "Прогулка в парке",
        "Ужин после работы",
        "Пицца и кино",
        "Воскресный завтрак",
        "Вечер настолок",
        "Встречаем зиму",
      ][index]!,
      startsAt: `2026-11-${String(14 + index).padStart(2, "0")}T16:00:00Z`,
      startsOn: `2026-11-${String(14 + index).padStart(2, "0")}`,
      place: index % 2 ? "У Лены дома" : "Кафе «Соседи»",
      coverUrl: index % 2 ? null : "/dinner",
    },
  }),
);

export const portrait = (id: string) =>
  ["lena", "sasha", "dima"].includes(id) ? `./avatars/${id}.jpg` : null;

export type PersonId = "sasha" | "lena" | "tim" | "masha" | "olya" | "dima";
export type SheetName =
  | "info"
  | "share"
  | "settings"
  | "task"
  | "date"
  | "place"
  | "new-task"
  | "reactors"
  | "confirm-task"
  | "rsvp"
  | "attachment";
export type TaskStatus =
  "proposed" | "accepted" | "done" | "declined" | "cancelled";

export type Person = {
  id: PersonId;
  name: string;
  initial: string;
  color: string;
  response: string;
};
export type Message = {
  id: string;
  author: PersonId;
  text: string;
  time: string;
  reactions: Record<string, PersonId[]>;
};
export type Task = {
  title: string;
  author: PersonId;
  recipient: PersonId | "any";
  assignee: PersonId | null;
  status: TaskStatus;
};
export type DateDraft = {
  dates: string[];
  endDate: string;
  endTime: string;
  multiple: boolean;
  change: boolean;
  add: boolean;
  anonymous: boolean;
  hidden: boolean;
};

export type PrototypeState = {
  user: PersonId;
  draft: string;
  selection: { start: number; end: number };
  messages: Message[];
  recent: string[];
  emojiOpen: boolean;
  emojiCategory: string;
  emojiQuery: string;
  menuOpen: boolean;
  reaction: {
    messageId: string;
    expanded: boolean;
    category: string;
    query: string;
  } | null;
  sheet: SheetName | null;
  sheetReturn: SheetName | null;
  sheetOpener: HTMLElement | null;
  peopleExpanded: boolean;
  reactorFilter: string;
  reactorMessage: string;
  task: Task;
  pendingTaskAction: "cancel" | "decline" | null;
  meeting: {
    title: string;
    description: string;
    date: string;
    time: string;
    place: string;
    cover: boolean;
  };
  settingsDraft: PrototypeState["meeting"] | null;
  dateDraft: DateDraft;
  placeDraft: { place: string; why: string; endDate: string; endTime: string };
  taskDraft: { title: string; recipient: PersonId | "any" };
  calendar: { target: string; year: number; month: number } | null;
  vote: "for" | "against" | null;
  activePlacePoll: boolean;
  systems: string[];
  published: {
    kind: "date" | "place" | "task";
    title: string;
    detail: string;
  }[];
};

export const people: Person[] = [
  {
    id: "sasha",
    name: "Саша",
    initial: "С",
    color: "sand",
    response: "Организатор",
  },
  { id: "lena", name: "Лена", initial: "Л", color: "lilac", response: "Приду" },
  {
    id: "tim",
    name: "Тимофей",
    initial: "Т",
    color: "mint",
    response: "Приду",
  },
  { id: "masha", name: "Маша", initial: "М", color: "blue", response: "Приду" },
  {
    id: "olya",
    name: "Оля",
    initial: "О",
    color: "lilac",
    response: "Возможно",
  },
  {
    id: "dima",
    name: "Дима",
    initial: "Д",
    color: "sand",
    response: "Не смогу",
  },
];

export const person = (id: PersonId): Person =>
  people.find((item) => item.id === id) ?? people[0]!;

export const createState = (): PrototypeState => ({
  user: "sasha",
  draft: "Я захвачу ",
  selection: { start: 10, end: 10 },
  messages: [
    {
      id: "m1",
      author: "lena",
      text: "В субботу у меня свободен весь вечер. Давайте наконец соберёмся?",
      time: "12:31",
      reactions: { "❤️": ["tim", "masha"] },
    },
    {
      id: "m2",
      author: "sasha",
      text: "Давайте! Принесу настолки, а с вас хорошее настроение",
      time: "12:33",
      reactions: { "🔥": ["lena"] },
    },
    {
      id: "m3",
      author: "tim",
      text: "Я за 🍕 Можно заказать пиццу и никуда не торопиться",
      time: "12:35",
      reactions: { "👍": ["lena", "masha"], "🍕": ["sasha"] },
    },
  ],
  recent: [
    "❤️",
    "😂",
    "👍",
    "🥰",
    "🔥",
    "🎉",
    "🍕",
    "✨",
    "🤗",
    "👀",
    "🙌",
    "☕",
  ],
  emojiOpen: false,
  emojiCategory: "recent",
  emojiQuery: "",
  menuOpen: false,
  reaction: null,
  sheet: null,
  sheetReturn: null,
  sheetOpener: null,
  peopleExpanded: false,
  reactorFilter: "all",
  reactorMessage: "m3",
  task: {
    title: "Заказать пиццу",
    author: "lena",
    recipient: "sasha",
    assignee: null,
    status: "proposed",
  },
  pendingTaskAction: null,
  meeting: {
    title: "Вечер без планов",
    description: "Пицца, настолки и разговоры до ночи. Приносите любимую игру.",
    date: "2026-10-31",
    time: "19:00",
    place: "У Саши дома",
    cover: true,
  },
  settingsDraft: null,
  dateDraft: {
    dates: ["2026-11-01", "2026-11-07"],
    endDate: "2026-10-30",
    endTime: "18:00",
    multiple: true,
    change: true,
    add: true,
    anonymous: false,
    hidden: false,
  },
  placeDraft: { place: "", why: "", endDate: "2026-10-30", endTime: "18:00" },
  taskDraft: { title: "", recipient: "any" },
  calendar: null,
  vote: null,
  activePlacePoll: true,
  systems: [],
  published: [],
});

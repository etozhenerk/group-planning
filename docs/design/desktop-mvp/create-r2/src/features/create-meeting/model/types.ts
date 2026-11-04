export type Draft = {
  title: string;
  date: string;
  time: string;
  place: string;
  description: string;
  cover: string;
};

export type Errors = Partial<Record<"title" | "date" | "time", string>>;

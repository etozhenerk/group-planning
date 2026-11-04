import type {
  Draft,
  Errors,
} from "@future/features/create-meeting/model/types";

export const blank: Draft = {
  title: "",
  date: "",
  time: "",
  place: "",
  description: "",
  cover: "",
};
export const filled: Draft = {
  title: "Ужин в пятницу",
  date: "2026-11-06",
  time: "20:00",
  place: "Кафе «Соседи», Покровка, 8",
  description:
    "Соберёмся после работы. Столик на шестерых, пиццу закажем на месте.",
  cover: "./dinner.png",
};
export const validate = (draft: Draft): Errors => ({
  ...(!draft.title.trim() ? { title: "Введите название встречи" } : {}),
  ...(!draft.date ? { date: "Выберите дату встречи" } : {}),
  ...(draft.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.time)
    ? { time: "Введите время в формате ЧЧ:ММ" }
    : {}),
});
export const readDraft = (): Draft => {
  try {
    const value: unknown = JSON.parse(
      sessionStorage.getItem("desktop-create-draft") ?? "null",
    );
    if (
      value &&
      typeof value === "object" &&
      Object.keys(blank).every(
        (key) => key in value && typeof Reflect.get(value, key) === "string",
      )
    ) {
      return { ...blank, ...value };
    }
  } catch {
    /* An unavailable draft does not prevent creating a meeting. */
  }
  return { ...blank };
};

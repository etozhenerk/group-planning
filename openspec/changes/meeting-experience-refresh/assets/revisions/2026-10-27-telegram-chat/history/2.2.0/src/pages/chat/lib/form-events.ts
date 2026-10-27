import { type Context } from "@prototype/pages/chat/model/context";
import { person, type PersonId } from "@prototype/pages/chat/model/model";
import { dateLabel, find } from "@prototype/shared/lib/dom";
import { calendarView } from "@prototype/pages/chat/ui/forms";

export const installFormEvents = (context: Context): void => {
  const { state } = context;
  const sheet = find("#sheet");

  sheet.addEventListener("input", (event) => {
    const target = event.target as HTMLInputElement;
    const name = target.name;

    if (
      state.sheet === "settings" &&
      state.settingsDraft &&
      ["title", "description", "time", "place"].includes(name)
    ) {
      Object.assign(state.settingsDraft, { [name]: target.value });
    }

    if (state.sheet === "date") {
      Object.assign(state.dateDraft, {
        [name]: target.type === "checkbox" ? target.checked : target.value,
      });
    }

    if (state.sheet === "place") {
      Object.assign(state.placeDraft, { [name]: target.value });
    }

    if (state.sheet === "new-task") {
      Object.assign(state.taskDraft, { [name]: target.value });
    }
  });

  sheet.addEventListener("submit", (event) => {
    event.preventDefault();

    if (state.sheet === "settings" && state.settingsDraft) {
      if (!state.settingsDraft.title.trim()) {
        showError("Введите название встречи");

        return;
      }

      state.meeting = { ...state.settingsDraft };
      state.systems.push("Настройки встречи изменены · Саша.");
      context.redrawInfo();
      context.redrawConversation();
      context.closeSheet();
      context.toast("Настройки изменены в макете");
    } else if (state.sheet === "date") {
      const uniqueDates = [...new Set(state.dateDraft.dates)];

      if (
        uniqueDates.length < 2 ||
        uniqueDates.length !== state.dateDraft.dates.length
      ) {
        showError("Выберите минимум две разные даты");

        return;
      }

      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(state.dateDraft.endTime)) {
        showError("Укажите время окончания в формате ЧЧ:ММ");

        return;
      }

      state.published.push({
        kind: "date",
        title: "Новая дата встречи",
        detail: `${uniqueDates
          .sort()
          .map((value) => dateLabel(value))
          .join(
            " · ",
          )}. ${state.dateDraft.hidden ? "Итоги скрыты до завершения." : "Опрос открыт."}`,
      });
      context.closeSheet();
      context.redrawConversation(true);
      context.toast("Опрос добавлен в макет");
    } else if (
      state.sheet === "place" &&
      !state.activePlacePoll &&
      state.placeDraft.place.trim()
    ) {
      state.published.push({
        kind: "place",
        title: state.placeDraft.place.trim(),
        detail:
          state.placeDraft.why.trim() ||
          "Предложение нового места. Текущее место пока прежнее.",
      });
      state.activePlacePoll = true;
      state.placeDraft = {
        place: "",
        why: "",
        endDate: "2026-10-30",
        endTime: "18:00",
      };
      context.closeSheet();
      context.redrawConversation(true);
      context.toast("Опрос добавлен в макет");
    } else if (state.sheet === "new-task" && state.taskDraft.title.trim()) {
      const recipient = state.taskDraft.recipient;
      state.published.push({
        kind: "task",
        title: state.taskDraft.title.trim(),
        detail:
          recipient === "any"
            ? "Предложено всем. Задача ещё не принята."
            : `Предложено: ${person(recipient as PersonId).name}. Задача ещё не принята.`,
      });
      state.taskDraft = { title: "", recipient: "any" };
      context.closeSheet();
      context.redrawConversation(true);
      context.toast("Задача добавлена в макет");
    }
  });

  const showError = (message: string): void => {
    const error = find("#form-error");
    error.textContent = message;
    error.hidden = false;
    error.scrollIntoView({ block: "nearest" });
  };
};

export const handleCalendar = (
  context: Context,
  action: string,
  target: HTMLElement,
): boolean => {
  const { state } = context;

  if (action === "calendar") {
    const value = new Date(`${target.dataset.value}T12:00:00`);
    state.calendar = {
      target: target.dataset.target ?? "",
      year: value.getFullYear(),
      month: value.getMonth(),
    };
  } else if (action === "calendar-prev" || action === "calendar-next") {
    if (state.calendar) {
      const value = new Date(
        state.calendar.year,
        state.calendar.month + (action === "calendar-next" ? 1 : -1),
        1,
      );
      state.calendar = {
        ...state.calendar,
        year: value.getFullYear(),
        month: value.getMonth(),
      };
    }
  } else if (action === "calendar-close") {
    state.calendar = null;
  } else if (action === "pick-date" && state.calendar) {
    const value = target.dataset.date ?? "2026-10-31";
    const field = state.calendar.target;

    if (field === "settings-date" && state.settingsDraft) {
      state.settingsDraft.date = value;
    } else if (field === "date-end") {
      state.dateDraft.endDate = value;
    } else if (field === "place-end") {
      state.placeDraft.endDate = value;
    } else if (field.startsWith("date-")) {
      state.dateDraft.dates[Number(field.split("-")[1])] = value;
    }

    state.calendar = null;
    context.redrawSheet();
    document
      .querySelector<HTMLButtonElement>(`[data-target="${field}"]`)
      ?.focus({ preventScroll: true });

    return true;
  } else {
    return false;
  }

  find("#calendar-slot").innerHTML = calendarView(state);

  if (state.calendar) {
    find("#calendar-slot").scrollIntoView({ block: "nearest" });
  }

  return true;
};

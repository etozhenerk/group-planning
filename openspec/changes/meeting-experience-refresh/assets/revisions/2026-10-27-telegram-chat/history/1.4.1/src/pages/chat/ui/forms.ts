import { people, type PrototypeState } from "@prototype/pages/chat/model/model";
import {
  dateLabel,
  escapeHtml,
  icon,
  iconButton,
} from "@prototype/shared/lib/dom";

export const dateField = (
  target: string,
  value: string,
  label: string,
): string =>
  `<div class="field"><span class="field-label" id="${target}-label">${label}</span><button class="date-field" type="button" data-action="calendar" data-target="${target}" data-value="${value}" aria-labelledby="${target}-label ${target}-value">${icon("calendar")}<span id="${target}-value">${dateLabel(value, true)}</span>${icon("down")}</button></div>`;

const timeField = (target: string, value: string): string =>
  `<label class="field"><span class="field-label">Время</span><span class="input-with-icon">${icon("clock")}<input name="${target}" type="text" inputmode="numeric" maxlength="5" pattern="([01][0-9]|2[0-3]):[0-5][0-9]" value="${escapeHtml(value)}" placeholder="ЧЧ:ММ" aria-label="Время, часы и минуты"></span></label>`;

export const calendarView = (state: PrototypeState): string => {
  if (!state.calendar) {
    return "";
  }

  const { year, month } = state.calendar;
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const monthName = new Date(year, month, 1).toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });
  const cells = Array.from(
    { length: firstDay },
    () => '<span class="calendar-blank"></span>',
  );

  for (let day = 1; day <= days; day += 1) {
    const value = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push(
      `<button type="button" data-action="pick-date" data-date="${value}" aria-label="${dateLabel(value)} ${year}" class="${value === "2026-10-27" ? "today" : ""}">${day}</button>`,
    );
  }

  return `<div class="calendar-surface" role="group" aria-label="Выбор даты"><div class="calendar-heading">${iconButton("calendar-prev", "Предыдущий месяц", "left")}<strong>${monthName}</strong>${iconButton("calendar-next", "Следующий месяц", "right")}${iconButton("calendar-close", "Закрыть календарь", "close")}</div><div class="calendar-weekdays">${["пн", "вт", "ср", "чт", "пт", "сб", "вс"].map((day) => `<span>${day}</span>`).join("")}</div><div class="calendar-days">${cells.join("")}</div></div>`;
};

export const settingsForm = (state: PrototypeState): string => {
  const draft = state.settingsDraft ?? state.meeting;

  return `<form id="sheet-form" data-form="settings" class="sheet-form">
    <div class="sheet-scroll"><div class="form-section">
      <label class="field"><span class="field-label">Название</span><input name="title" value="${escapeHtml(draft.title)}" maxlength="100" required></label>
      <label class="field"><span class="field-label">Описание</span><textarea name="description" rows="2" maxlength="2000">${escapeHtml(draft.description)}</textarea></label>
    </div><div class="form-section"><div class="two-fields">${dateField("settings-date", draft.date, "Дата")}${timeField("time", draft.time)}</div>
      <p class="field-note">Москва · UTC+3. Время можно не указывать.</p>
      <label class="field"><span class="field-label">Место</span><input name="place" value="${escapeHtml(draft.place)}" maxlength="200"></label>
    </div>
    <div class="cover-row"><div class="cover-preview ${draft.cover ? "has-cover" : ""}">${icon("photo")}</div><div><strong>Обложка</strong><span>${draft.cover ? "Фото встречи" : "Не добавлена"}</span></div><button type="button" class="text-button" data-action="toggle-cover">${draft.cover ? "Убрать" : "Добавить"}</button></div>
    <div id="calendar-slot">${calendarView(state)}</div><p class="form-error" id="form-error" role="alert" hidden></p>
    </div><div class="sheet-actions"><button class="primary-button" type="submit">Сохранить</button></div>
  </form>`;
};

export const dateForm = (state: PrototypeState): string => {
  const draft = state.dateDraft;
  const switches: [keyof typeof draft, string][] = [
    ["multiple", "Несколько ответов"],
    ["change", "Можно изменить голос"],
    ["add", "Можно добавлять варианты"],
    ["anonymous", "Анонимный опрос"],
    ["hidden", "Скрыть итоги до завершения"],
  ];

  return `<form id="sheet-form" data-form="date" class="sheet-form"><div class="sheet-scroll">
    <div class="form-section"><div class="section-label">Варианты даты</div><div class="date-options">${draft.dates.map((date, index) => `<div class="date-option">${dateField(`date-${index}`, date, `Вариант ${index + 1}`)}${draft.dates.length > 2 ? iconButton("remove-date", `Удалить вариант ${index + 1}`, "trash", `data-index="${index}"`) : ""}</div>`).join("")}</div>
    <button type="button" class="text-button add-date" data-action="add-date">${icon("plus")}Добавить дату</button></div>
    <div class="form-section switch-group">${switches.map(([key, label]) => `<label class="switch-row"><span>${label}</span><input type="checkbox" name="${key}" ${draft[key] ? "checked" : ""}><span class="switch" aria-hidden="true"></span></label>`).join("")}</div>
    <div class="form-section"><div class="section-label">Окончание опроса</div><div class="two-fields">${dateField("date-end", draft.endDate, "Дата")}${timeField("endTime", draft.endTime)}</div><p class="field-note">По московскому времени</p></div>
    <div id="calendar-slot">${calendarView(state)}</div><p class="form-error" id="form-error" role="alert" hidden></p>
    </div><div class="sheet-actions"><button class="primary-button" type="submit">Создать опрос</button></div></form>`;
};

export const placeForm = (
  state: PrototypeState,
): string => `<form id="sheet-form" data-form="place" class="sheet-form"><div class="sheet-scroll">
  ${state.activePlacePoll ? '<p class="notice">Сейчас идёт опрос о лофте «Соседи». Новое предложение можно отправить после его завершения.</p>' : ""}
  <label class="field"><span class="field-label">Новое место</span><input name="place" placeholder="Название или адрес" value="${escapeHtml(state.placeDraft.place)}" maxlength="200" required></label>
  <label class="field"><span class="field-label">Почему здесь <span class="optional">необязательно</span></span><textarea name="why" rows="3" maxlength="2000" placeholder="Что стоит знать компании">${escapeHtml(state.placeDraft.why)}</textarea></label>
  <div class="section-label">Окончание опроса</div><div class="two-fields">${dateField("place-end", state.placeDraft.endDate, "Дата")}${timeField("endTime", state.placeDraft.endTime)}</div>
  <div id="calendar-slot">${calendarView(state)}</div><p class="form-error" id="form-error" role="alert" hidden></p>
  </div><div class="sheet-actions"><button class="primary-button" type="submit" ${state.activePlacePoll ? "disabled" : ""}>${state.activePlacePoll ? "Уже идёт опрос о месте" : "Создать опрос"}</button></div></form>`;

export const newTaskForm = (
  state: PrototypeState,
): string => `<form id="sheet-form" data-form="new-task" class="sheet-form"><div class="sheet-scroll">
  <label class="field"><span class="field-label">Что нужно сделать</span><input name="title" value="${escapeHtml(state.taskDraft.title)}" maxlength="200" placeholder="Например, взять настолку" required></label>
  <label class="field"><span class="field-label">Кому предложить</span><select name="recipient"><option value="any" ${state.taskDraft.recipient === "any" ? "selected" : ""}>Всем — кто-нибудь возьмёт</option>${people
    .filter(
      (item) => item.response === "Приду" || item.response === "Организатор",
    )
    .map(
      (item) =>
        `<option value="${item.id}" ${state.taskDraft.recipient === item.id ? "selected" : ""}>${item.name}${item.id === state.user ? " (вы)" : ""}</option>`,
    )
    .join("")}</select></label>
  <p class="field-note">Участник сможет принять задачу или отказаться.</p><p class="form-error" id="form-error" role="alert" hidden></p>
  </div><div class="sheet-actions"><button class="primary-button" type="submit">Предложить задачу</button></div></form>`;

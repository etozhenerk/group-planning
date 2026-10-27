import {
  people,
  person,
  type PrototypeState,
  type SheetName,
} from "@prototype/pages/chat/model/model";
import {
  dateLabel,
  escapeHtml,
  icon,
  iconButton,
} from "@prototype/shared/lib/dom";
import {
  taskActions,
  taskStatusLabel,
} from "@prototype/pages/chat/ui/conversation";
import {
  dateForm,
  newTaskForm,
  placeForm,
  settingsForm,
} from "@prototype/pages/chat/ui/forms";

export const infoContent = (state: PrototypeState): string => {
  const current = people.filter(
    (item) => item.response === "Приду" || item.response === "Организатор",
  );
  return `<div class="info-content">
  <div class="fact-row">${icon("calendar")}<div><strong>${dateLabel(state.meeting.date, true)}${state.meeting.time ? ` · ${state.meeting.time}` : ""}</strong><span>${state.meeting.time ? "Москва · UTC+3" : "Время пока не выбрано"}</span></div></div>
  <div class="fact-row">${icon("pin")}<div><strong>${escapeHtml(state.meeting.place || "Место пока не выбрано")}</strong></div></div>
  <p class="meeting-description">${escapeHtml(state.meeting.description)}</p>
  <section class="people-section"><div class="section-label">${state.peopleExpanded ? "Все ответы" : "Компания"} <span>${state.peopleExpanded ? people.length : current.length}</span></div><button type="button" class="people-summary" data-action="toggle-people" aria-expanded="${state.peopleExpanded}">${current
    .slice(0, 3)
    .map(
      (item) =>
        `<span class="people-chip ${item.color}"><i>${item.initial}</i>${item.name}</span>`,
    )
    .join(
      "",
    )}${current.length > 3 ? `<span class="people-more">+${current.length - 3}</span>` : ""}</button>
  ${state.peopleExpanded ? `<div class="people-list">${people.map((item) => `<div class="person-row"><span class="avatar ${item.color}">${item.initial}</span><div><strong>${item.name}${item.id === state.user ? " (вы)" : ""}</strong><span>${item.response}</span></div></div>`).join("")}<button type="button" class="text-button" data-action="toggle-people">Свернуть список ${icon("down")}</button></div>` : ""}</section>
  <div class="info-actions"><button type="button" class="list-action" data-action="info-share">${icon("share")}<span>Пригласить друзей</span>${icon("right")}</button>
    ${state.user === "sasha" ? `<button type="button" class="list-action" data-action="open-settings">${icon("settings")}<span>Настройки встречи</span>${icon("right")}</button>` : `<button type="button" class="list-action" data-action="open-rsvp">${icon("check")}<span>Ваш ответ</span><span class="muted">Приду</span>${icon("right")}</button>`}
  </div>
</div>`;
};

const taskContent = (state: PrototypeState): string => {
  const task = state.task;
  const actionable = task.status === "proposed" || task.status === "accepted";
  const canDecline =
    (task.status === "proposed" && task.recipient === state.user) ||
    (task.status === "accepted" && task.assignee === state.user);
  const canCancel =
    actionable && (task.author === state.user || state.user === "sasha");

  return `<div class="sheet-scroll task-details"><span class="task-state">${taskStatusLabel(state)}</span><dl class="task-facts"><div><dt>Предложение от</dt><dd><span class="tiny-avatar ${person(task.author).color}">${person(task.author).initial}</span>${person(task.author).name}</dd></div><div><dt>${task.assignee ? "Исполняет" : "Кому"}</dt><dd>${task.assignee ? person(task.assignee).name : task.recipient === "any" ? "Любому участнику" : `${person(task.recipient).name}${task.recipient === state.user ? " (вы)" : ""}`}</dd></div><div><dt>Создано</dt><dd>Сегодня, 12:37</dd></div></dl>
    ${task.status === "accepted" ? '<p class="field-note">После выполнения отметьте результат здесь или в чате.</p>' : ""}
    <div class="task-detail-actions">${taskActions(state)}${canDecline ? '<button type="button" class="secondary-button" data-action="task-decline">Отказаться от задачи</button>' : ""}${canCancel ? '<button type="button" class="text-button danger" data-action="task-cancel">Отменить задачу</button>' : ""}</div></div>`;
};

const reactorsContent = (state: PrototypeState): string => {
  const message = state.messages.find(
    (item) => item.id === state.reactorMessage,
  );
  const reactions = Object.entries(message?.reactions ?? {}).filter(
    ([, users]) => users.length,
  );
  const users = people.filter((item) =>
    reactions.some(
      ([emoji, ids]) =>
        (state.reactorFilter === "all" || emoji === state.reactorFilter) &&
        ids.includes(item.id),
    ),
  );

  return `<div class="sheet-scroll"><div class="reactor-filters" role="group" aria-label="Фильтр реакций"><button type="button" data-action="reactor-filter" data-filter="all" aria-pressed="${state.reactorFilter === "all"}" class="${state.reactorFilter === "all" ? "active" : ""}">Все</button>${reactions.map(([emoji, ids]) => `<button type="button" data-action="reactor-filter" data-filter="${emoji}" aria-pressed="${state.reactorFilter === emoji}" class="${state.reactorFilter === emoji ? "active" : ""}">${emoji} ${ids.length}</button>`).join("")}</div><div class="reactor-list">${users
    .map(
      (item) =>
        `<div class="person-row"><span class="avatar ${item.color}">${item.initial}</span><div><strong>${item.name}${item.id === state.user ? " (вы)" : ""}</strong></div><span class="person-reactions">${reactions
          .filter(
            ([emoji, ids]) =>
              ids.includes(item.id) &&
              (state.reactorFilter === "all" || emoji === state.reactorFilter),
          )
          .map(([emoji]) => emoji)
          .join(" ")}</span></div>`,
    )
    .join("")}</div></div>`;
};

export const sheetContent = (state: PrototypeState): string => {
  switch (state.sheet) {
    case "info":
      return `<div class="sheet-scroll">${infoContent(state)}</div>`;
    case "settings":
      return settingsForm(state);
    case "date":
      return dateForm(state);
    case "place":
      return placeForm(state);
    case "new-task":
      return newTaskForm(state);
    case "task":
      return taskContent(state);
    case "reactors":
      return reactorsContent(state);
    case "share":
      return `<div class="sheet-scroll share-content"><p>Отправьте ссылку тем, кого хотите позвать.</p><div class="share-preview"><div class="meeting-mark">${icon("calendar")}</div><div><strong>${escapeHtml(state.meeting.title)}</strong><span>${dateLabel(state.meeting.date)} · ${escapeHtml(state.meeting.place)}</span></div></div><label class="field"><span class="field-label">Ссылка-приглашение</span><input readonly value="https://somewhere.test/invite/demo" aria-label="Демонстрационная ссылка-приглашение"></label><button type="button" class="secondary-button" data-action="copy-link">${icon("copy")}Скопировать ссылку</button></div>`;
    case "confirm-task":
      return `<div class="sheet-scroll"><p>${state.pendingTaskAction === "cancel" ? "Задача останется в истории с отметкой об отмене. Новый исполнитель не назначится." : "Отказ останется в истории. Передать задачу можно новым предложением."}</p><div class="confirmation-actions"><button type="button" class="secondary-button" data-action="confirm-task">${state.pendingTaskAction === "cancel" ? "Отменить задачу" : "Отказаться"}</button><button type="button" class="text-button" data-action="return-task">Оставить как есть</button></div></div>`;
    case "rsvp":
      return `<div class="sheet-scroll"><p>Сейчас у вас ответ «Приду».</p><p class="field-note">Ответ «Возможно» или «Не смогу» закроет доступ к переписке. </p><button type="button" class="secondary-button" data-action="close-sheet">Оставить «Приду»</button></div>`;
    case "attachment":
      return '<div class="sheet-scroll"><label class="field"><span class="field-label">Файл с устройства</span><input type="file" aria-label="Выбрать файл с устройства"></label></div>';
    default:
      return "";
  }
};

export const renderSheet = (state: PrototypeState): string => {
  const titles: Record<SheetName, string> = {
    info: state.meeting.title,
    share: "Пригласить друзей",
    settings: "Настройки встречи",
    task: state.task.title,
    date: "Новая дата встречи",
    place: "Предложить место",
    "new-task": "Предложить задачу",
    reactors: "Кто отреагировал",
    "confirm-task":
      state.pendingTaskAction === "cancel"
        ? "Отменить задачу?"
        : "Отказаться от задачи?",
    rsvp: "Ваш ответ",
    attachment: "Вложение",
  };

  return `<div class="sheet-grab-area" id="sheet-grab-area"><div class="sheet-handle"></div><header class="sheet-header"><h1 id="sheet-title">${escapeHtml(titles[state.sheet ?? "info"])}</h1>${iconButton("close-sheet", state.sheetReturn ? "Закрыть панель и вернуться к сведениям" : "Закрыть панель", "close")}</header></div>${sheetContent(state)}`;
};

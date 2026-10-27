import { person, type PrototypeState } from "@prototype/pages/chat/model/model";
import { escapeHtml, icon, iconButton } from "@prototype/shared/lib/dom";

export const taskStatusLabel = (state: PrototypeState): string => {
  const task = state.task;

  if (task.status === "accepted" && task.assignee) {
    return `Исполняет ${person(task.assignee).name}`;
  }

  const labels = {
    proposed:
      task.recipient === state.user
        ? "Предложено вам"
        : task.recipient === "any"
          ? "Кто возьмёт?"
          : `Предложено: ${person(task.recipient).name}`,
    done: "Выполнено",
    declined: "Отказ от задачи",
    cancelled: "Отменено",
  };

  return labels[task.status as keyof typeof labels] ?? "Предложено";
};

export const taskActions = (state: PrototypeState): string => {
  const task = state.task;
  const canAccept =
    task.status === "proposed" &&
    (task.recipient === "any" || task.recipient === state.user);
  const canComplete =
    task.status === "accepted" && task.assignee === state.user;

  if (canAccept) {
    return '<button type="button" class="small-action" data-action="task-accept">Взять на себя</button>';
  }

  if (canComplete) {
    return '<button type="button" class="small-action" data-action="task-complete">Отметить выполненной</button>';
  }

  return "";
};

export const renderMessages = (state: PrototypeState): string => {
  const messages = state.messages.map((message) => {
    const author = person(message.author);
    const own = message.author === state.user;
    const reactions = Object.entries(message.reactions).filter(
      ([, users]) => users.length > 0,
    );

    return `<article class="message ${own ? "own" : ""}" data-message="${message.id}" aria-label="${author.name}, ${message.time}">
      <span class="avatar ${author.color}" aria-hidden="true">${author.initial}</span>
      <div class="message-main">
        <div class="message-meta"><span>${own ? "Вы" : author.name}</span><time>${message.time}</time></div>
        <div class="bubble" data-bubble="${message.id}"><p>${escapeHtml(message.text)}</p></div>
        <div class="message-bottom">
          <div class="reaction-chips">${reactions.map(([emoji, users]) => `<button type="button" class="reaction-chip ${users.includes(state.user) ? "is-own" : ""}" data-action="toggle-reaction" data-message-id="${message.id}" data-emoji="${emoji}" aria-pressed="${users.includes(state.user)}" aria-label="${emoji}, ${users.length}. ${users.includes(state.user) ? "Снять свою реакцию" : "Поставить реакцию"}">${emoji}<span>${users.length}</span>${users.includes(state.user) ? '<span class="reaction-check" aria-hidden="true">✓</span>' : ""}</button>`).join("")}</div>
          <button type="button" class="reaction-open" data-action="reaction-open" data-message-id="${message.id}" aria-label="Реакции на сообщение: ${escapeHtml(message.text)}">${icon("smile")}</button>
          ${reactions.length ? `<button type="button" class="reactors-open" data-action="reactors" data-message-id="${message.id}" aria-label="Кто поставил реакции на сообщение ${author.name}">${icon("people")}</button>` : ""}
        </div>
      </div>
    </article>`;
  });

  return `<div class="day-label"><span>Сегодня, 27 октября</span></div>
    ${messages.slice(0, 2).join("")}
    <article class="inline-card poll-card" aria-label="Голосование за место">
      <div class="card-eyebrow">${icon("pin")}<span>Тимофей · 12:34</span><span class="status-label">Опрос</span></div>
      <h2>Может, в лофте «Соседи»?</h2><p>Там большой стол, и можно со своей едой.</p>
      <div class="vote-actions"><button type="button" data-action="vote-for" aria-pressed="${state.vote === "for"}" class="vote-option ${state.vote === "for" ? "selected" : ""}">За <span>${state.vote === "for" ? "3" : "2"}</span></button><button type="button" data-action="vote-against" aria-pressed="${state.vote === "against"}" class="vote-option ${state.vote === "against" ? "selected" : ""}">Против <span>${state.vote === "against" ? "2" : "1"}</span></button></div>
      <div class="card-foot">До 30 октября, 18:00 · место пока прежнее</div>
    </article>
    ${messages.slice(2, 3).join("")}
    <article class="inline-card task-card" aria-label="Задача: ${escapeHtml(state.task.title)}">
      <div class="card-eyebrow">${icon("task")}<span>Новая задача · Лена</span><time>12:37</time></div>
      <button type="button" class="task-title" data-action="open-task"><span>${escapeHtml(state.task.title)}</span>${icon("right")}</button>
      <div class="task-inline-status">${taskStatusLabel(state)}</div>
      ${taskActions(state)}
    </article>
    ${messages.slice(3).join("")}
    ${state.published.map((item) => `<article class="inline-card"><div class="card-eyebrow">${icon(item.kind === "date" ? "calendar" : item.kind === "place" ? "pin" : "task")}<span>${item.kind === "task" ? "Предложение задачи" : "Новый опрос"}</span></div><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.detail)}</p><span class="card-foot">Только что</span></article>`).join("")}
    ${state.systems.map((value) => `<p class="system-message"><span>Сегодня · 12:40</span>${escapeHtml(value)}</p>`).join("")}
    <div class="conversation-end" aria-hidden="true"></div>`;
};

export const renderShell = (
  state: PrototypeState,
): string => `<div class="chat-app">
  <div class="chat-surface" id="chat-surface">
    <header class="chat-header">
      <div class="meeting-mark" aria-hidden="true">${icon("calendar")}</div>
      <button type="button" class="meeting-heading" data-action="open-info" aria-label="Сведения о встрече ${escapeHtml(state.meeting.title)}"><span id="meeting-name">${escapeHtml(state.meeting.title)}</span><span class="header-subtitle">Суббота, 31 октября · 4 участника</span></button>
      ${iconButton("open-share", "Пригласить друзей", "share")}${iconButton("open-info", "Сведения о встрече", "info")}
    </header>
    <div class="chat-body"><main class="conversation" id="conversation" aria-label="Чат встречи"><div class="message-list" id="message-list">${renderMessages(state)}</div></main>

    </div>
    <div class="input-area" id="input-area">
      <div id="add-menu" class="add-menu" hidden></div>
      <form class="composer" id="composer">
        ${iconButton("toggle-menu", "Добавить", "plus", 'id="add-button" aria-expanded="false" aria-controls="add-menu"')}
        <div class="text-entry"><textarea id="message-input" aria-label="Сообщение" placeholder="Сообщение" rows="1" maxlength="4000">${escapeHtml(state.draft)}</textarea>${iconButton("toggle-emoji", "Выбрать эмодзи", "smile", 'id="emoji-button" aria-expanded="false" aria-controls="emoji-dock"')}</div>
        <button type="submit" class="send-button" id="send-button" aria-label="Отправить сообщение">${icon("send")}</button>
      </form>
      <section class="emoji-dock" id="emoji-dock" aria-label="Эмодзи для сообщения" hidden></section>
    </div>
  </div>
  <div id="reaction-host" class="reaction-host" hidden></div>
  <div class="sheet-overlay" id="sheet-overlay" hidden><div class="sheet-backdrop" data-action="close-sheet"></div><section class="sheet" id="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" tabindex="-1"></section></div>
  <div class="toast" id="toast" role="status" hidden></div>
  <div class="sr-only" id="announcement" aria-live="polite"></div>
</div>`;

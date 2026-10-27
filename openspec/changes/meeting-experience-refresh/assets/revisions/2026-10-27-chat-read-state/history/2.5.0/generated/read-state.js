"use strict";
(() => {
  // openspec/changes/meeting-experience-refresh/assets/revisions/2026-10-27-telegram-chat/src/pages/chat/model/model.ts
  var people = [
    {
      id: "sasha",
      name: "\u0421\u0430\u0448\u0430",
      initial: "\u0421",
      color: "sand",
      response: "\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0442\u043E\u0440"
    },
    { id: "lena", name: "\u041B\u0435\u043D\u0430", initial: "\u041B", color: "lilac", response: "\u041F\u0440\u0438\u0434\u0443" },
    {
      id: "tim",
      name: "\u0422\u0438\u043C\u043E\u0444\u0435\u0439",
      initial: "\u0422",
      color: "mint",
      response: "\u041F\u0440\u0438\u0434\u0443"
    },
    { id: "masha", name: "\u041C\u0430\u0448\u0430", initial: "\u041C", color: "blue", response: "\u041F\u0440\u0438\u0434\u0443" },
    {
      id: "olya",
      name: "\u041E\u043B\u044F",
      initial: "\u041E",
      color: "lilac",
      response: "\u0412\u043E\u0437\u043C\u043E\u0436\u043D\u043E"
    },
    {
      id: "dima",
      name: "\u0414\u0438\u043C\u0430",
      initial: "\u0414",
      color: "sand",
      response: "\u041D\u0435 \u0441\u043C\u043E\u0433\u0443"
    }
  ];
  var person = (id) => people.find((item) => item.id === id) ?? people[0];
  var createState = () => ({
    user: "sasha",
    draft: "\u042F \u0437\u0430\u0445\u0432\u0430\u0447\u0443 ",
    selection: { start: 10, end: 10 },
    messages: [
      {
        id: "m1",
        author: "lena",
        text: "\u0412 \u0441\u0443\u0431\u0431\u043E\u0442\u0443 \u0443 \u043C\u0435\u043D\u044F \u0441\u0432\u043E\u0431\u043E\u0434\u0435\u043D \u0432\u0435\u0441\u044C \u0432\u0435\u0447\u0435\u0440. \u0414\u0430\u0432\u0430\u0439\u0442\u0435 \u043D\u0430\u043A\u043E\u043D\u0435\u0446 \u0441\u043E\u0431\u0435\u0440\u0451\u043C\u0441\u044F?",
        time: "12:31",
        reactions: { "\u2764\uFE0F": ["tim", "masha"] }
      },
      {
        id: "m2",
        author: "sasha",
        text: "\u0414\u0430\u0432\u0430\u0439\u0442\u0435! \u041F\u0440\u0438\u043D\u0435\u0441\u0443 \u043D\u0430\u0441\u0442\u043E\u043B\u043A\u0438, \u0430 \u0441 \u0432\u0430\u0441 \u0445\u043E\u0440\u043E\u0448\u0435\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D\u0438\u0435",
        time: "12:33",
        reactions: { "\u{1F525}": ["lena"] }
      },
      {
        id: "m3",
        author: "tim",
        text: "\u042F \u0437\u0430 \u{1F355} \u041C\u043E\u0436\u043D\u043E \u0437\u0430\u043A\u0430\u0437\u0430\u0442\u044C \u043F\u0438\u0446\u0446\u0443 \u0438 \u043D\u0438\u043A\u0443\u0434\u0430 \u043D\u0435 \u0442\u043E\u0440\u043E\u043F\u0438\u0442\u044C\u0441\u044F",
        time: "12:35",
        reactions: { "\u{1F44D}": ["lena", "masha"], "\u{1F355}": ["sasha"] }
      }
    ],
    recent: [
      "\u2764\uFE0F",
      "\u{1F602}",
      "\u{1F44D}",
      "\u{1F970}",
      "\u{1F525}",
      "\u{1F389}",
      "\u{1F355}",
      "\u2728",
      "\u{1F917}",
      "\u{1F440}",
      "\u{1F64C}",
      "\u2615"
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
      title: "\u0417\u0430\u043A\u0430\u0437\u0430\u0442\u044C \u043F\u0438\u0446\u0446\u0443",
      author: "lena",
      recipient: "sasha",
      assignee: null,
      status: "proposed"
    },
    pendingTaskAction: null,
    meeting: {
      title: "\u0412\u0435\u0447\u0435\u0440 \u0431\u0435\u0437 \u043F\u043B\u0430\u043D\u043E\u0432",
      description: "\u041F\u0438\u0446\u0446\u0430, \u043D\u0430\u0441\u0442\u043E\u043B\u043A\u0438 \u0438 \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440\u044B \u0434\u043E \u043D\u043E\u0447\u0438. \u041F\u0440\u0438\u043D\u043E\u0441\u0438\u0442\u0435 \u043B\u044E\u0431\u0438\u043C\u0443\u044E \u0438\u0433\u0440\u0443.",
      date: "2026-10-31",
      time: "19:00",
      place: "\u0423 \u0421\u0430\u0448\u0438 \u0434\u043E\u043C\u0430",
      cover: true
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
      hidden: false
    },
    placeDraft: { place: "", why: "", endDate: "2026-10-30", endTime: "18:00" },
    taskDraft: { title: "", recipient: "any" },
    calendar: null,
    vote: null,
    activePlacePoll: true,
    systems: [],
    published: []
  });

  // openspec/changes/meeting-experience-refresh/assets/revisions/2026-10-27-telegram-chat/src/shared/lib/dom.ts
  var escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => {
    const replacements = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    return replacements[character] ?? character;
  });
  var icon = (name, className = "") => {
    const paths = {
      plus: '<path d="M12 5v14M5 12h14"/>',
      close: '<path d="m6 6 12 12M18 6 6 18"/>',
      down: '<path d="m6 9 6 6 6-6"/>',
      left: '<path d="m14 6-6 6 6 6"/>',
      right: '<path d="m9 6 6 6-6 6"/>',
      smile: '<circle cx="12" cy="12" r="9"/><circle cx="8.5" cy="9.5" r="0.9" fill="currentColor" stroke="none"/><circle cx="15.5" cy="9.5" r="0.9" fill="currentColor" stroke="none"/><path d="M8 14Q12 18 16 14"/>',
      keyboard: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M6.5 9h.01M10 9h.01M14 9h.01M17.5 9h.01M6.5 12h.01M10 12h.01M14 12h.01M17.5 12h.01M8 16h8"/>',
      send: '<path d="m12 19 0-14M6 11l6-6 6 6"/>',
      info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
      share: '<path d="M8 8H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-3M12 15V2m-4 4 4-4 4 4"/>',
      search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
      backspace: '<path d="M9 5h11v14H9l-7-7 7-7Z"/><path d="m12 9 5 6m0-6-5 6"/>',
      calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 2v6M17 2v6M3 11h18M7 15h2m3 0h2m3 0h1"/>',
      pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/>',
      task: '<rect x="4" y="3" width="16" height="18" rx="3"/><path d="m8 12 3 3 5-6M9 3h6"/>',
      check: '<path d="m5 12 4 4L19 6"/>',
      settings: '<path d="M5 6h14M5 12h14M5 18h14"/><circle cx="9" cy="6" r="2" fill="currentColor"/><circle cx="15" cy="12" r="2" fill="currentColor"/><circle cx="10" cy="18" r="2" fill="currentColor"/>',
      people: '<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4v3"/>',
      copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
      photo: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 6-5 4 3 4-5 4 7"/>',
      file: '<path d="M14 2H5v20h14V7l-5-5Zm0 0v6h5M8 13h8M8 17h6"/>',
      trash: '<path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7"/>',
      clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
      more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>'
    };
    return `<svg class="icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.more}</svg>`;
  };
  var iconButton = (action, label, image, extra = "") => `<button class="icon-button" type="button" data-action="${action}" aria-label="${label}" ${extra}>${icon(image)}</button>`;

  // openspec/changes/meeting-experience-refresh/assets/revisions/2026-10-27-telegram-chat/src/pages/chat/ui/conversation.ts
  var taskStatusLabel = (state) => {
    const task = state.task;
    if (task.status === "accepted" && task.assignee) {
      return `\u0418\u0441\u043F\u043E\u043B\u043D\u044F\u0435\u0442 ${person(task.assignee).name}`;
    }
    const labels = {
      proposed: task.recipient === state.user ? "\u041F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u043E \u0432\u0430\u043C" : task.recipient === "any" ? "\u041A\u0442\u043E \u0432\u043E\u0437\u044C\u043C\u0451\u0442?" : `\u041F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u043E: ${person(task.recipient).name}`,
      done: "\u0412\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u043E",
      declined: "\u041E\u0442\u043A\u0430\u0437 \u043E\u0442 \u0437\u0430\u0434\u0430\u0447\u0438",
      cancelled: "\u041E\u0442\u043C\u0435\u043D\u0435\u043D\u043E"
    };
    return labels[task.status] ?? "\u041F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u043E";
  };
  var taskActions = (state) => {
    const task = state.task;
    const canAccept = task.status === "proposed" && (task.recipient === "any" || task.recipient === state.user);
    const canComplete = task.status === "accepted" && task.assignee === state.user;
    if (canAccept) {
      return '<button type="button" class="small-action" data-action="task-accept">\u0412\u0437\u044F\u0442\u044C \u043D\u0430 \u0441\u0435\u0431\u044F</button>';
    }
    if (canComplete) {
      return '<button type="button" class="small-action" data-action="task-complete">\u041E\u0442\u043C\u0435\u0442\u0438\u0442\u044C \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u043D\u043E\u0439</button>';
    }
    return "";
  };
  var renderMessages = (state) => {
    const messages = state.messages.map((message) => {
      const author = person(message.author);
      const own2 = message.author === state.user;
      const reactions = Object.entries(message.reactions).filter(
        ([, users]) => users.length > 0
      );
      return `<article class="message ${own2 ? "own" : ""}" data-message="${message.id}" aria-label="${author.name}, ${message.time}">
      <span class="avatar ${author.color}" aria-hidden="true">${author.initial}</span>
      <div class="message-main">
        <div class="message-meta"><span>${own2 ? "\u0412\u044B" : author.name}</span><time>${message.time}</time></div>
        <div class="bubble" data-bubble="${message.id}" tabindex="0" role="button" aria-label="${escapeHtml(message.text)}. \u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0440\u0435\u0430\u043A\u0446\u0438\u044E" aria-haspopup="dialog"><p>${escapeHtml(message.text)}</p></div>
        <div class="message-bottom" ${reactions.length ? "" : "hidden"}>
          <div class="reaction-chips">${reactions.map(([emoji, users]) => `<button type="button" class="reaction-chip ${users.includes(state.user) ? "is-own" : ""}" aria-description="\u0423\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0439\u0442\u0435, \u0447\u0442\u043E\u0431\u044B \u0443\u0432\u0438\u0434\u0435\u0442\u044C \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u043E\u0432 \u044D\u0442\u043E\u0439 \u0440\u0435\u0430\u043A\u0446\u0438\u0438" data-action="toggle-reaction" data-message-id="${message.id}" data-emoji="${emoji}" aria-pressed="${users.includes(state.user)}" aria-label="${emoji}, ${users.length}. ${users.includes(state.user) ? "\u0421\u043D\u044F\u0442\u044C \u0441\u0432\u043E\u044E \u0440\u0435\u0430\u043A\u0446\u0438\u044E" : "\u041F\u043E\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u0440\u0435\u0430\u043A\u0446\u0438\u044E"}">${emoji}<span>${users.length}</span>${users.includes(state.user) ? '<span class="reaction-check" aria-hidden="true">\u2713</span>' : ""}</button>`).join("")}</div>
        </div>
      </div>
    </article>`;
    });
    return `<div class="day-label"><span>\u0421\u0435\u0433\u043E\u0434\u043D\u044F, 27 \u043E\u043A\u0442\u044F\u0431\u0440\u044F</span></div>
    ${messages.slice(0, 2).join("")}
    <article class="inline-card poll-card" aria-label="\u0413\u043E\u043B\u043E\u0441\u043E\u0432\u0430\u043D\u0438\u0435 \u0437\u0430 \u043C\u0435\u0441\u0442\u043E">
      <div class="card-eyebrow">${icon("pin")}<span>\u0422\u0438\u043C\u043E\u0444\u0435\u0439 \xB7 12:34</span><span class="status-label">\u041E\u043F\u0440\u043E\u0441</span></div>
      <h2>\u041C\u043E\u0436\u0435\u0442, \u0432 \u043B\u043E\u0444\u0442\u0435 \xAB\u0421\u043E\u0441\u0435\u0434\u0438\xBB?</h2><p>\u0422\u0430\u043C \u0431\u043E\u043B\u044C\u0448\u043E\u0439 \u0441\u0442\u043E\u043B, \u0438 \u043C\u043E\u0436\u043D\u043E \u0441\u043E \u0441\u0432\u043E\u0435\u0439 \u0435\u0434\u043E\u0439.</p>
      <div class="vote-actions"><button type="button" data-action="vote-for" aria-pressed="${state.vote === "for"}" class="vote-option ${state.vote === "for" ? "selected" : ""}">\u0417\u0430 <span>${state.vote === "for" ? "3" : "2"}</span></button><button type="button" data-action="vote-against" aria-pressed="${state.vote === "against"}" class="vote-option ${state.vote === "against" ? "selected" : ""}">\u041F\u0440\u043E\u0442\u0438\u0432 <span>${state.vote === "against" ? "2" : "1"}</span></button></div>
      <div class="card-foot">\u0414\u043E 30 \u043E\u043A\u0442\u044F\u0431\u0440\u044F, 18:00 \xB7 \u043C\u0435\u0441\u0442\u043E \u043F\u043E\u043A\u0430 \u043F\u0440\u0435\u0436\u043D\u0435\u0435</div>
    </article>
    ${messages.slice(2, 3).join("")}
    <article class="inline-card task-card" aria-label="\u0417\u0430\u0434\u0430\u0447\u0430: ${escapeHtml(state.task.title)}">
      <div class="card-eyebrow">${icon("task")}<span>\u041D\u043E\u0432\u0430\u044F \u0437\u0430\u0434\u0430\u0447\u0430 \xB7 \u041B\u0435\u043D\u0430</span><time>12:37</time></div>
      <button type="button" class="task-title" data-action="open-task"><span>${escapeHtml(state.task.title)}</span>${icon("right")}</button>
      <div class="task-inline-status">${taskStatusLabel(state)}</div>
      ${taskActions(state)}
    </article>
    ${messages.slice(3).join("")}
    ${state.published.map((item) => `<article class="inline-card"><div class="card-eyebrow">${icon(item.kind === "date" ? "calendar" : item.kind === "place" ? "pin" : "task")}<span>${item.kind === "task" ? "\u041F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u0437\u0430\u0434\u0430\u0447\u0438" : "\u041D\u043E\u0432\u044B\u0439 \u043E\u043F\u0440\u043E\u0441"}</span></div><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.detail)}</p><span class="card-foot">\u0422\u043E\u043B\u044C\u043A\u043E \u0447\u0442\u043E</span></article>`).join("")}
    ${state.systems.map((value) => `<p class="system-message"><span>\u0421\u0435\u0433\u043E\u0434\u043D\u044F \xB7 12:40</span>${escapeHtml(value)}</p>`).join("")}
    <div class="conversation-end" aria-hidden="true"></div>`;
  };
  var renderShell = (state) => `<div class="chat-app">
  <div class="chat-surface" id="chat-surface">
    <header class="chat-header">
      <div class="meeting-mark" aria-hidden="true">${icon("calendar")}</div>
      <button type="button" class="meeting-heading" data-action="open-info" aria-label="\u0421\u0432\u0435\u0434\u0435\u043D\u0438\u044F \u043E \u0432\u0441\u0442\u0440\u0435\u0447\u0435 ${escapeHtml(state.meeting.title)}"><span id="meeting-name">${escapeHtml(state.meeting.title)}</span><span class="header-subtitle">\u0421\u0443\u0431\u0431\u043E\u0442\u0430, 31 \u043E\u043A\u0442\u044F\u0431\u0440\u044F \xB7 4 \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0430</span></button>
      ${iconButton("open-share", "\u041F\u0440\u0438\u0433\u043B\u0430\u0441\u0438\u0442\u044C \u0434\u0440\u0443\u0437\u0435\u0439", "share")}${iconButton("open-info", "\u0421\u0432\u0435\u0434\u0435\u043D\u0438\u044F \u043E \u0432\u0441\u0442\u0440\u0435\u0447\u0435", "info")}
    </header>
    <div class="chat-body"><main class="conversation" id="conversation" aria-label="\u0427\u0430\u0442 \u0432\u0441\u0442\u0440\u0435\u0447\u0438"><div class="message-list" id="message-list">${renderMessages(state)}</div></main>

    </div>
    <div class="input-area" id="input-area">
      <div id="add-menu" class="add-menu" hidden></div>
      <form class="composer" id="composer">
        ${iconButton("toggle-menu", "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C", "plus", 'id="add-button" aria-expanded="false" aria-controls="add-menu"')}
        <div class="text-entry"><textarea id="message-input" aria-label="\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435" placeholder="\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435" rows="1" maxlength="4000">${escapeHtml(state.draft)}</textarea>${iconButton("toggle-emoji", "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u044D\u043C\u043E\u0434\u0437\u0438", "smile", 'id="emoji-button" aria-expanded="false" aria-controls="emoji-dock"')}</div>
        <button type="submit" class="send-button" id="send-button" aria-label="\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435">${icon("send")}</button>
      </form>
      <section class="emoji-dock" id="emoji-dock" aria-label="\u042D\u043C\u043E\u0434\u0437\u0438 \u0434\u043B\u044F \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F" hidden></section>
    </div>
  </div>
  <div id="reaction-host" class="reaction-host" hidden></div>
  <div class="sheet-overlay" id="sheet-overlay" hidden><div class="sheet-backdrop" data-action="close-sheet"></div><section class="sheet" id="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" tabindex="-1"></section></div>
  <div class="toast" id="toast" role="status" hidden></div>
  <div class="sr-only" id="announcement" aria-live="polite"></div>
</div>`;

  // openspec/changes/meeting-experience-refresh/assets/revisions/2026-10-27-chat-read-state/read-state.ts
  var mode = new URLSearchParams(location.search).get("state") ?? "chat";
  var app = document.querySelector("#app");
  app.innerHTML = renderShell(createState());
  var conversation = document.querySelector("#conversation");
  var list = document.querySelector("#message-list");
  var own = document.querySelector(".message.own .message-main");
  var opener = document.createElement("button");
  opener.type = "button";
  opener.className = "read-receipt";
  opener.textContent = "\u041F\u0440\u043E\u0447\u0438\u0442\u0430\u043B\u0438 2";
  opener.setAttribute("aria-haspopup", "dialog");
  own.append(opener);
  var divider = document.createElement("div");
  divider.className = "unread-divider";
  divider.textContent = "\u041D\u0435\u043F\u0440\u043E\u0447\u0438\u0442\u0430\u043D\u043D\u044B\u0435";
  list.querySelectorAll(".message")[2]?.before(divider);
  var overlay = document.querySelector("#sheet-overlay");
  var sheet = document.querySelector("#sheet");
  var shell = document.querySelector("#chat-surface");
  overlay.classList.add("reader-state");
  var closing;
  var people2 = '<div class="people-list"><div class="person-row"><span class="avatar lilac" aria-hidden="true">\u041B</span><div><strong>\u041B\u0435\u043D\u0430</strong></div></div><div class="person-row"><span class="avatar mint" aria-hidden="true">\u0422</span><div><strong>\u0422\u0438\u043C\u043E\u0444\u0435\u0439</strong></div></div></div>';
  var loading = '<div role="status" aria-label="\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043C \u0441\u043F\u0438\u0441\u043E\u043A">' + Array.from({ length: 3 }, () => '<div class="person-row" aria-hidden="true"><span class="avatar reader-skeleton-avatar"></span><div class="reader-skeleton"></div></div>').join("") + "</div>";
  var close = () => {
    overlay.dataset.phase = "closing";
    sheet.inert = true;
    closing = setTimeout(() => {
      overlay.hidden = true;
      sheet.inert = false;
      shell.inert = false;
      opener.focus({ preventScroll: true });
    }, matchMedia("(prefers-reduced-motion:reduce)").matches ? 0 : 150);
  };
  var open = (state = "readers") => {
    clearTimeout(closing);
    sheet.inert = false;
    shell.inert = true;
    overlay.hidden = false;
    overlay.dataset.phase = "open";
    const body = state === "loading" ? loading : state === "empty" ? '<p class="reader-empty">\u041F\u043E\u043A\u0430 \u043D\u0438\u043A\u0442\u043E \u043D\u0435 \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u043B</p>' : state === "error" ? '<div class="reader-error" role="alert"><p>\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0441\u043F\u0438\u0441\u043E\u043A</p><button type="button" class="small-action" data-retry>\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C</button></div>' : people2;
    sheet.innerHTML = `<div class="sheet-grab-area"><div class="sheet-handle" aria-hidden="true"></div><header class="sheet-header"><h1 id="sheet-title">\u041F\u0440\u043E\u0447\u0438\u0442\u0430\u043B\u0438</h1><button class="icon-button" type="button" data-close aria-label="\u0417\u0430\u043A\u0440\u044B\u0442\u044C">${icon("close")}</button></header></div><div class="sheet-scroll">${body}</div>`;
    sheet.querySelector("[data-close]")?.addEventListener("click", close);
    sheet.querySelector("[data-retry]")?.addEventListener("click", () => open());
    sheet.focus({ preventScroll: true });
  };
  opener.addEventListener("click", () => open());
  overlay.querySelector(".sheet-backdrop")?.addEventListener("click", close);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !overlay.hidden) close();
  });
  var dragStart = 0;
  sheet.addEventListener("pointerdown", (event) => {
    if (event.target.closest(".sheet-grab-area")) dragStart = event.clientY;
  });
  sheet.addEventListener("pointerup", (event) => {
    if (dragStart && event.clientY - dragStart > 60) close();
    dragStart = 0;
  });
  if (["readers", "loading", "empty", "error"].includes(mode)) open(mode);
  if (mode === "history-loading" || mode === "history-error") {
    const history = document.createElement("div");
    history.className = "history-state";
    history.innerHTML = mode === "history-loading" ? '<div class="reader-skeleton" role="status" aria-label="\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043C \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F"></div><div class="reader-skeleton" aria-hidden="true"></div>' : '<p role="alert">\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F</p><button class="small-action" type="button">\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C</button>';
    list.prepend(history);
    history.querySelector("button")?.addEventListener("click", () => history.remove());
  }
  if (mode === "list") {
    conversation.classList.add("list-preview");
    list.innerHTML = '<button class="meeting-unread" type="button"><span class="meeting-summary"><strong>\u0412\u0435\u0447\u0435\u0440 \u0431\u0435\u0437 \u043F\u043B\u0430\u043D\u043E\u0432</strong><small>\u0421\u0443\u0431\u0431\u043E\u0442\u0430, 31 \u043E\u043A\u0442\u044F\u0431\u0440\u044F \xB7 4 \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0430</small></span><span class="unread-badge" aria-label="3 \u043D\u0435\u043F\u0440\u043E\u0447\u0438\u0442\u0430\u043D\u043D\u044B\u0445 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F">3</span></button>';
    document.querySelector("#input-area").hidden = true;
    list.querySelector("button")?.addEventListener("click", () => location.search = "");
  } else {
    const jump = document.createElement("button");
    jump.type = "button";
    jump.className = "new-message-link";
    jump.textContent = "3 \u043D\u043E\u0432\u044B\u0445 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F";
    shell.append(jump);
    jump.addEventListener("click", () => {
      conversation.scrollTop = conversation.scrollHeight;
      jump.hidden = true;
    });
  }
  document.querySelector("form")?.addEventListener("submit", (event) => event.preventDefault());
})();

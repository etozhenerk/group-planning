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
  var find = (selector) => {
    const element = document.querySelector(selector);
    if (!element) {
      throw new Error(`Missing prototype element: ${selector}`);
    }
    return element;
  };
  var icon = (name, className = "") => {
    const paths = {
      plus: '<path d="M12 5v14M5 12h14"/>',
      close: '<path d="m6 6 12 12M18 6 6 18"/>',
      down: '<path d="m6 9 6 6 6-6"/>',
      left: '<path d="m14 6-6 6 6 6"/>',
      right: '<path d="m9 6 6 6-6 6"/>',
      smile: '<circle cx="12" cy="12" r="9"/><path d="M8 14.5c1.5 3 6.5 3 8 0"/><path d="M8.5 9h.01M15.5 9h.01" stroke-width="3"/>',
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
  var dateLabel = (value, weekday = false) => {
    const date = /* @__PURE__ */ new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime()) ? "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0434\u0430\u0442\u0443" : date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      ...weekday ? { weekday: "short" } : {}
    });
  };

  // openspec/changes/meeting-experience-refresh/assets/revisions/2026-10-27-telegram-chat/src/pages/chat/ui/add-menu.ts
  var addMenu = () => [
    ["photo", "\u0424\u043E\u0442\u043E", "photo"],
    ["file", "\u0424\u0430\u0439\u043B", "file"],
    ["date", "\u041F\u0440\u0435\u0434\u043B\u043E\u0436\u0438\u0442\u044C \u0434\u0430\u0442\u0443", "calendar"],
    ["place", "\u041F\u0440\u0435\u0434\u043B\u043E\u0436\u0438\u0442\u044C \u043C\u0435\u0441\u0442\u043E", "pin"],
    ["new-task", "\u041F\u0440\u0435\u0434\u043B\u043E\u0436\u0438\u0442\u044C \u0437\u0430\u0434\u0430\u0447\u0443", "task"]
  ].map(
    ([action, label, image]) => `<button type="button" data-action="open-${action}">${icon(image)}<span>${label}</span></button>`
  ).join("");

  // openspec/changes/meeting-experience-refresh/assets/revisions/2026-10-27-telegram-chat/src/pages/chat/model/emoji.ts
  var categories = [
    { id: "recent", icon: "\u25F7", label: "\u041D\u0435\u0434\u0430\u0432\u043D\u0438\u0435" },
    { id: "faces", icon: "\u263A", label: "\u041B\u0438\u0446\u0430 \u0438 \u043B\u044E\u0434\u0438" },
    { id: "nature", icon: "\u2740", label: "\u041F\u0440\u0438\u0440\u043E\u0434\u0430" },
    { id: "food", icon: "\u2667", label: "\u0415\u0434\u0430 \u0438 \u043D\u0430\u043F\u0438\u0442\u043A\u0438" },
    { id: "travel", icon: "\u2708", label: "\u041C\u0435\u0441\u0442\u0430 \u0438 \u043F\u043E\u0435\u0437\u0434\u043A\u0438" },
    { id: "objects", icon: "\u263C", label: "\u041F\u0440\u0435\u0434\u043C\u0435\u0442\u044B" },
    { id: "symbols", icon: "\u2661", label: "\u0421\u0438\u043C\u0432\u043E\u043B\u044B" }
  ];
  var groups = {
    faces: [
      ["\u{1F600}", "\u0443\u043B\u044B\u0431\u043A\u0430 \u0440\u0430\u0434\u043E\u0441\u0442\u044C"],
      ["\u{1F603}", "\u0441\u0447\u0430\u0441\u0442\u043B\u0438\u0432\u044B\u0439 \u0443\u043B\u044B\u0431\u043A\u0430"],
      ["\u{1F604}", "\u0441\u043C\u0435\u0445 \u0443\u043B\u044B\u0431\u043A\u0430"],
      ["\u{1F601}", "\u0448\u0438\u0440\u043E\u043A\u0430\u044F \u0443\u043B\u044B\u0431\u043A\u0430"],
      ["\u{1F606}", "\u0441\u043C\u0435\u044F\u0442\u044C\u0441\u044F"],
      ["\u{1F605}", "\u043D\u0435\u043B\u043E\u0432\u043A\u043E \u043F\u043E\u0442"],
      ["\u{1F602}", "\u0441\u043C\u0435\u0445 \u0441\u043B\u0451\u0437\u044B"],
      ["\u{1F923}", "\u0445\u043E\u0445\u043E\u0442 \u0441\u043C\u0435\u0445"],
      ["\u{1F60A}", "\u0441\u043C\u0443\u0449\u0435\u043D\u0438\u0435 \u0443\u043B\u044B\u0431\u043A\u0430"],
      ["\u{1F642}", "\u0443\u043B\u044B\u0431\u043A\u0430"],
      ["\u{1F643}", "\u0432\u0432\u0435\u0440\u0445 \u043D\u043E\u0433\u0430\u043C\u0438"],
      ["\u{1F609}", "\u043F\u043E\u0434\u043C\u0438\u0433\u0438\u0432\u0430\u043D\u0438\u0435"],
      ["\u{1F60D}", "\u0432\u043B\u044E\u0431\u043B\u0451\u043D\u043D\u043E\u0441\u0442\u044C \u043B\u044E\u0431\u043E\u0432\u044C"],
      ["\u{1F970}", "\u043B\u044E\u0431\u043E\u0432\u044C \u043D\u0435\u0436\u043D\u043E\u0441\u0442\u044C"],
      ["\u{1F618}", "\u043F\u043E\u0446\u0435\u043B\u0443\u0439"],
      ["\u{1F60B}", "\u0432\u043A\u0443\u0441\u043D\u043E"],
      ["\u{1F60E}", "\u043A\u0440\u0443\u0442\u043E \u043E\u0447\u043A\u0438"],
      ["\u{1F913}", "\u0443\u043C\u043D\u0438\u043A \u043E\u0447\u043A\u0438"],
      ["\u{1F973}", "\u043F\u0440\u0430\u0437\u0434\u043D\u0438\u043A \u0432\u0435\u0447\u0435\u0440\u0438\u043D\u043A\u0430"],
      ["\u{1F929}", "\u0432\u043E\u0441\u0442\u043E\u0440\u0433 \u0437\u0432\u0451\u0437\u0434\u044B"],
      ["\u{1F917}", "\u043E\u0431\u043D\u044F\u0442\u044C \u043E\u0431\u044A\u044F\u0442\u0438\u044F"],
      ["\u{1F914}", "\u0434\u0443\u043C\u0430\u044E \u0432\u043E\u043F\u0440\u043E\u0441"],
      ["\u{1FAE0}", "\u0442\u0430\u044F\u0442\u044C"],
      ["\u{1F979}", "\u0441\u043B\u0451\u0437\u044B \u0440\u0430\u0434\u043E\u0441\u0442\u044C"],
      ["\u{1F634}", "\u0441\u043E\u043D \u0441\u043F\u0430\u0442\u044C"],
      ["\u{1F62E}", "\u0443\u0434\u0438\u0432\u043B\u0435\u043D\u0438\u0435"],
      ["\u{1F622}", "\u0433\u0440\u0443\u0441\u0442\u044C \u0441\u043B\u0435\u0437\u0430"],
      ["\u{1F62D}", "\u043F\u043B\u0430\u0447"],
      ["\u{1F624}", "\u0441\u0435\u0440\u0434\u0438\u0442\u044C\u0441\u044F"],
      ["\u{1F648}", "\u043E\u0431\u0435\u0437\u044C\u044F\u043D\u0430 \u043D\u0435 \u0432\u0438\u0436\u0443"],
      ["\u{1F440}", "\u0433\u043B\u0430\u0437\u0430 \u0441\u043C\u043E\u0442\u0440\u044E"],
      ["\u{1F4AA}", "\u0441\u0438\u043B\u0430"],
      ["\u{1F44D}", "\u043F\u0430\u043B\u0435\u0446 \u0432\u0432\u0435\u0440\u0445 \u0434\u0430 \u0445\u043E\u0440\u043E\u0448\u043E"],
      ["\u{1F44E}", "\u043F\u0430\u043B\u0435\u0446 \u0432\u043D\u0438\u0437 \u043D\u0435\u0442"],
      ["\u{1F44B}", "\u043F\u0440\u0438\u0432\u0435\u0442 \u043F\u043E\u043A\u0430"],
      ["\u{1F44C}", "\u043E\u043A\u0435\u0439 \u0445\u043E\u0440\u043E\u0448\u043E"],
      ["\u270C\uFE0F", "\u043C\u0438\u0440 \u043F\u043E\u0431\u0435\u0434\u0430"],
      ["\u{1F91E}", "\u0443\u0434\u0430\u0447\u0430"],
      ["\u{1F64C}", "\u0443\u0440\u0430 \u0440\u0443\u043A\u0438"],
      ["\u{1F44F}", "\u0430\u043F\u043B\u043E\u0434\u0438\u0441\u043C\u0435\u043D\u0442\u044B"],
      ["\u{1F64F}", "\u0441\u043F\u0430\u0441\u0438\u0431\u043E \u043F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430"],
      ["\u{1F91D}", "\u0440\u0443\u043A\u043E\u043F\u043E\u0436\u0430\u0442\u0438\u0435 \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0438\u043B\u0438\u0441\u044C"],
      ["\u{1FAF6}", "\u0441\u0435\u0440\u0434\u0446\u0435 \u0440\u0443\u043A\u0438 \u043B\u044E\u0431\u043E\u0432\u044C"],
      ["\u{1F468}\u200D\u{1F469}\u200D\u{1F467}", "\u0441\u0435\u043C\u044C\u044F"],
      ["\u{1F44D}\u{1F3FD}", "\u043F\u0430\u043B\u0435\u0446 \u0432\u0432\u0435\u0440\u0445 \u0441\u0440\u0435\u0434\u043D\u0438\u0439 \u0442\u043E\u043D"]
    ],
    nature: [
      ["\u{1F436}", "\u0441\u043E\u0431\u0430\u043A\u0430"],
      ["\u{1F431}", "\u043A\u043E\u0442 \u043A\u043E\u0448\u043A\u0430"],
      ["\u{1F43B}", "\u043C\u0435\u0434\u0432\u0435\u0434\u044C"],
      ["\u{1F98A}", "\u043B\u0438\u0441\u0430"],
      ["\u{1F43C}", "\u043F\u0430\u043D\u0434\u0430"],
      ["\u{1F438}", "\u043B\u044F\u0433\u0443\u0448\u043A\u0430"],
      ["\u{1F98B}", "\u0431\u0430\u0431\u043E\u0447\u043A\u0430"],
      ["\u{1F41D}", "\u043F\u0447\u0435\u043B\u0430"],
      ["\u{1F338}", "\u0446\u0432\u0435\u0442\u043E\u043A \u0441\u0430\u043A\u0443\u0440\u0430"],
      ["\u{1F33B}", "\u043F\u043E\u0434\u0441\u043E\u043B\u043D\u0443\u0445"],
      ["\u{1F33F}", "\u0437\u0435\u043B\u0435\u043D\u044C \u043B\u0438\u0441\u0442"],
      ["\u{1F340}", "\u043A\u043B\u0435\u0432\u0435\u0440 \u0443\u0434\u0430\u0447\u0430"],
      ["\u{1F332}", "\u043B\u0435\u0441 \u0451\u043B\u043A\u0430"],
      ["\u{1F341}", "\u043E\u0441\u0435\u043D\u044C \u043B\u0438\u0441\u0442"],
      ["\u2600\uFE0F", "\u0441\u043E\u043B\u043D\u0446\u0435"],
      ["\u{1F319}", "\u043B\u0443\u043D\u0430 \u043D\u043E\u0447\u044C"],
      ["\u{1F308}", "\u0440\u0430\u0434\u0443\u0433\u0430"],
      ["\u2744\uFE0F", "\u0441\u043D\u0435\u0433 \u0437\u0438\u043C\u0430"],
      ["\u{1F327}\uFE0F", "\u0434\u043E\u0436\u0434\u044C"],
      ["\u{1F525}", "\u043E\u0433\u043E\u043D\u044C \u043A\u0440\u0443\u0442\u043E"],
      ["\u2B50", "\u0437\u0432\u0435\u0437\u0434\u0430"],
      ["\u2728", "\u0438\u0441\u043A\u0440\u044B \u0432\u043E\u043B\u0448\u0435\u0431\u0441\u0442\u0432\u043E"],
      ["\u{1F30A}", "\u043C\u043E\u0440\u0435 \u0432\u043E\u043B\u043D\u0430"],
      ["\u26C4", "\u0441\u043D\u0435\u0433\u043E\u0432\u0438\u043A"]
    ],
    food: [
      ["\u{1F355}", "\u043F\u0438\u0446\u0446\u0430"],
      ["\u{1F354}", "\u0431\u0443\u0440\u0433\u0435\u0440"],
      ["\u{1F35F}", "\u043A\u0430\u0440\u0442\u043E\u0448\u043A\u0430 \u0444\u0440\u0438"],
      ["\u{1F32E}", "\u0442\u0430\u043A\u043E"],
      ["\u{1F363}", "\u0441\u0443\u0448\u0438"],
      ["\u{1F35C}", "\u043B\u0430\u043F\u0448\u0430 \u0440\u0430\u043C\u0435\u043D"],
      ["\u{1F35D}", "\u043F\u0430\u0441\u0442\u0430 \u0441\u043F\u0430\u0433\u0435\u0442\u0442\u0438"],
      ["\u{1F957}", "\u0441\u0430\u043B\u0430\u0442"],
      ["\u{1F950}", "\u043A\u0440\u0443\u0430\u0441\u0441\u0430\u043D"],
      ["\u{1F35E}", "\u0445\u043B\u0435\u0431"],
      ["\u{1F9C0}", "\u0441\u044B\u0440"],
      ["\u{1F34E}", "\u044F\u0431\u043B\u043E\u043A\u043E"],
      ["\u{1F34B}", "\u043B\u0438\u043C\u043E\u043D"],
      ["\u{1F353}", "\u043A\u043B\u0443\u0431\u043D\u0438\u043A\u0430"],
      ["\u{1F352}", "\u0432\u0438\u0448\u043D\u044F"],
      ["\u{1F349}", "\u0430\u0440\u0431\u0443\u0437"],
      ["\u{1F370}", "\u0442\u043E\u0440\u0442"],
      ["\u{1F36A}", "\u043F\u0435\u0447\u0435\u043D\u044C\u0435"],
      ["\u{1F36B}", "\u0448\u043E\u043A\u043E\u043B\u0430\u0434"],
      ["\u{1F366}", "\u043C\u043E\u0440\u043E\u0436\u0435\u043D\u043E\u0435"],
      ["\u2615", "\u043A\u043E\u0444\u0435 \u0447\u0430\u0439"],
      ["\u{1F375}", "\u0447\u0430\u0439"],
      ["\u{1F377}", "\u0432\u0438\u043D\u043E"],
      ["\u{1F942}", "\u0431\u043E\u043A\u0430\u043B\u044B \u043F\u0440\u0430\u0437\u0434\u043D\u0438\u043A"],
      ["\u{1F37B}", "\u043F\u0438\u0432\u043E"],
      ["\u{1F9C3}", "\u0441\u043E\u043A"],
      ["\u{1FAD6}", "\u0447\u0430\u0439\u043D\u0438\u043A"],
      ["\u{1F964}", "\u043D\u0430\u043F\u0438\u0442\u043E\u043A"]
    ],
    travel: [
      ["\u{1F3E0}", "\u0434\u043E\u043C"],
      ["\u{1F3E1}", "\u0434\u043E\u043C \u0441\u0430\u0434"],
      ["\u{1F3D5}\uFE0F", "\u043F\u0430\u043B\u0430\u0442\u043A\u0430 \u043F\u043E\u0445\u043E\u0434"],
      ["\u{1F3D4}\uFE0F", "\u0433\u043E\u0440\u044B"],
      ["\u{1F3D6}\uFE0F", "\u043F\u043B\u044F\u0436 \u043E\u0442\u0434\u044B\u0445"],
      ["\u{1F3D9}\uFE0F", "\u0433\u043E\u0440\u043E\u0434"],
      ["\u{1F697}", "\u043C\u0430\u0448\u0438\u043D\u0430 \u0430\u0432\u0442\u043E\u043C\u043E\u0431\u0438\u043B\u044C"],
      ["\u{1F695}", "\u0442\u0430\u043A\u0441\u0438"],
      ["\u{1F68C}", "\u0430\u0432\u0442\u043E\u0431\u0443\u0441"],
      ["\u{1F686}", "\u043F\u043E\u0435\u0437\u0434"],
      ["\u2708\uFE0F", "\u0441\u0430\u043C\u043E\u043B\u0451\u0442 \u043F\u0443\u0442\u0435\u0448\u0435\u0441\u0442\u0432\u0438\u0435"],
      ["\u{1F6B2}", "\u0432\u0435\u043B\u043E\u0441\u0438\u043F\u0435\u0434"],
      ["\u{1F6B6}", "\u043F\u0440\u043E\u0433\u0443\u043B\u043A\u0430 \u043F\u0435\u0448\u043A\u043E\u043C"],
      ["\u{1F9ED}", "\u043A\u043E\u043C\u043F\u0430\u0441"],
      ["\u{1F5FA}\uFE0F", "\u043A\u0430\u0440\u0442\u0430"],
      ["\u{1F3A1}", "\u043A\u043E\u043B\u0435\u0441\u043E \u043E\u0431\u043E\u0437\u0440\u0435\u043D\u0438\u044F"],
      ["\u26F5", "\u043F\u0430\u0440\u0443\u0441\u043D\u0438\u043A"],
      ["\u{1F680}", "\u0440\u0430\u043A\u0435\u0442\u0430"]
    ],
    objects: [
      ["\u{1F389}", "\u043F\u0440\u0430\u0437\u0434\u043D\u0438\u043A \u043A\u043E\u043D\u0444\u0435\u0442\u0442\u0438"],
      ["\u{1F38A}", "\u043A\u043E\u043D\u0444\u0435\u0442\u0442\u0438"],
      ["\u{1F388}", "\u0448\u0430\u0440\u0438\u043A"],
      ["\u{1F381}", "\u043F\u043E\u0434\u0430\u0440\u043E\u043A"],
      ["\u{1F382}", "\u0434\u0435\u043D\u044C \u0440\u043E\u0436\u0434\u0435\u043D\u0438\u044F \u0442\u043E\u0440\u0442"],
      ["\u{1F3B2}", "\u043A\u0443\u0431\u0438\u043A \u043D\u0430\u0441\u0442\u043E\u043B\u043A\u0438 \u0438\u0433\u0440\u044B"],
      ["\u265F\uFE0F", "\u0448\u0430\u0445\u043C\u0430\u0442\u044B"],
      ["\u{1F3AE}", "\u0438\u0433\u0440\u0430 \u0433\u0435\u0439\u043C\u043F\u0430\u0434"],
      ["\u{1F3A7}", "\u043D\u0430\u0443\u0448\u043D\u0438\u043A\u0438 \u043C\u0443\u0437\u044B\u043A\u0430"],
      ["\u{1F3B8}", "\u0433\u0438\u0442\u0430\u0440\u0430"],
      ["\u{1F3B5}", "\u043D\u043E\u0442\u0430 \u043C\u0443\u0437\u044B\u043A\u0430"],
      ["\u{1F3AC}", "\u043A\u0438\u043D\u043E"],
      ["\u{1F4F7}", "\u0444\u043E\u0442\u043E \u043A\u0430\u043C\u0435\u0440\u0430"],
      ["\u{1F4DA}", "\u043A\u043D\u0438\u0433\u0438"],
      ["\u{1F4A1}", "\u0438\u0434\u0435\u044F \u043B\u0430\u043C\u043F\u043E\u0447\u043A\u0430"],
      ["\u{1F48C}", "\u043F\u0438\u0441\u044C\u043C\u043E"],
      ["\u{1F4C5}", "\u043A\u0430\u043B\u0435\u043D\u0434\u0430\u0440\u044C \u0434\u0430\u0442\u0430"],
      ["\u23F0", "\u0431\u0443\u0434\u0438\u043B\u044C\u043D\u0438\u043A \u0432\u0440\u0435\u043C\u044F"],
      ["\u26BD", "\u0444\u0443\u0442\u0431\u043E\u043B \u043C\u044F\u0447"],
      ["\u{1F3C6}", "\u043A\u0443\u0431\u043E\u043A \u043F\u043E\u0431\u0435\u0434\u0430"]
    ],
    symbols: [
      ["\u2764\uFE0F", "\u043A\u0440\u0430\u0441\u043D\u043E\u0435 \u0441\u0435\u0440\u0434\u0446\u0435 \u043B\u044E\u0431\u043E\u0432\u044C"],
      ["\u{1F9E1}", "\u043E\u0440\u0430\u043D\u0436\u0435\u0432\u043E\u0435 \u0441\u0435\u0440\u0434\u0446\u0435"],
      ["\u{1F49B}", "\u0436\u0451\u043B\u0442\u043E\u0435 \u0441\u0435\u0440\u0434\u0446\u0435"],
      ["\u{1F49A}", "\u0437\u0435\u043B\u0451\u043D\u043E\u0435 \u0441\u0435\u0440\u0434\u0446\u0435"],
      ["\u{1F499}", "\u0441\u0438\u043D\u0435\u0435 \u0441\u0435\u0440\u0434\u0446\u0435"],
      ["\u{1F49C}", "\u0444\u0438\u043E\u043B\u0435\u0442\u043E\u0432\u043E\u0435 \u0441\u0435\u0440\u0434\u0446\u0435"],
      ["\u{1F5A4}", "\u0447\u0451\u0440\u043D\u043E\u0435 \u0441\u0435\u0440\u0434\u0446\u0435"],
      ["\u{1F90D}", "\u0431\u0435\u043B\u043E\u0435 \u0441\u0435\u0440\u0434\u0446\u0435"],
      ["\u{1F495}", "\u0434\u0432\u0430 \u0441\u0435\u0440\u0434\u0446\u0430"],
      ["\u{1F494}", "\u0440\u0430\u0437\u0431\u0438\u0442\u043E\u0435 \u0441\u0435\u0440\u0434\u0446\u0435"],
      ["\u{1F4AF}", "\u0441\u0442\u043E \u043F\u0440\u043E\u0446\u0435\u043D\u0442\u043E\u0432"],
      ["\u2705", "\u0433\u0430\u043B\u043E\u0447\u043A\u0430 \u0433\u043E\u0442\u043E\u0432\u043E"],
      ["\u274C", "\u043A\u0440\u0435\u0441\u0442\u0438\u043A \u043D\u0435\u0442"],
      ["\u2757", "\u0432\u043E\u0441\u043A\u043B\u0438\u0446\u0430\u043D\u0438\u0435"],
      ["\u2753", "\u0432\u043E\u043F\u0440\u043E\u0441"],
      ["\u{1F4A4}", "\u0441\u043E\u043D"],
      ["\u2795", "\u043F\u043B\u044E\u0441"],
      ["\u{1F4AB}", "\u0437\u0432\u0435\u0437\u0434\u0430 \u0438\u0441\u043A\u0440\u0430"]
    ]
  };
  var emojis = Object.entries(groups).flatMap(
    ([category, values]) => values.map(([value, name]) => ({ value, name, category }))
  );
  var emojiName = (value) => emojis.find((emoji) => emoji.value === value)?.name ?? value;
  var filterEmoji = (category, query, recent) => {
    const normalized = query.toLocaleLowerCase("ru").replaceAll("\u0451", "\u0435").trim();
    if (normalized) {
      return emojis.filter(
        (emoji) => emoji.name.replaceAll("\u0451", "\u0435").includes(normalized) || emoji.value === normalized
      );
    }
    if (category === "recent") {
      return recent.map((value) => emojis.find((emoji) => emoji.value === value)).filter((emoji) => Boolean(emoji));
    }
    return emojis.filter((emoji) => emoji.category === category);
  };

  // openspec/changes/meeting-experience-refresh/assets/revisions/2026-10-27-telegram-chat/src/pages/chat/ui/emoji-picker.ts
  var emojiResults = (state, reaction = false) => {
    const category = reaction ? state.reaction?.category ?? "recent" : state.emojiCategory;
    const query = reaction ? state.reaction?.query ?? "" : state.emojiQuery;
    const values = filterEmoji(category, query, state.recent);
    const selected = state.messages.find((message) => message.id === state.reaction?.messageId)?.reactions ?? {};
    if (!values.length) {
      return `<div class="emoji-empty">${icon("search")}<strong>\u042D\u043C\u043E\u0434\u0437\u0438 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B</strong><span>\u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0434\u0440\u0443\u0433\u043E\u0435 \u0441\u043B\u043E\u0432\u043E</span><button type="button" data-action="clear-emoji-search" data-mode="${reaction ? "reaction" : "composer"}">\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C \u043F\u043E\u0438\u0441\u043A</button></div>`;
    }
    return `<div class="emoji-category-label">${query ? "\u0420\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u044B \u043F\u043E\u0438\u0441\u043A\u0430" : categories.find((item) => item.id === category)?.label}</div><div class="emoji-grid">${values.map((emoji) => `<button type="button" class="emoji-choice ${reaction && selected[emoji.value]?.includes(state.user) ? "is-selected" : ""}" data-action="${reaction ? "pick-reaction" : "insert-emoji"}" data-emoji="${emoji.value}" aria-label="${reaction ? selected[emoji.value]?.includes(state.user) ? "\u0421\u043D\u044F\u0442\u044C \u0440\u0435\u0430\u043A\u0446\u0438\u044E" : "\u041F\u043E\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u0440\u0435\u0430\u043A\u0446\u0438\u044E" : "\u0412\u0441\u0442\u0430\u0432\u0438\u0442\u044C"}: ${escapeHtml(emoji.name)}" ${reaction ? `aria-pressed="${Boolean(selected[emoji.value]?.includes(state.user))}"` : ""}>${emoji.value}</button>`).join("")}</div>`;
  };
  var emojiPicker = (state, reaction = false) => {
    const category = reaction ? state.reaction?.category ?? "recent" : state.emojiCategory;
    const query = reaction ? state.reaction?.query ?? "" : state.emojiQuery;
    const mode = reaction ? "reaction" : "composer";
    return `<div class="emoji-toolbar"><label class="emoji-search">${icon("search")}<input type="search" placeholder="\u041F\u043E\u0438\u0441\u043A \u044D\u043C\u043E\u0434\u0437\u0438" aria-label="\u041F\u043E\u0438\u0441\u043A \u044D\u043C\u043E\u0434\u0437\u0438 \u043F\u043E \u0440\u0443\u0441\u0441\u043A\u043E\u043C\u0443 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044E" data-emoji-search="${mode}" value="${escapeHtml(query)}" autocomplete="off"></label>${reaction ? iconButton("close-reaction", "\u0417\u0430\u043A\u0440\u044B\u0442\u044C \u0440\u0435\u0430\u043A\u0446\u0438\u0438", "close") : iconButton("emoji-backspace", "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0441\u0438\u043C\u0432\u043E\u043B \u043F\u0435\u0440\u0435\u0434 \u043A\u0443\u0440\u0441\u043E\u0440\u043E\u043C \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F", "backspace")}</div>
    <div class="emoji-categories" role="group" aria-label="\u041A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438 \u044D\u043C\u043E\u0434\u0437\u0438">${categories.map((item) => `<button type="button" data-action="emoji-category" data-category="${item.id}" data-mode="${mode}" aria-label="${item.label}" aria-pressed="${item.id === category && !query}" class="${item.id === category && !query ? "active" : ""}">${item.icon}</button>`).join("")}</div>
    <div class="emoji-results" data-emoji-results="${mode}">${emojiResults(state, reaction)}</div>`;
  };
  var reactionPicker = (state) => {
    if (!state.reaction) {
      return "";
    }
    const message = state.messages.find(
      (item) => item.id === state.reaction?.messageId
    );
    return `<section class="reaction-picker ${state.reaction.expanded ? "expanded" : ""}" role="dialog" aria-label="\u0420\u0435\u0430\u043A\u0446\u0438\u0438 \u043D\u0430 \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u043E\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435">
    ${state.reaction.expanded ? `<div class="reaction-context"><span>\u0420\u0435\u0430\u043A\u0446\u0438\u044F \u043D\u0430 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435</span><p>${escapeHtml(message?.text ?? "")}</p></div>${emojiPicker(state, true)}` : `<div class="quick-reactions">${["\u2764\uFE0F", "\u{1F44D}", "\u{1F602}", "\u{1F525}", "\u{1F389}"].map((emoji) => `<button type="button" class="emoji-choice ${message?.reactions[emoji]?.includes(state.user) ? "is-selected" : ""}" data-action="pick-reaction" data-emoji="${emoji}" aria-label="${message?.reactions[emoji]?.includes(state.user) ? "\u0421\u043D\u044F\u0442\u044C" : "\u041F\u043E\u0441\u0442\u0430\u0432\u0438\u0442\u044C"} \u0440\u0435\u0430\u043A\u0446\u0438\u044E: ${emojiName(emoji)}" aria-pressed="${Boolean(message?.reactions[emoji]?.includes(state.user))}">${emoji}</button>`).join("")}${iconButton("expand-reaction", "\u0415\u0449\u0451 \u0440\u0435\u0430\u043A\u0446\u0438\u0438", "down")}</div>`}
  </section>`;
  };

  // openspec/changes/meeting-experience-refresh/assets/revisions/2026-10-27-telegram-chat/src/pages/chat/lib/composer.ts
  var installComposer = (context) => {
    const { state } = context;
    const input = find("#message-input");
    const conversation = find("#conversation");
    const button = find("#emoji-button");
    const dock = find("#emoji-dock");
    context.rememberSelection = () => {
      state.selection = { start: input.selectionStart, end: input.selectionEnd };
      state.draft = input.value;
    };
    context.updateDraft = () => {
      input.value = state.draft;
      input.style.height = "auto";
      input.style.height = `${Math.min(input.scrollHeight, 108)}px`;
      find("#send-button").disabled = !state.draft.trim();
    };
    context.setEmoji = (open, keyboard = false) => {
      if (open) {
        context.closeReaction();
      }
      const scroll = conversation.scrollTop;
      const atBottom = conversation.scrollHeight - conversation.clientHeight - scroll < 24;
      const unchanged = state.emojiOpen === open;
      state.emojiOpen = open;
      state.menuOpen = false;
      find("#add-menu").hidden = true;
      find("#add-button").setAttribute("aria-expanded", "false");
      if (unchanged) {
        return;
      }
      if (open) {
        context.rememberSelection();
        input.blur();
        dock.innerHTML = emojiPicker(state);
      }
      dock.hidden = !open;
      button.innerHTML = icon(open ? "keyboard" : "smile");
      button.setAttribute(
        "aria-label",
        open ? "\u0412\u0435\u0440\u043D\u0443\u0442\u044C\u0441\u044F \u043A \u043A\u043B\u0430\u0432\u0438\u0430\u0442\u0443\u0440\u0435" : "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u044D\u043C\u043E\u0434\u0437\u0438"
      );
      button.setAttribute("aria-expanded", String(open));
      requestAnimationFrame(() => {
        conversation.scrollTop = atBottom ? conversation.scrollHeight : scroll;
        if (!open && keyboard) {
          input.focus({ preventScroll: true });
          input.setSelectionRange(state.selection.start, state.selection.end);
        }
      });
    };
    input.addEventListener("input", () => {
      context.rememberSelection();
      context.updateDraft();
    });
    for (const name of ["select", "keyup", "click", "blur"]) {
      input.addEventListener(name, context.rememberSelection);
    }
    input.addEventListener("pointerdown", () => {
      if (state.emojiOpen) {
        context.setEmoji(false);
      }
    });
    find("#composer").addEventListener("submit", (event) => {
      event.preventDefault();
      if (!input.value.trim()) {
        return;
      }
      state.messages.push({
        id: `m${Date.now()}`,
        author: state.user,
        text: input.value.trim(),
        time: "12:40",
        reactions: {}
      });
      state.draft = "";
      state.selection = { start: 0, end: 0 };
      context.updateDraft();
      context.redrawConversation(true);
      context.announce("\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u043E \u0432 \u043C\u0430\u043A\u0435\u0442 \u0447\u0430\u0442\u0430");
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
        find("#composer").requestSubmit();
      }
    });
    context.updateDraft();
    input.setSelectionRange(state.selection.start, state.selection.end);
  };
  var insertEmoji = (context, emoji) => {
    const { state } = context;
    const { start, end } = state.selection;
    state.draft = state.draft.slice(0, start) + emoji + state.draft.slice(end);
    state.selection = { start: start + emoji.length, end: start + emoji.length };
    state.recent = [
      emoji,
      ...state.recent.filter((value) => value !== emoji)
    ].slice(0, 24);
    context.updateDraft();
    find("#message-input").setSelectionRange(
      state.selection.start,
      state.selection.end
    );
    context.announce(`\u042D\u043C\u043E\u0434\u0437\u0438 ${emoji} \u0432\u0441\u0442\u0430\u0432\u043B\u0435\u043D \u0432 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435`);
  };
  var removePreviousGrapheme = (context) => {
    const { state } = context;
    let { start, end } = state.selection;
    if (start === end && start > 0) {
      const segments = Array.from(
        new Intl.Segmenter("ru", { granularity: "grapheme" }).segment(
          state.draft.slice(0, start)
        )
      );
      start = segments.at(-1)?.index ?? start - 1;
    }
    state.draft = state.draft.slice(0, start) + state.draft.slice(end);
    state.selection = { start, end: start };
    context.updateDraft();
    find("#message-input").setSelectionRange(start, start);
  };

  // openspec/changes/meeting-experience-refresh/assets/revisions/2026-10-27-telegram-chat/src/pages/chat/ui/forms.ts
  var dateField = (target, value, label) => `<div class="field"><span class="field-label" id="${target}-label">${label}</span><button class="date-field" type="button" data-action="calendar" data-target="${target}" data-value="${value}" aria-labelledby="${target}-label ${target}-value">${icon("calendar")}<span id="${target}-value">${dateLabel(value, true)}</span>${icon("down")}</button></div>`;
  var timeField = (target, value) => `<label class="field"><span class="field-label">\u0412\u0440\u0435\u043C\u044F</span><span class="input-with-icon">${icon("clock")}<input name="${target}" type="text" inputmode="numeric" maxlength="5" pattern="([01][0-9]|2[0-3]):[0-5][0-9]" value="${escapeHtml(value)}" placeholder="\u0427\u0427:\u041C\u041C" aria-label="\u0412\u0440\u0435\u043C\u044F, \u0447\u0430\u0441\u044B \u0438 \u043C\u0438\u043D\u0443\u0442\u044B"></span></label>`;
  var calendarView = (state) => {
    if (!state.calendar) {
      return "";
    }
    const { year, month } = state.calendar;
    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
    const days = new Date(year, month + 1, 0).getDate();
    const monthName = new Date(year, month, 1).toLocaleDateString("ru-RU", {
      month: "long",
      year: "numeric"
    });
    const cells = Array.from(
      { length: firstDay },
      () => '<span class="calendar-blank"></span>'
    );
    for (let day = 1; day <= days; day += 1) {
      const value = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      cells.push(
        `<button type="button" data-action="pick-date" data-date="${value}" aria-label="${dateLabel(value)} ${year}" class="${value === "2026-10-27" ? "today" : ""}">${day}</button>`
      );
    }
    return `<div class="calendar-surface" role="group" aria-label="\u0412\u044B\u0431\u043E\u0440 \u0434\u0430\u0442\u044B"><div class="calendar-heading">${iconButton("calendar-prev", "\u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0438\u0439 \u043C\u0435\u0441\u044F\u0446", "left")}<strong>${monthName}</strong>${iconButton("calendar-next", "\u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0439 \u043C\u0435\u0441\u044F\u0446", "right")}${iconButton("calendar-close", "\u0417\u0430\u043A\u0440\u044B\u0442\u044C \u043A\u0430\u043B\u0435\u043D\u0434\u0430\u0440\u044C", "close")}</div><div class="calendar-weekdays">${["\u043F\u043D", "\u0432\u0442", "\u0441\u0440", "\u0447\u0442", "\u043F\u0442", "\u0441\u0431", "\u0432\u0441"].map((day) => `<span>${day}</span>`).join("")}</div><div class="calendar-days">${cells.join("")}</div></div>`;
  };
  var settingsForm = (state) => {
    const draft = state.settingsDraft ?? state.meeting;
    return `<form id="sheet-form" data-form="settings" class="sheet-form">
    <div class="sheet-scroll"><div class="form-section">
      <label class="field"><span class="field-label">\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435</span><input name="title" value="${escapeHtml(draft.title)}" maxlength="100" required></label>
      <label class="field"><span class="field-label">\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435</span><textarea name="description" rows="2" maxlength="2000">${escapeHtml(draft.description)}</textarea></label>
    </div><div class="form-section"><div class="two-fields">${dateField("settings-date", draft.date, "\u0414\u0430\u0442\u0430")}${timeField("time", draft.time)}</div>
      <p class="field-note">\u041C\u043E\u0441\u043A\u0432\u0430 \xB7 UTC+3. \u0412\u0440\u0435\u043C\u044F \u043C\u043E\u0436\u043D\u043E \u043D\u0435 \u0443\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C.</p>
      <label class="field"><span class="field-label">\u041C\u0435\u0441\u0442\u043E</span><input name="place" value="${escapeHtml(draft.place)}" maxlength="200"></label>
    </div>
    <div class="cover-row"><div class="cover-preview ${draft.cover ? "has-cover" : ""}">${icon("photo")}</div><div><strong>\u041E\u0431\u043B\u043E\u0436\u043A\u0430</strong><span>${draft.cover ? "\u0424\u043E\u0442\u043E \u0432\u0441\u0442\u0440\u0435\u0447\u0438" : "\u041D\u0435 \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u0430"}</span></div><button type="button" class="text-button" data-action="toggle-cover">${draft.cover ? "\u0423\u0431\u0440\u0430\u0442\u044C" : "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C"}</button></div>
    <div id="calendar-slot">${calendarView(state)}</div><p class="form-error" id="form-error" role="alert" hidden></p>
    </div><div class="sheet-actions"><button class="primary-button" type="submit">\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C</button></div>
  </form>`;
  };
  var dateForm = (state) => {
    const draft = state.dateDraft;
    const switches = [
      ["multiple", "\u041D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u043E\u0442\u0432\u0435\u0442\u043E\u0432"],
      ["change", "\u041C\u043E\u0436\u043D\u043E \u0438\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u0433\u043E\u043B\u043E\u0441"],
      ["add", "\u041C\u043E\u0436\u043D\u043E \u0434\u043E\u0431\u0430\u0432\u043B\u044F\u0442\u044C \u0432\u0430\u0440\u0438\u0430\u043D\u0442\u044B"],
      ["anonymous", "\u0410\u043D\u043E\u043D\u0438\u043C\u043D\u044B\u0439 \u043E\u043F\u0440\u043E\u0441"],
      ["hidden", "\u0421\u043A\u0440\u044B\u0442\u044C \u0438\u0442\u043E\u0433\u0438 \u0434\u043E \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0438\u044F"]
    ];
    return `<form id="sheet-form" data-form="date" class="sheet-form"><div class="sheet-scroll">
    <div class="form-section"><div class="section-label">\u0412\u0430\u0440\u0438\u0430\u043D\u0442\u044B \u0434\u0430\u0442\u044B</div><div class="date-options">${draft.dates.map((date, index) => `<div class="date-option">${dateField(`date-${index}`, date, `\u0412\u0430\u0440\u0438\u0430\u043D\u0442 ${index + 1}`)}${draft.dates.length > 2 ? iconButton("remove-date", `\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0432\u0430\u0440\u0438\u0430\u043D\u0442 ${index + 1}`, "trash", `data-index="${index}"`) : ""}</div>`).join("")}</div>
    <button type="button" class="text-button add-date" data-action="add-date">${icon("plus")}\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0434\u0430\u0442\u0443</button></div>
    <div class="form-section switch-group">${switches.map(([key, label]) => `<label class="switch-row"><span>${label}</span><input type="checkbox" name="${key}" ${draft[key] ? "checked" : ""}><span class="switch" aria-hidden="true"></span></label>`).join("")}</div>
    <div class="form-section"><div class="section-label">\u041E\u043A\u043E\u043D\u0447\u0430\u043D\u0438\u0435 \u043E\u043F\u0440\u043E\u0441\u0430</div><div class="two-fields">${dateField("date-end", draft.endDate, "\u0414\u0430\u0442\u0430")}${timeField("endTime", draft.endTime)}</div><p class="field-note">\u041F\u043E \u043C\u043E\u0441\u043A\u043E\u0432\u0441\u043A\u043E\u043C\u0443 \u0432\u0440\u0435\u043C\u0435\u043D\u0438</p></div>
    <div id="calendar-slot">${calendarView(state)}</div><p class="form-error" id="form-error" role="alert" hidden></p>
    </div><div class="sheet-actions"><button class="primary-button" type="submit">\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043E\u043F\u0440\u043E\u0441</button></div></form>`;
  };
  var placeForm = (state) => `<form id="sheet-form" data-form="place" class="sheet-form"><div class="sheet-scroll">
  ${state.activePlacePoll ? '<p class="notice">\u0421\u0435\u0439\u0447\u0430\u0441 \u0438\u0434\u0451\u0442 \u043E\u043F\u0440\u043E\u0441 \u043E \u043B\u043E\u0444\u0442\u0435 \xAB\u0421\u043E\u0441\u0435\u0434\u0438\xBB. \u041D\u043E\u0432\u043E\u0435 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u043C\u043E\u0436\u043D\u043E \u043E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u043F\u043E\u0441\u043B\u0435 \u0435\u0433\u043E \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0438\u044F.</p>' : ""}
  <label class="field"><span class="field-label">\u041D\u043E\u0432\u043E\u0435 \u043C\u0435\u0441\u0442\u043E</span><input name="place" placeholder="\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0438\u043B\u0438 \u0430\u0434\u0440\u0435\u0441" value="${escapeHtml(state.placeDraft.place)}" maxlength="200" required></label>
  <label class="field"><span class="field-label">\u041F\u043E\u0447\u0435\u043C\u0443 \u0437\u0434\u0435\u0441\u044C <span class="optional">\u043D\u0435\u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E</span></span><textarea name="why" rows="3" maxlength="2000" placeholder="\u0427\u0442\u043E \u0441\u0442\u043E\u0438\u0442 \u0437\u043D\u0430\u0442\u044C \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u0438">${escapeHtml(state.placeDraft.why)}</textarea></label>
  <div class="section-label">\u041E\u043A\u043E\u043D\u0447\u0430\u043D\u0438\u0435 \u043E\u043F\u0440\u043E\u0441\u0430</div><div class="two-fields">${dateField("place-end", state.placeDraft.endDate, "\u0414\u0430\u0442\u0430")}${timeField("endTime", state.placeDraft.endTime)}</div>
  <div id="calendar-slot">${calendarView(state)}</div><p class="form-error" id="form-error" role="alert" hidden></p>
  </div><div class="sheet-actions"><button class="primary-button" type="submit" ${state.activePlacePoll ? "disabled" : ""}>${state.activePlacePoll ? "\u0423\u0436\u0435 \u0438\u0434\u0451\u0442 \u043E\u043F\u0440\u043E\u0441 \u043E \u043C\u0435\u0441\u0442\u0435" : "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043E\u043F\u0440\u043E\u0441"}</button></div></form>`;
  var newTaskForm = (state) => `<form id="sheet-form" data-form="new-task" class="sheet-form"><div class="sheet-scroll">
  <label class="field"><span class="field-label">\u0427\u0442\u043E \u043D\u0443\u0436\u043D\u043E \u0441\u0434\u0435\u043B\u0430\u0442\u044C</span><input name="title" value="${escapeHtml(state.taskDraft.title)}" maxlength="200" placeholder="\u041D\u0430\u043F\u0440\u0438\u043C\u0435\u0440, \u0432\u0437\u044F\u0442\u044C \u043D\u0430\u0441\u0442\u043E\u043B\u043A\u0443" required></label>
  <label class="field"><span class="field-label">\u041A\u043E\u043C\u0443 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0438\u0442\u044C</span><select name="recipient"><option value="any" ${state.taskDraft.recipient === "any" ? "selected" : ""}>\u0412\u0441\u0435\u043C \u2014 \u043A\u0442\u043E-\u043D\u0438\u0431\u0443\u0434\u044C \u0432\u043E\u0437\u044C\u043C\u0451\u0442</option>${people.filter(
    (item) => item.response === "\u041F\u0440\u0438\u0434\u0443" || item.response === "\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0442\u043E\u0440"
  ).map(
    (item) => `<option value="${item.id}" ${state.taskDraft.recipient === item.id ? "selected" : ""}>${item.name}${item.id === state.user ? " (\u0432\u044B)" : ""}</option>`
  ).join("")}</select></label>
  <p class="field-note">\u0423\u0447\u0430\u0441\u0442\u043D\u0438\u043A \u0441\u043C\u043E\u0436\u0435\u0442 \u043F\u0440\u0438\u043D\u044F\u0442\u044C \u0437\u0430\u0434\u0430\u0447\u0443 \u0438\u043B\u0438 \u043E\u0442\u043A\u0430\u0437\u0430\u0442\u044C\u0441\u044F.</p><p class="form-error" id="form-error" role="alert" hidden></p>
  </div><div class="sheet-actions"><button class="primary-button" type="submit">\u041F\u0440\u0435\u0434\u043B\u043E\u0436\u0438\u0442\u044C \u0437\u0430\u0434\u0430\u0447\u0443</button></div></form>`;

  // openspec/changes/meeting-experience-refresh/assets/revisions/2026-10-27-telegram-chat/src/pages/chat/lib/form-events.ts
  var installFormEvents = (context) => {
    const { state } = context;
    const sheet = find("#sheet");
    sheet.addEventListener("input", (event) => {
      const target = event.target;
      const name = target.name;
      if (state.sheet === "settings" && state.settingsDraft && ["title", "description", "time", "place"].includes(name)) {
        Object.assign(state.settingsDraft, { [name]: target.value });
      }
      if (state.sheet === "date") {
        Object.assign(state.dateDraft, {
          [name]: target.type === "checkbox" ? target.checked : target.value
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
          showError("\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0432\u0441\u0442\u0440\u0435\u0447\u0438");
          return;
        }
        state.meeting = { ...state.settingsDraft };
        state.systems.push("\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0432\u0441\u0442\u0440\u0435\u0447\u0438 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u044B \xB7 \u0421\u0430\u0448\u0430.");
        context.redrawInfo();
        context.redrawConversation();
        context.closeSheet();
        context.toast("\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u044B \u0432 \u043C\u0430\u043A\u0435\u0442\u0435");
      } else if (state.sheet === "date") {
        const uniqueDates = [...new Set(state.dateDraft.dates)];
        if (uniqueDates.length < 2 || uniqueDates.length !== state.dateDraft.dates.length) {
          showError("\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043C\u0438\u043D\u0438\u043C\u0443\u043C \u0434\u0432\u0435 \u0440\u0430\u0437\u043D\u044B\u0435 \u0434\u0430\u0442\u044B");
          return;
        }
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(state.dateDraft.endTime)) {
          showError("\u0423\u043A\u0430\u0436\u0438\u0442\u0435 \u0432\u0440\u0435\u043C\u044F \u043E\u043A\u043E\u043D\u0447\u0430\u043D\u0438\u044F \u0432 \u0444\u043E\u0440\u043C\u0430\u0442\u0435 \u0427\u0427:\u041C\u041C");
          return;
        }
        state.published.push({
          kind: "date",
          title: "\u041D\u043E\u0432\u0430\u044F \u0434\u0430\u0442\u0430 \u0432\u0441\u0442\u0440\u0435\u0447\u0438",
          detail: `${uniqueDates.sort().map((value) => dateLabel(value)).join(
            " \xB7 "
          )}. ${state.dateDraft.hidden ? "\u0418\u0442\u043E\u0433\u0438 \u0441\u043A\u0440\u044B\u0442\u044B \u0434\u043E \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0438\u044F." : "\u041E\u043F\u0440\u043E\u0441 \u043E\u0442\u043A\u0440\u044B\u0442."}`
        });
        context.closeSheet();
        context.redrawConversation(true);
        context.toast("\u041E\u043F\u0440\u043E\u0441 \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D \u0432 \u043C\u0430\u043A\u0435\u0442");
      } else if (state.sheet === "place" && !state.activePlacePoll && state.placeDraft.place.trim()) {
        state.published.push({
          kind: "place",
          title: state.placeDraft.place.trim(),
          detail: state.placeDraft.why.trim() || "\u041F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u043D\u043E\u0432\u043E\u0433\u043E \u043C\u0435\u0441\u0442\u0430. \u0422\u0435\u043A\u0443\u0449\u0435\u0435 \u043C\u0435\u0441\u0442\u043E \u043F\u043E\u043A\u0430 \u043F\u0440\u0435\u0436\u043D\u0435\u0435."
        });
        state.activePlacePoll = true;
        state.placeDraft = {
          place: "",
          why: "",
          endDate: "2026-10-30",
          endTime: "18:00"
        };
        context.closeSheet();
        context.redrawConversation(true);
        context.toast("\u041E\u043F\u0440\u043E\u0441 \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D \u0432 \u043C\u0430\u043A\u0435\u0442");
      } else if (state.sheet === "new-task" && state.taskDraft.title.trim()) {
        const recipient = state.taskDraft.recipient;
        state.published.push({
          kind: "task",
          title: state.taskDraft.title.trim(),
          detail: recipient === "any" ? "\u041F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u043E \u0432\u0441\u0435\u043C. \u0417\u0430\u0434\u0430\u0447\u0430 \u0435\u0449\u0451 \u043D\u0435 \u043F\u0440\u0438\u043D\u044F\u0442\u0430." : `\u041F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u043E: ${person(recipient).name}. \u0417\u0430\u0434\u0430\u0447\u0430 \u0435\u0449\u0451 \u043D\u0435 \u043F\u0440\u0438\u043D\u044F\u0442\u0430.`
        });
        state.taskDraft = { title: "", recipient: "any" };
        context.closeSheet();
        context.redrawConversation(true);
        context.toast("\u0417\u0430\u0434\u0430\u0447\u0430 \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u0430 \u0432 \u043C\u0430\u043A\u0435\u0442");
      }
    });
    const showError = (message) => {
      const error = find("#form-error");
      error.textContent = message;
      error.hidden = false;
      error.scrollIntoView({ block: "nearest" });
    };
  };
  var handleCalendar = (context, action, target) => {
    const { state } = context;
    if (action === "calendar") {
      const value = /* @__PURE__ */ new Date(`${target.dataset.value}T12:00:00`);
      state.calendar = {
        target: target.dataset.target ?? "",
        year: value.getFullYear(),
        month: value.getMonth()
      };
    } else if (action === "calendar-prev" || action === "calendar-next") {
      if (state.calendar) {
        const value = new Date(
          state.calendar.year,
          state.calendar.month + (action === "calendar-next" ? 1 : -1),
          1
        );
        state.calendar = {
          ...state.calendar,
          year: value.getFullYear(),
          month: value.getMonth()
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
      document.querySelector(`[data-target="${field}"]`)?.focus({ preventScroll: true });
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

  // openspec/changes/meeting-experience-refresh/assets/revisions/2026-10-27-telegram-chat/src/pages/chat/lib/reactions.ts
  var installReactions = (context) => {
    const { state } = context;
    const host = find("#reaction-host");
    const conversation = find("#conversation");
    let savedScroll = null;
    const position = () => {
      if (!state.reaction) {
        return;
      }
      const bubble = document.querySelector(
        `[data-bubble="${state.reaction.messageId}"]`
      );
      if (!bubble) {
        return;
      }
      const rect = bubble.getBoundingClientRect();
      const bounds = conversation.getBoundingClientRect();
      host.style.setProperty(
        "--reaction-space",
        `${Math.max(160, bounds.height - Math.min(rect.height, 80) - 24)}px`
      );
      const height = host.offsetHeight;
      const width = host.offsetWidth;
      const below = rect.bottom + 8;
      const above = rect.top - height - 8;
      const desiredTop = above >= bounds.top + 4 ? above : below;
      host.style.left = `${Math.max(bounds.left + 8, Math.min(rect.left, bounds.right - width - 8))}px`;
      host.style.top = `${Math.max(bounds.top + 4, Math.min(desiredTop, bounds.bottom - height - 8))}px`;
    };
    context.closeReaction = () => {
      state.reaction = null;
      host.hidden = true;
      document.querySelectorAll(".reaction-target").forEach((element) => element.classList.remove("reaction-target"));
      find(".conversation-end").style.height = "";
      if (savedScroll !== null) {
        conversation.scrollTop = savedScroll;
        savedScroll = null;
      }
    };
    context.showReaction = (messageId, expanded = false) => {
      context.rememberSelection();
      context.setEmoji(false);
      if (savedScroll === null) {
        savedScroll = conversation.scrollTop;
      }
      state.reaction = { messageId, expanded, category: "recent", query: "" };
      host.innerHTML = reactionPicker(state);
      host.hidden = false;
      document.querySelectorAll(".reaction-target").forEach((element) => element.classList.remove("reaction-target"));
      document.querySelector(`[data-bubble="${messageId}"]`)?.classList.add("reaction-target");
      if (expanded) {
        find(".conversation-end").style.height = `${conversation.clientHeight}px`;
        const bubble = document.querySelector(
          `[data-bubble="${messageId}"]`
        );
        if (bubble) {
          conversation.scrollTop += bubble.getBoundingClientRect().top - conversation.getBoundingClientRect().top - 8;
        }
      }
      position();
      host.querySelector("button")?.focus({ preventScroll: true });
    };
    window.addEventListener("resize", position);
    find("#conversation").addEventListener("scroll", position);
    let pressTimer;
    let startX = 0;
    let startY = 0;
    find("#message-list").addEventListener("pointerdown", (event) => {
      const target = event.target.closest(
        "[data-bubble]"
      );
      if (!target || event.pointerType === "mouse") {
        return;
      }
      startX = event.clientX;
      startY = event.clientY;
      pressTimer = window.setTimeout(
        () => context.showReaction(target.dataset.bubble ?? "m3"),
        450
      );
    });
    document.addEventListener("pointermove", (event) => {
      if (Math.abs(event.clientX - startX) + Math.abs(event.clientY - startY) > 12) {
        clearTimeout(pressTimer);
      }
    });
    for (const name of ["pointerup", "pointercancel"]) {
      document.addEventListener(name, () => clearTimeout(pressTimer));
    }
  };
  var toggleReaction = (context, messageId, emoji) => {
    const { state } = context;
    const message = state.messages.find((item) => item.id === messageId);
    if (!message) {
      return;
    }
    const users = message.reactions[emoji] ?? [];
    const removing = users.includes(state.user);
    message.reactions[emoji] = removing ? users.filter((id) => id !== state.user) : [...users, state.user];
    state.recent = [
      emoji,
      ...state.recent.filter((value) => value !== emoji)
    ].slice(0, 24);
    context.closeReaction();
    context.redrawConversation();
    context.announce(
      removing ? `\u0420\u0435\u0430\u043A\u0446\u0438\u044F ${emoji} \u0441\u043D\u044F\u0442\u0430` : `\u0420\u0435\u0430\u043A\u0446\u0438\u044F ${emoji} \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u0430`
    );
    document.querySelector(
      `[data-action="reaction-open"][data-message-id="${messageId}"]`
    )?.focus({ preventScroll: true });
  };
  var setReactorFilter = (context, filter) => {
    context.state.reactorFilter = filter;
    context.redrawSheet();
    document.querySelector(
      `#sheet [data-action="reactor-filter"][data-filter="${filter}"]`
    )?.focus({ preventScroll: true });
  };

  // openspec/changes/meeting-experience-refresh/assets/revisions/2026-10-27-telegram-chat/src/pages/chat/lib/task-actions.ts
  var handleTaskAction = (context, action) => {
    const { state } = context;
    const task = state.task;
    if (action === "task-accept" && task.status === "proposed" && (task.recipient === "any" || task.recipient === state.user)) {
      task.status = "accepted";
      task.assignee = state.user;
      state.systems.push(
        `\u0417\u0430\u0434\u0430\u0447\u0443 \xAB${task.title}\xBB \u0442\u0435\u043F\u0435\u0440\u044C \u0438\u0441\u043F\u043E\u043B\u043D\u044F\u0435\u0442 ${person(state.user).name}.`
      );
    } else if (action === "task-complete" && task.status === "accepted" && task.assignee === state.user) {
      task.status = "done";
      state.systems.push(
        `\u0417\u0430\u0434\u0430\u0447\u0430 \xAB${task.title}\xBB \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0430 \xB7 ${person(state.user).name}.`
      );
    } else if (action === "task-decline" || action === "task-cancel") {
      state.pendingTaskAction = action === "task-cancel" ? "cancel" : "decline";
      state.sheet = "confirm-task";
      context.redrawSheet();
      return true;
    } else if (action === "confirm-task") {
      task.status = state.pendingTaskAction === "cancel" ? "cancelled" : "declined";
      task.assignee = null;
      state.systems.push(
        `\u0417\u0430\u0434\u0430\u0447\u0430 \xAB${task.title}\xBB: ${state.pendingTaskAction === "cancel" ? "\u043E\u0442\u043C\u0435\u043D\u0430" : "\u043E\u0442\u043A\u0430\u0437"} \xB7 ${person(state.user).name}.`
      );
      state.sheet = "task";
    } else if (action === "return-task") {
      state.sheet = "task";
      context.redrawSheet();
      return true;
    } else {
      return false;
    }
    context.redrawConversation();
    if (state.sheet) {
      context.redrawSheet();
    }
    context.announce("\u0421\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435 \u0437\u0430\u0434\u0430\u0447\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u043E \u0432 \u043C\u0430\u043A\u0435\u0442\u0435");
    return true;
  };

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
      const own = message.author === state.user;
      const reactions = Object.entries(message.reactions).filter(
        ([, users]) => users.length > 0
      );
      return `<article class="message ${own ? "own" : ""}" data-message="${message.id}" aria-label="${author.name}, ${message.time}">
      <span class="avatar ${author.color}" aria-hidden="true">${author.initial}</span>
      <div class="message-main">
        <div class="message-meta"><span>${own ? "\u0412\u044B" : author.name}</span><time>${message.time}</time></div>
        <div class="bubble" data-bubble="${message.id}"><p>${escapeHtml(message.text)}</p></div>
        <div class="message-bottom">
          <div class="reaction-chips">${reactions.map(([emoji, users]) => `<button type="button" class="reaction-chip ${users.includes(state.user) ? "is-own" : ""}" data-action="toggle-reaction" data-message-id="${message.id}" data-emoji="${emoji}" aria-pressed="${users.includes(state.user)}" aria-label="${emoji}, ${users.length}. ${users.includes(state.user) ? "\u0421\u043D\u044F\u0442\u044C \u0441\u0432\u043E\u044E \u0440\u0435\u0430\u043A\u0446\u0438\u044E" : "\u041F\u043E\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u0440\u0435\u0430\u043A\u0446\u0438\u044E"}">${emoji}<span>${users.length}</span>${users.includes(state.user) ? '<span class="reaction-check" aria-hidden="true">\u2713</span>' : ""}</button>`).join("")}</div>
          <button type="button" class="reaction-open" data-action="reaction-open" data-message-id="${message.id}" aria-label="\u0420\u0435\u0430\u043A\u0446\u0438\u0438 \u043D\u0430 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435: ${escapeHtml(message.text)}">${icon("smile")}</button>
          ${reactions.length ? `<button type="button" class="reactors-open" data-action="reactors" data-message-id="${message.id}" aria-label="\u041A\u0442\u043E \u043F\u043E\u0441\u0442\u0430\u0432\u0438\u043B \u0440\u0435\u0430\u043A\u0446\u0438\u0438 \u043D\u0430 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 ${author.name}">${icon("people")}</button>` : ""}
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

  // openspec/changes/meeting-experience-refresh/assets/revisions/2026-10-27-telegram-chat/src/pages/chat/ui/sheet-content.ts
  var infoContent = (state) => {
    const current = people.filter(
      (item) => item.response === "\u041F\u0440\u0438\u0434\u0443" || item.response === "\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0442\u043E\u0440"
    );
    return `<div class="info-content">
  <div class="fact-row">${icon("calendar")}<div><strong>${dateLabel(state.meeting.date, true)}${state.meeting.time ? ` \xB7 ${state.meeting.time}` : ""}</strong><span>${state.meeting.time ? "\u041C\u043E\u0441\u043A\u0432\u0430 \xB7 UTC+3" : "\u0412\u0440\u0435\u043C\u044F \u043F\u043E\u043A\u0430 \u043D\u0435 \u0432\u044B\u0431\u0440\u0430\u043D\u043E"}</span></div></div>
  <div class="fact-row">${icon("pin")}<div><strong>${escapeHtml(state.meeting.place || "\u041C\u0435\u0441\u0442\u043E \u043F\u043E\u043A\u0430 \u043D\u0435 \u0432\u044B\u0431\u0440\u0430\u043D\u043E")}</strong></div></div>
  <p class="meeting-description">${escapeHtml(state.meeting.description)}</p>
  <section class="people-section"><div class="section-label">${state.peopleExpanded ? "\u0412\u0441\u0435 \u043E\u0442\u0432\u0435\u0442\u044B" : "\u041A\u043E\u043C\u043F\u0430\u043D\u0438\u044F"} <span>${state.peopleExpanded ? people.length : current.length}</span></div><button type="button" class="people-summary" data-action="toggle-people" aria-expanded="${state.peopleExpanded}">${current.slice(0, 3).map(
      (item) => `<span class="people-chip ${item.color}"><i>${item.initial}</i>${item.name}</span>`
    ).join(
      ""
    )}${current.length > 3 ? `<span class="people-more">+${current.length - 3}</span>` : ""}</button>
  ${state.peopleExpanded ? `<div class="people-list">${people.map((item) => `<div class="person-row"><span class="avatar ${item.color}">${item.initial}</span><div><strong>${item.name}${item.id === state.user ? " (\u0432\u044B)" : ""}</strong><span>${item.response}</span></div></div>`).join("")}<button type="button" class="text-button" data-action="toggle-people">\u0421\u0432\u0435\u0440\u043D\u0443\u0442\u044C \u0441\u043F\u0438\u0441\u043E\u043A ${icon("down")}</button></div>` : ""}</section>
  <div class="info-actions"><button type="button" class="list-action" data-action="info-share">${icon("share")}<span>\u041F\u0440\u0438\u0433\u043B\u0430\u0441\u0438\u0442\u044C \u0434\u0440\u0443\u0437\u0435\u0439</span>${icon("right")}</button>
    ${state.user === "sasha" ? `<button type="button" class="list-action" data-action="open-settings">${icon("settings")}<span>\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0432\u0441\u0442\u0440\u0435\u0447\u0438</span>${icon("right")}</button>` : `<button type="button" class="list-action" data-action="open-rsvp">${icon("check")}<span>\u0412\u0430\u0448 \u043E\u0442\u0432\u0435\u0442</span><span class="muted">\u041F\u0440\u0438\u0434\u0443</span>${icon("right")}</button>`}
  </div>
</div>`;
  };
  var taskContent = (state) => {
    const task = state.task;
    const actionable = task.status === "proposed" || task.status === "accepted";
    const canDecline = task.status === "proposed" && task.recipient === state.user || task.status === "accepted" && task.assignee === state.user;
    const canCancel = actionable && (task.author === state.user || state.user === "sasha");
    return `<div class="sheet-scroll task-details"><span class="task-state">${taskStatusLabel(state)}</span><dl class="task-facts"><div><dt>\u041F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u043E\u0442</dt><dd><span class="tiny-avatar ${person(task.author).color}">${person(task.author).initial}</span>${person(task.author).name}</dd></div><div><dt>${task.assignee ? "\u0418\u0441\u043F\u043E\u043B\u043D\u044F\u0435\u0442" : "\u041A\u043E\u043C\u0443"}</dt><dd>${task.assignee ? person(task.assignee).name : task.recipient === "any" ? "\u041B\u044E\u0431\u043E\u043C\u0443 \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0443" : `${person(task.recipient).name}${task.recipient === state.user ? " (\u0432\u044B)" : ""}`}</dd></div><div><dt>\u0421\u043E\u0437\u0434\u0430\u043D\u043E</dt><dd>\u0421\u0435\u0433\u043E\u0434\u043D\u044F, 12:37</dd></div></dl>
    ${task.status === "accepted" ? '<p class="field-note">\u041F\u043E\u0441\u043B\u0435 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u044F \u043E\u0442\u043C\u0435\u0442\u044C\u0442\u0435 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442 \u0437\u0434\u0435\u0441\u044C \u0438\u043B\u0438 \u0432 \u0447\u0430\u0442\u0435.</p>' : ""}
    <div class="task-detail-actions">${taskActions(state)}${canDecline ? '<button type="button" class="secondary-button" data-action="task-decline">\u041E\u0442\u043A\u0430\u0437\u0430\u0442\u044C\u0441\u044F \u043E\u0442 \u0437\u0430\u0434\u0430\u0447\u0438</button>' : ""}${canCancel ? '<button type="button" class="text-button danger" data-action="task-cancel">\u041E\u0442\u043C\u0435\u043D\u0438\u0442\u044C \u0437\u0430\u0434\u0430\u0447\u0443</button>' : ""}</div></div>`;
  };
  var reactorsContent = (state) => {
    const message = state.messages.find(
      (item) => item.id === state.reactorMessage
    );
    const reactions = Object.entries(message?.reactions ?? {}).filter(
      ([, users2]) => users2.length
    );
    const users = people.filter(
      (item) => reactions.some(
        ([emoji, ids]) => (state.reactorFilter === "all" || emoji === state.reactorFilter) && ids.includes(item.id)
      )
    );
    return `<div class="sheet-scroll"><div class="reactor-filters" role="group" aria-label="\u0424\u0438\u043B\u044C\u0442\u0440 \u0440\u0435\u0430\u043A\u0446\u0438\u0439"><button type="button" data-action="reactor-filter" data-filter="all" aria-pressed="${state.reactorFilter === "all"}" class="${state.reactorFilter === "all" ? "active" : ""}">\u0412\u0441\u0435</button>${reactions.map(([emoji, ids]) => `<button type="button" data-action="reactor-filter" data-filter="${emoji}" aria-pressed="${state.reactorFilter === emoji}" class="${state.reactorFilter === emoji ? "active" : ""}">${emoji} ${ids.length}</button>`).join("")}</div><div class="reactor-list">${users.map(
      (item) => `<div class="person-row"><span class="avatar ${item.color}">${item.initial}</span><div><strong>${item.name}${item.id === state.user ? " (\u0432\u044B)" : ""}</strong></div><span class="person-reactions">${reactions.filter(
        ([emoji, ids]) => ids.includes(item.id) && (state.reactorFilter === "all" || emoji === state.reactorFilter)
      ).map(([emoji]) => emoji).join(" ")}</span></div>`
    ).join("")}</div></div>`;
  };
  var sheetContent = (state) => {
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
        return `<div class="sheet-scroll share-content"><p>\u041E\u0442\u043F\u0440\u0430\u0432\u044C\u0442\u0435 \u0441\u0441\u044B\u043B\u043A\u0443 \u0442\u0435\u043C, \u043A\u043E\u0433\u043E \u0445\u043E\u0442\u0438\u0442\u0435 \u043F\u043E\u0437\u0432\u0430\u0442\u044C.</p><div class="share-preview"><div class="meeting-mark">${icon("calendar")}</div><div><strong>${escapeHtml(state.meeting.title)}</strong><span>${dateLabel(state.meeting.date)} \xB7 ${escapeHtml(state.meeting.place)}</span></div></div><label class="field"><span class="field-label">\u0421\u0441\u044B\u043B\u043A\u0430-\u043F\u0440\u0438\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u0435</span><input readonly value="https://somewhere.test/invite/demo" aria-label="\u0414\u0435\u043C\u043E\u043D\u0441\u0442\u0440\u0430\u0446\u0438\u043E\u043D\u043D\u0430\u044F \u0441\u0441\u044B\u043B\u043A\u0430-\u043F\u0440\u0438\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u0435"></label><button type="button" class="secondary-button" data-action="copy-link">${icon("copy")}\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0441\u0441\u044B\u043B\u043A\u0443</button></div>`;
      case "confirm-task":
        return `<div class="sheet-scroll"><p>${state.pendingTaskAction === "cancel" ? "\u0417\u0430\u0434\u0430\u0447\u0430 \u043E\u0441\u0442\u0430\u043D\u0435\u0442\u0441\u044F \u0432 \u0438\u0441\u0442\u043E\u0440\u0438\u0438 \u0441 \u043E\u0442\u043C\u0435\u0442\u043A\u043E\u0439 \u043E\u0431 \u043E\u0442\u043C\u0435\u043D\u0435. \u041D\u043E\u0432\u044B\u0439 \u0438\u0441\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0437\u043D\u0430\u0447\u0438\u0442\u0441\u044F." : "\u041E\u0442\u043A\u0430\u0437 \u043E\u0441\u0442\u0430\u043D\u0435\u0442\u0441\u044F \u0432 \u0438\u0441\u0442\u043E\u0440\u0438\u0438. \u041F\u0435\u0440\u0435\u0434\u0430\u0442\u044C \u0437\u0430\u0434\u0430\u0447\u0443 \u043C\u043E\u0436\u043D\u043E \u043D\u043E\u0432\u044B\u043C \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u0435\u043C."}</p><div class="confirmation-actions"><button type="button" class="secondary-button" data-action="confirm-task">${state.pendingTaskAction === "cancel" ? "\u041E\u0442\u043C\u0435\u043D\u0438\u0442\u044C \u0437\u0430\u0434\u0430\u0447\u0443" : "\u041E\u0442\u043A\u0430\u0437\u0430\u0442\u044C\u0441\u044F"}</button><button type="button" class="text-button" data-action="return-task">\u041E\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u043A\u0430\u043A \u0435\u0441\u0442\u044C</button></div></div>`;
      case "rsvp":
        return `<div class="sheet-scroll"><p>\u0421\u0435\u0439\u0447\u0430\u0441 \u0443 \u0432\u0430\u0441 \u043E\u0442\u0432\u0435\u0442 \xAB\u041F\u0440\u0438\u0434\u0443\xBB.</p><p class="field-note">\u041E\u0442\u0432\u0435\u0442 \xAB\u0412\u043E\u0437\u043C\u043E\u0436\u043D\u043E\xBB \u0438\u043B\u0438 \xAB\u041D\u0435 \u0441\u043C\u043E\u0433\u0443\xBB \u0437\u0430\u043A\u0440\u043E\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F \u043A \u043F\u0435\u0440\u0435\u043F\u0438\u0441\u043A\u0435. </p><button type="button" class="secondary-button" data-action="close-sheet">\u041E\u0441\u0442\u0430\u0432\u0438\u0442\u044C \xAB\u041F\u0440\u0438\u0434\u0443\xBB</button></div>`;
      case "attachment":
        return '<div class="sheet-scroll"><label class="field"><span class="field-label">\u0424\u0430\u0439\u043B \u0441 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430</span><input type="file" aria-label="\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0444\u0430\u0439\u043B \u0441 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430"></label></div>';
      default:
        return "";
    }
  };
  var renderSheet = (state) => {
    const titles = {
      info: state.meeting.title,
      share: "\u041F\u0440\u0438\u0433\u043B\u0430\u0441\u0438\u0442\u044C \u0434\u0440\u0443\u0437\u0435\u0439",
      settings: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0432\u0441\u0442\u0440\u0435\u0447\u0438",
      task: state.task.title,
      date: "\u041D\u043E\u0432\u0430\u044F \u0434\u0430\u0442\u0430 \u0432\u0441\u0442\u0440\u0435\u0447\u0438",
      place: "\u041F\u0440\u0435\u0434\u043B\u043E\u0436\u0438\u0442\u044C \u043C\u0435\u0441\u0442\u043E",
      "new-task": "\u041F\u0440\u0435\u0434\u043B\u043E\u0436\u0438\u0442\u044C \u0437\u0430\u0434\u0430\u0447\u0443",
      reactors: "\u041A\u0442\u043E \u043E\u0442\u0440\u0435\u0430\u0433\u0438\u0440\u043E\u0432\u0430\u043B",
      "confirm-task": state.pendingTaskAction === "cancel" ? "\u041E\u0442\u043C\u0435\u043D\u0438\u0442\u044C \u0437\u0430\u0434\u0430\u0447\u0443?" : "\u041E\u0442\u043A\u0430\u0437\u0430\u0442\u044C\u0441\u044F \u043E\u0442 \u0437\u0430\u0434\u0430\u0447\u0438?",
      rsvp: "\u0412\u0430\u0448 \u043E\u0442\u0432\u0435\u0442",
      attachment: "\u0412\u043B\u043E\u0436\u0435\u043D\u0438\u0435"
    };
    return `<div class="sheet-grab-area" id="sheet-grab-area"><div class="sheet-handle"></div><header class="sheet-header"><h1 id="sheet-title">${escapeHtml(titles[state.sheet ?? "info"])}</h1>${iconButton("close-sheet", state.sheetReturn ? "\u0417\u0430\u043A\u0440\u044B\u0442\u044C \u043F\u0430\u043D\u0435\u043B\u044C \u0438 \u0432\u0435\u0440\u043D\u0443\u0442\u044C\u0441\u044F \u043A \u0441\u0432\u0435\u0434\u0435\u043D\u0438\u044F\u043C" : "\u0417\u0430\u043A\u0440\u044B\u0442\u044C \u043F\u0430\u043D\u0435\u043B\u044C", "close")}</header></div>${sheetContent(state)}`;
  };

  // openspec/changes/meeting-experience-refresh/assets/revisions/2026-10-27-telegram-chat/src/pages/chat/lib/sheets.ts
  var installSheets = (context) => {
    const { state } = context;
    const overlay = find("#sheet-overlay");
    const sheet = find("#sheet");
    const chat = find("#chat-surface");
    context.redrawSheet = () => {
      const scroll = sheet.querySelector(".sheet-scroll")?.scrollTop ?? 0;
      sheet.innerHTML = renderSheet(state);
      const content = sheet.querySelector(".sheet-scroll");
      if (content) {
        content.scrollTop = scroll;
      }
    };
    const present = (name, returnTo = null) => {
      state.sheet = name;
      state.sheetReturn = returnTo;
      state.calendar = null;
      overlay.hidden = !name;
      chat.inert = Boolean(name);
      if (name) {
        context.redrawSheet();
        sheet.focus({ preventScroll: true });
      } else {
        const fallback = state.sheetOpener?.dataset.action;
        const opener = state.sheetOpener?.isConnected ? state.sheetOpener : document.querySelector(`[data-action="${fallback}"]`);
        (opener ?? find("#emoji-button")).focus({ preventScroll: true });
      }
    };
    context.openSheet = (name, returnTo = null) => {
      if (name === "settings" && state.user !== "sasha") {
        context.toast("\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0442\u043E\u0440\u0443");
        return;
      }
      context.rememberSelection();
      context.setEmoji(false);
      context.closeReaction();
      if (!state.sheet) {
        state.sheetOpener = document.activeElement;
      }
      if (name === "settings" && !state.settingsDraft) {
        state.settingsDraft = { ...state.meeting };
      }
      history.pushState({ prototypeSheet: name, returnTo }, "");
      present(name, returnTo);
    };
    context.closeSheet = () => {
      if (state.calendar) {
        state.calendar = null;
        context.redrawSheet();
        return;
      }
      if (history.state?.prototypeSheet) {
        history.back();
      } else {
        present(null);
      }
    };
    window.addEventListener("popstate", (event) => {
      present(event.state?.prototypeSheet ?? null, event.state?.returnTo ?? null);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (state.sheet) {
          context.closeSheet();
        } else if (state.reaction) {
          const id = state.reaction.messageId;
          context.closeReaction();
          document.querySelector(
            `[data-action="reaction-open"][data-message-id="${id}"]`
          )?.focus({ preventScroll: true });
        } else if (state.emojiOpen) {
          context.setEmoji(false);
          find("#emoji-button").focus({ preventScroll: true });
        } else if (state.menuOpen) {
          state.menuOpen = false;
          find("#add-menu").hidden = true;
          find("#add-button").setAttribute("aria-expanded", "false");
          find("#add-button").focus({ preventScroll: true });
        }
      }
      if (event.key === "Tab" && state.sheet) {
        const controls = Array.from(
          sheet.querySelectorAll(
            'button:not(:disabled), input:not(:disabled), textarea, select, [tabindex="0"]'
          )
        ).filter((element) => element.getClientRects().length);
        const first = controls[0];
        const last = controls.at(-1);
        if (event.shiftKey && (document.activeElement === first || document.activeElement === sheet)) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    });
    let dragStart = null;
    let dragDelta = 0;
    sheet.addEventListener("pointerdown", (event) => {
      if (!event.target.closest("#sheet-grab-area") || event.target.closest("button")) {
        return;
      }
      dragStart = event.clientY;
      sheet.setPointerCapture(event.pointerId);
    });
    sheet.addEventListener("pointermove", (event) => {
      if (dragStart === null) {
        return;
      }
      dragDelta = Math.max(0, event.clientY - dragStart);
      sheet.style.transform = `translateY(${dragDelta}px)`;
    });
    const endDrag = () => {
      if (dragStart === null) {
        return;
      }
      dragStart = null;
      sheet.style.transform = "";
      if (dragDelta > 90) {
        context.closeSheet();
      }
      dragDelta = 0;
    };
    sheet.addEventListener("pointerup", endDrag);
    sheet.addEventListener("pointercancel", endDrag);
  };
  var focusPeopleToggle = (expanded) => {
    const selector = expanded ? '#sheet .people-list [data-action="toggle-people"]' : "#sheet .people-summary";
    const button = document.querySelector(selector);
    const scroll = document.querySelector("#sheet .sheet-scroll");
    if (!button || !scroll) {
      return;
    }
    button.focus({ preventScroll: true });
    const buttonBounds = button.getBoundingClientRect();
    const scrollBounds = scroll.getBoundingClientRect();
    if (buttonBounds.bottom > scrollBounds.bottom) {
      scroll.scrollTop += buttonBounds.bottom - scrollBounds.bottom;
    } else if (buttonBounds.top < scrollBounds.top) {
      scroll.scrollTop += buttonBounds.top - scrollBounds.top;
    }
  };

  // openspec/changes/meeting-experience-refresh/assets/revisions/2026-10-27-telegram-chat/src/pages/chat/lib/actions.ts
  var installActions = (context) => {
    const { state } = context;
    const panelActions = {
      "open-info": "info",
      "open-share": "share",
      "open-task": "task",
      "open-date": "date",
      "open-place": "place",
      "open-new-task": "new-task",
      "open-rsvp": "rsvp",
      "open-photo": "attachment",
      "open-file": "attachment"
    };
    document.addEventListener("pointerdown", (event) => {
      const target = event.target;
      if (target.closest(
        "#emoji-button, #add-button, [data-action='insert-emoji'], [data-action='emoji-backspace']"
      )) {
        event.preventDefault();
      }
      if (state.reaction && !target.closest("#reaction-host, [data-action='reaction-open']")) {
        context.closeReaction();
      }
      if (state.menuOpen && !target.closest("#add-menu, #add-button")) {
        state.menuOpen = false;
        find("#add-menu").hidden = true;
        find("#add-button").setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("click", (event) => {
      const target = event.target.closest(
        "[data-action]"
      );
      const action = target?.dataset.action;
      if (!target || !action || target.hasAttribute("disabled")) {
        return;
      }
      if (panelActions[action]) {
        context.openSheet(panelActions[action]);
        return;
      }
      if (handleCalendar(context, action, target) || handleTaskAction(context, action)) {
        return;
      }
      switch (action) {
        case "toggle-emoji":
          context.setEmoji(!state.emojiOpen, state.emojiOpen);
          break;
        case "insert-emoji":
          insertEmoji(context, target.dataset.emoji ?? "");
          break;
        case "emoji-backspace":
          removePreviousGrapheme(context);
          break;
        case "emoji-category": {
          const reaction = target.dataset.mode === "reaction";
          if (reaction && state.reaction) {
            state.reaction.category = target.dataset.category ?? "recent";
            state.reaction.query = "";
            const picker = find(".reaction-picker");
            const contextNode = picker.querySelector(".reaction-context")?.outerHTML ?? "";
            picker.innerHTML = contextNode + emojiPicker(state, true);
          } else {
            state.emojiCategory = target.dataset.category ?? "recent";
            state.emojiQuery = "";
            find("#emoji-dock").innerHTML = emojiPicker(state);
          }
          document.querySelector(
            `[data-mode="${reaction ? "reaction" : "composer"}"][data-category="${target.dataset.category}"]`
          )?.focus({ preventScroll: true });
          break;
        }
        case "clear-emoji-search": {
          const mode = target.dataset.mode ?? "composer";
          const input = document.querySelector(
            `[data-emoji-search="${mode}"]`
          );
          input.value = "";
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.focus({ preventScroll: true });
          break;
        }
        case "toggle-menu": {
          const next = !state.menuOpen;
          context.setEmoji(false);
          context.closeReaction();
          state.menuOpen = next;
          find("#add-menu").hidden = !next;
          find("#add-button").setAttribute("aria-expanded", String(next));
          break;
        }
        case "reaction-open":
          context.showReaction(target.dataset.messageId ?? "m3");
          break;
        case "expand-reaction":
          context.showReaction(state.reaction?.messageId ?? "m3", true);
          break;
        case "close-reaction": {
          const messageId = state.reaction?.messageId;
          context.closeReaction();
          document.querySelector(
            `[data-action="reaction-open"][data-message-id="${messageId}"]`
          )?.focus({ preventScroll: true });
          break;
        }
        case "pick-reaction":
          toggleReaction(
            context,
            state.reaction?.messageId ?? "m3",
            target.dataset.emoji ?? "\u2764\uFE0F"
          );
          break;
        case "toggle-reaction":
          toggleReaction(
            context,
            target.dataset.messageId ?? "m3",
            target.dataset.emoji ?? "\u2764\uFE0F"
          );
          break;
        case "reactors":
          state.reactorMessage = target.dataset.messageId ?? "m3";
          state.reactorFilter = "all";
          context.openSheet("reactors");
          break;
        case "reactor-filter":
          setReactorFilter(context, target.dataset.filter ?? "all");
          break;
        case "close-sheet":
          context.closeSheet();
          break;
        case "info-share":
          context.openSheet("share", state.sheet === "info" ? "info" : null);
          break;
        case "open-settings":
          context.openSheet("settings", state.sheet === "info" ? "info" : null);
          break;
        case "toggle-people":
          state.peopleExpanded = !state.peopleExpanded;
          context.redrawInfo();
          if (state.sheet) {
            context.redrawSheet();
            focusPeopleToggle(state.peopleExpanded);
          }
          break;
        case "toggle-cover":
          if (state.settingsDraft) {
            state.settingsDraft.cover = !state.settingsDraft.cover;
            context.redrawSheet();
          }
          break;
        case "copy-link":
          void navigator.clipboard.writeText("https://somewhere.test/invite/demo").then(
            () => context.toast("\u0414\u0435\u043C\u043E\u043D\u0441\u0442\u0440\u0430\u0446\u0438\u043E\u043D\u043D\u0430\u044F \u0441\u0441\u044B\u043B\u043A\u0430 \u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u0430"),
            () => context.toast("\u0412\u044B\u0434\u0435\u043B\u0438\u0442\u0435 \u0441\u0441\u044B\u043B\u043A\u0443 \u0438 \u0441\u043A\u043E\u043F\u0438\u0440\u0443\u0439\u0442\u0435 \u0435\u0451")
          );
          break;
        case "vote-for":
          state.vote = "for";
          context.redrawConversation();
          context.announce("\u0413\u043E\u043B\u043E\u0441 \u0437\u0430 \u043C\u0435\u0441\u0442\u043E \u0443\u0447\u0442\u0451\u043D \u0432 \u043C\u0430\u043A\u0435\u0442\u0435");
          break;
        case "vote-against":
          state.vote = "against";
          context.redrawConversation();
          context.announce("\u0413\u043E\u043B\u043E\u0441 \u043F\u0440\u043E\u0442\u0438\u0432 \u0443\u0447\u0442\u0451\u043D \u0432 \u043C\u0430\u043A\u0435\u0442\u0435");
          break;
        case "add-date":
          state.dateDraft.dates.push("2026-11-08");
          context.redrawSheet();
          break;
        case "remove-date":
          if (state.dateDraft.dates.length > 2) {
            state.dateDraft.dates.splice(Number(target.dataset.index), 1);
            context.redrawSheet();
          }
          break;
      }
    });
    document.addEventListener("input", (event) => {
      const input = event.target;
      const mode = input.dataset.emojiSearch;
      if (!mode) {
        return;
      }
      if (mode === "reaction" && state.reaction) {
        state.reaction.query = input.value;
      } else {
        state.emojiQuery = input.value;
      }
      find(`[data-emoji-results="${mode}"]`).innerHTML = emojiResults(
        state,
        mode === "reaction"
      );
    });
    find("#add-menu").innerHTML = addMenu();
  };

  // openspec/changes/meeting-experience-refresh/assets/revisions/2026-10-27-telegram-chat/src/pages/chat/index.ts
  var startChat = () => {
    const state = createState();
    find("#app").innerHTML = renderShell(state);
    let toastTimer;
    const noop = () => {
    };
    const context = {
      state,
      redrawConversation: (bottom = false) => {
        const conversation = find("#conversation");
        const scroll = conversation.scrollTop;
        find("#message-list").innerHTML = renderMessages(state);
        conversation.scrollTop = bottom ? conversation.scrollHeight : scroll;
      },
      redrawInfo: () => {
        find("#meeting-name").textContent = state.meeting.title;
        find(".header-subtitle").textContent = `${dateLabel(state.meeting.date, true)} \xB7 4 \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0430`;
      },
      redrawSheet: noop,
      openSheet: noop,
      closeSheet: noop,
      setEmoji: noop,
      showReaction: noop,
      closeReaction: noop,
      updateDraft: noop,
      rememberSelection: noop,
      announce: (message) => {
        find("#announcement").textContent = message;
      },
      toast: (message) => {
        clearTimeout(toastTimer);
        find("#toast").textContent = message;
        find("#toast").hidden = false;
        toastTimer = window.setTimeout(() => {
          find("#toast").hidden = true;
        }, 2800);
      }
    };
    installComposer(context);
    installReactions(context);
    installSheets(context);
    installFormEvents(context);
    installActions(context);
    context.redrawInfo();
    const applyScenario = (scenario) => {
      state.sheet = null;
      state.sheetReturn = null;
      state.calendar = null;
      find("#sheet-overlay").hidden = true;
      find("#chat-surface").inert = false;
      history.replaceState(null, "");
      context.closeReaction();
      context.setEmoji(false);
      if (scenario === "emoji") {
        context.setEmoji(true);
      } else if (scenario === "quick" || scenario === "reactions") {
        document.querySelector('[data-message="m3"]')?.scrollIntoView({ block: "center" });
        context.showReaction("m3", scenario === "reactions");
      } else if ([
        "info",
        "share",
        "settings",
        "task",
        "date",
        "place",
        "new-task",
        "reactors"
      ].includes(scenario)) {
        context.openSheet(scenario);
      }
    };
    window.addEventListener("message", (event) => {
      if (event.source !== window.parent || event.origin !== location.origin) {
        return;
      }
      const data = event.data;
      if (data.kind === "scenario") {
        applyScenario(data.scenario ?? "chat");
      }
      if (data.kind === "role" && ["sasha", "lena", "tim"].includes(data.role ?? "")) {
        state.user = data.role;
        context.redrawConversation();
        context.redrawInfo();
        if (state.sheet) {
          context.redrawSheet();
        }
      }
      if (data.kind === "task") {
        state.task = {
          title: "\u0417\u0430\u043A\u0430\u0437\u0430\u0442\u044C \u043F\u0438\u0446\u0446\u0443",
          author: "lena",
          recipient: data.task === "other" ? "tim" : "sasha",
          assignee: data.task === "accepted" || data.task === "done" ? "sasha" : null,
          status: data.task === "accepted" ? "accepted" : data.task === "done" ? "done" : "proposed"
        };
        context.redrawConversation();
        if (state.sheet) {
          context.redrawSheet();
        }
      }
      if (data.kind === "place-poll") {
        state.activePlacePoll = Boolean(data.active);
        if (state.sheet === "place") {
          context.redrawSheet();
        }
      }
    });
    const updateViewport = () => {
      document.documentElement.style.setProperty(
        "--visible-height",
        `${window.visualViewport?.height ?? window.innerHeight}px`
      );
    };
    window.visualViewport?.addEventListener("resize", updateViewport);
    updateViewport();
    requestAnimationFrame(() => {
      find("#conversation").scrollTop = find("#conversation").scrollHeight;
      applyScenario(new URLSearchParams(location.search).get("view") ?? "chat");
    });
  };

  // openspec/changes/meeting-experience-refresh/assets/revisions/2026-10-27-telegram-chat/src/app/main.ts
  startChat();
})();

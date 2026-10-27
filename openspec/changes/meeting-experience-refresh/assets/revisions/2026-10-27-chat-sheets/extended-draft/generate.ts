import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

// Черновики из raw-источников. Код клиентов и actual screenshots не читаются.
const output = dirname(fileURLToPath(import.meta.url));
const revision = resolve(output, "..");
const raw = resolve(revision, "../..");
const root = resolve(revision, "../../../../../..");
const old = resolve(raw, "../../gathering-activity-feed/assets");
const sources = new Set<string>();
const read = (path: string) => {
  sources.add(path);

  return readFileSync(path, "utf8");
};
const element = (html: string, startText: string) => {
  const start = html.indexOf(startText);

  if (start < 0) {
    throw new Error(`Не найден исходный блок: ${startText}`);
  }

  const tag = /^<([a-z]+)/.exec(html.slice(start))?.[1];
  const pattern = new RegExp(`<(/?)${tag}\\b[^>]*>`, "g");
  pattern.lastIndex = start;
  let depth = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(html))) {
    depth += match[1] ? -1 : 1;

    if (!depth) {
      return html.slice(start, pattern.lastIndex);
    }
  }

  throw new Error(`Не закрыт исходный блок: ${startText}`);
};
const inside = (html: string) =>
  html.replace(/^<[^>]+>/, "").replace(/<\/[^>]+>$/, "");
const rawFile = (name: string) => read(resolve(raw, name));
const button = (text: string, action: string, primary = false) =>
  `<button class="button ${primary ? "primary" : "subtle"}" type="button" ${action}>${text}</button>`;
const close =
  '<button class="icon-button revision-close" type="button" data-close aria-label="Закрыть"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" /></svg></button>';
const back =
  '<a class="inline-link revision-back" data-close href="chat.html"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7" /></svg>Назад</a>';

const fullDate = read(resolve(old, "date-poll-v1/create.html"));
const removeDate =
  '<button class="icon-button extended-remove-date" type="button" data-remove-date aria-label="Удалить вариант"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" /></svg></button>';
let dateBody = element(fullDate, '<div class="sheet-content">')
  .replace(
    '<div class="sheet-content">',
    '<div class="sheet-content extended-date-body">',
  )
  .replace(/<p class="hint">[\s\S]*?<\/p>/, "")
  .replace('href="create.html"', 'href="#" data-add-date')
  .replace("Опрос завершится", "Окончание опроса")
  .replace(
    /<input aria-label="Вариант (\d)" value="[^"]+"\s*\/>/g,
    (_match, n: string) =>
      `<input aria-label="Вариант ${n}" type="date" value="${["2026-10-31", "2026-11-01", "2026-11-02"][Number(n) - 1]}" data-date-option />${removeDate}`,
  )
  .replace(
    '<div class="date-field">',
    '<div class="date-field" data-date-row>',
  );
dateBody = dateBody.replace(
  /<div class="date-field">/g,
  '<div class="date-field" data-date-row>',
);
dateBody = dateBody.replace(
  /<div class="deadline">[\s\S]*<\/div>\s*<\/div>$/,
  '<div class="deadline"><label class="field">Дата<input type="date" value="2026-10-30" aria-label="Дата окончания" /></label><label class="field">Время<input type="time" value="18:00" aria-label="Время окончания" /></label></div></div>',
);
const dateFooter = element(fullDate, '<footer class="sheet-footer">')
  .replace('href="open.html"', 'href="chat.html" data-submit-date')
  .replace(
    '<footer class="sheet-footer">',
    '<footer class="sheet-footer"><div class="notice error" data-date-send-error role="alert" hidden>Не удалось создать опрос. Попробуйте ещё раз.</div>',
  )
  .replace("Начать голосование", "Создать опрос");
const datePanel = `<section class="panel extended-date">${dateBody}${dateFooter}</section>`;

const filePanel = element(
  rawFile("upload-file.html"),
  '<section class="panel stack">',
)
  .replace("<textarea ", '<textarea maxlength="2000" ')
  .replace(
    '<p class="caption">Видно участникам встречи</p>',
    '<p class="caption">Видно участникам встречи</p>\n<div class="notice error" role="alert">Не удалось загрузить файл. Попробуйте ещё раз.</div>',
  )
  .replace('href="upload.html"', 'href="../upload.html"')
  .replace('href="chat-attachment.html"', 'href="chat.html"')
  .replace(">Отправить</a", ">Повторить</a");
read(resolve(raw, "upload-error.html"));

const createPanel = element(
  rawFile("create.html"),
  '<div class="panel stack">',
);
read(resolve(old, "flow-create.html"));
const settingsFields = inside(createPanel)
  .replace('value="Ужин в пятницу"', 'value="Настолки у Саши"')
  .replace('value="2026-10-30"', 'value="2026-10-31"')
  .replace('value="20:00"', 'value="19:00"')
  .replace('value="Кафе «Соседи»"', 'value="У Саши дома"')
  .replace(/<div class="row spread">[\s\S]*?<\/div>/, "")
  .replace(
    "></textarea>",
    ">Собираемся поиграть в настольные игры.</textarea>",
  );
const cover = `<div class="stack"><h3>Обложка</h3><div class="upload-grid"><div><img src="../../../boardgame.png" alt="Обложка встречи: настольная игра" /><button class="inline-link extended-link" type="button" data-remove-cover>Убрать фото</button></div></div>${button("Выбрать другое фото", "data-cover-choice")}</div>`;
const settingsPanel = `<section class="panel stack" data-settings-form>${settingsFields}${cover}<div class="row spread">${button("Отмена", "data-close")}${button("Сохранить", "data-close", true)}</div></section>`;

const taskOffered = read(resolve(old, "new-task.html"));
const taskAccepted = read(resolve(old, "task-accepted-open.html"));
const taskTitle = element(taskOffered, '<div class="task-title">');
const taskTaken = element(taskAccepted, '<div class="taken">');
const states = [
  {
    id: "task-offered",
    status: "Предложена Тимофею",
    actions: `${button("Принять задачу", 'data-task-next="task-accepted"', true)}${button("Отказаться", 'data-task-next="task-declined"')}`,
    viewer: "Тимофей · адресат",
  },
  {
    id: "task-accepted",
    status: "Принял Тимофей",
    actions: `${button("Отметить выполненной", 'data-task-next="task-completed"', true)}${button("Отказаться", 'data-task-next="task-declined"')}`,
    viewer: "Тимофей · исполнитель",
  },
  {
    id: "task-organizer",
    status: "Принял Тимофей",
    actions: button("Отменить задачу", 'data-task-next="task-cancelled"'),
    viewer: "Саша · автор и организатор",
  },
  {
    id: "task-declined",
    status: "Тимофей отказался",
    actions: "",
    viewer: "Тимофей · участник",
  },
  {
    id: "task-completed",
    status: "Выполнил Тимофей",
    actions: "",
    viewer: "Тимофей · участник",
  },
  {
    id: "task-cancelled",
    status: "Саша отменил задачу",
    actions: "",
    viewer: "Саша · автор и организатор",
  },
];
const taskPanel = (state: (typeof states)[number]) =>
  `<section class="panel stack extended-task">${taskTitle}<p class="caption">Предложил Саша · Для Тимофея</p><p class="extended-task-status">${state.status}</p>${state.actions ? `<div class="stack">${state.actions}</div>` : ""}</section>`;
// Чтение raw accepted фиксирует происхождение состояния; новая композиция имеет DRAFT.
void taskTaken;

read(resolve(revision, "meeting-participants-organizer.html"));
read(resolve(raw, "chat-reactions.html"));
const reactionsPanel = `<section class="panel stack"><ul class="participants-list stack" aria-label="Поставили реакцию 👍"><li class="row"><span class="avatar" aria-hidden="true">С</span><span class="grow">Саша</span></li><li class="row"><span class="avatar lilac" aria-hidden="true">Л</span><span class="grow">Лена</span></li><li class="row"><span class="avatar mint" aria-hidden="true">М</span><span class="grow">Миша</span></li></ul></section>`;

const definitions = [
  {
    id: "date-full",
    title: "Предложить дату",
    panel: datePanel,
    status: "Композиция raw + принятые требования multi-date; требует рендера",
  },
  {
    id: "file-error",
    title: "Отправить файл",
    panel: filePanel,
    status: "Композиция принятых preview и error/retry",
  },
  {
    id: "settings",
    title: "Настройки встречи",
    panel: settingsPanel,
    status: "DRAFT: новое тело из принятых полей/предпросмотра",
  },
  ...states.map((state) => ({
    id: state.id,
    title: "Задача",
    panel: taskPanel(state),
    status: `DRAFT: новая композиция; ${state.viewer}`,
  })),
  {
    id: "reaction-people",
    title: "Реакция 👍",
    panel: reactionsPanel,
    status: "DRAFT: новый список из принятых строк состава",
  },
];
const panels = definitions
  .map(
    ({ id, title, panel }) =>
      `<section class="main narrow" data-view="${id}" data-file="${id}.html" hidden>${back}<header class="heading"><h1 id="title-${id}">${title}</h1>${close}</header>${panel}</section>`,
  )
  .join("\n");

let chat = read(resolve(revision, "chat.html")).match(
  /<body[^>]*>([\s\S]*?)<\/body>/,
)?.[1];

if (!chat) {
  throw new Error("Не найден опубликованный chat shell");
}

chat = chat
  .replace(
    /<dialog class="revision-sheet">[\s\S]*?<\/dialog>/,
    "__EXTENDED_PANELS__",
  )
  .replace(/src="\.\.\/\.\.\//g, 'src="../../../')
  .replace(/href="([^"]+)"/g, (_match, href: string) => {
    if (href === "chat.html" || href === "chat-menu.html")
      return `href="${href}"`;
    if (href === "action-date.html") return 'href="date-full.html"';
    if (href === "upload-file.html") return 'href="file-error.html"';
    if (/^(?:#|https?:|data:)/.test(href)) return `href="${href}"`;

    return `href="../${href}"`;
  })
  .replace(
    "__EXTENDED_PANELS__",
    `<dialog class="revision-sheet">${panels}</dialog>`,
  );

const document = (initial: string, title: string) =>
  `<!doctype html>
<!-- DRAFT. Генерируется generate.ts; не опубликовано и не является приёмкой приложения. -->
<html lang="ru"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
<title>${title} · somewhere · черновик дополнения</title><link rel="stylesheet" href="extended.css" /><script type="module" src="extended.js"></script></head>
<body class="chat" data-initial="${initial}">${chat}</body></html>\n`.replace(
    /^[ \t]+$/gm,
    "",
  );
for (const item of definitions) {
  writeFileSync(
    resolve(output, `${item.id}.html`),
    document(item.id, item.title),
  );
}
writeFileSync(resolve(output, "chat.html"), document("", "Чат встречи"));
writeFileSync(resolve(output, "chat-menu.html"), document("menu", "Меню"));
writeFileSync(
  resolve(output, "index.html"),
  `<!doctype html><html lang="ru"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>Черновики дополнения · somewhere</title><link rel="stylesheet" href="extended.css" /></head><body><main class="main narrow revision-catalog"><h1>Отклонённые черновики</h1><p>REJECTED · 27.10.2026. Пользователь отклонил эти композиции как неудобные. Новый ориентир — Telegram, особенно emoji. Эти материалы сохранены для истории, не для публикации. Прежние рендеры и ограничения — в inspection.md; последняя правка whitespace не переснималась.</p><ul>${definitions.map((d) => `<li><a href="${d.id}.html">${d.title} · ${d.id}</a><p class="caption">${d.status}</p></li>`).join("")}</ul><a class="inline-link" href="../index.html">Опубликованная ревизия</a></main></body></html>\n`,
);

const navigation = read(resolve(revision, "revision.ts"));
const behaviors = readFileSync(resolve(output, "extended.ts"), "utf8");
writeFileSync(
  resolve(output, "extended.js"),
  "// Generated from revision.ts and extended.ts by generate.ts.\n" +
    ts.transpile(
      `const extendedInitialSearch = location.search;\n${navigation}\n${behaviors}`,
      { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
    ),
);

const oldCss = read(resolve(old, "date-poll-v1/date-poll.css"));
read(resolve(old, "feed.css"));
const formCss = oldCss.slice(
  oldCss.indexOf(".sheet-content {"),
  oldCss.indexOf(".sheet-handle {"),
);
const scopedCss = formCss.replace(
  /(^|\n)([^@{}\n][^{}]*?)\s*\{/g,
  (_match, newline: string, selector: string) =>
    `${newline}${selector
      .split(",")
      .map((s) => `.extended-date ${s.trim()}`)
      .join(", ")} {`,
);
writeFileSync(
  resolve(output, "date-source.css"),
  `/* Производная утверждённого date-poll-v1/date-poll.css; только область формы. */\n${scopedCss}`,
);
read(resolve(raw, "styles.css"));
read(resolve(revision, "revision.css"));
read(resolve(revision, "revision-tokens.css"));
read(resolve(revision, "participants.css"));
read(resolve(root, "docs/design/content.md"));
read(resolve(root, "docs/design/components/chat-actions.md"));
read(resolve(root, "openspec/changes/gathering-activity-feed/ux.md"));
read(resolve(output, "generate.ts"));
read(resolve(output, "extended.ts"));
read(resolve(output, "extended.css"));
for (const name of ["boardgame.png", "dinner.png", "brand.svg"])
  sources.add(resolve(raw, name));
for (const path of [
  "openspec/changes/gathering-activity-feed/specs/event-feed/spec.md",
  "openspec/changes/gathering-activity-feed/specs/meeting-creation/spec.md",
  "openspec/changes/gathering-activity-feed/specs/preparation-tasks/spec.md",
  "openspec/changes/meeting-experience-refresh/specs/chat-composition/spec.md",
  "openspec/changes/meeting-experience-refresh/specs/chat-reactions/spec.md",
  "openspec/changes/meeting-experience-refresh/specs/meeting-media/spec.md",
])
  read(resolve(root, path));
const sha = (bytes: Buffer | string) =>
  createHash("sha256").update(bytes).digest("hex");
writeFileSync(
  resolve(output, "provenance.json"),
  JSON.stringify(
    {
      schemaVersion: 1,
      status: "rejected-2026-10-27",
      generatedAt: new Date().toISOString(),
      sourcePolicy:
        "Только raw-макеты, опубликованная shell и требования. Клиенты и actual screenshots не читались.",
      conflicts: [
        {
          subject: "date heading",
          earlier: "gathering-activity-feed/ux.md от23.10: Новая дата встречи",
          later:
            "meeting-experience-refresh/assets/action-date.html и ревизия27.10: Предложить дату",
          choice:
            "Сохранён более новый заголовок Предложить дату; старое уточнение не отменяет принятые бизнес-поля и доступность CTA.",
        },
      ],
      sources: [...sources].sort().map((path) => ({
        path: relative(root, path),
        sha256: sha(readFileSync(path)),
      })),
      variants: definitions.map(({ id, title, status }) => ({
        file: `${id}.html`,
        title,
        status,
      })),
    },
    null,
    2,
  ) + "\n",
);

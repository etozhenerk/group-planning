import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import ts from "typescript";

const output = dirname(fileURLToPath(import.meta.url));
const raw = resolve(output, "../..");
const root = resolve(output, "../../../../../..");
const sourceFiles = new Set<string>();
const read = (path: string) => {
  sourceFiles.add(path);

  return readFileSync(path, "utf8");
};
const readRaw = (name: string) => read(resolve(raw, name));
const definitions = [
  { id: "date", file: "action-date.html", title: "Предложить дату" },
  { id: "place", file: "action-place.html", title: "Предложить место" },
  { id: "task", file: "action-task.html", title: "Предложить задачу" },
  { id: "photo", file: "upload.html", title: "Отправить фото" },
  { id: "photo-one", file: "upload-one.html", title: "Отправить фото" },
  { id: "file", file: "upload-file.html", title: "Отправить файл" },
  { id: "photo-retry", file: "upload-error.html", title: "Отправить фото" },
  { id: "share", file: "share.html", title: "Пригласить друзей" },
  { id: "copied", file: "share-copied.html", title: "Пригласить друзей" },
  { id: "info", file: "meeting-details.html", title: "Настолки у Саши" },
];
const routes = new Set([
  "chat.html",
  "chat-menu.html",
  ...definitions.map((item) => item.file),
]);
const returned = new Set([
  "action-result.html",
  "chat-attachment.html",
  "created-chat.html",
]);
const linkPaths = (html: string) =>
  html
    .replace(/src="(?!https?:|data:)([^"#]+)"/g, 'src="../../$1"')
    .replace(/href="([^"#]+)"/g, (_match: string, href: string) => {
      const file = href.split("?")[0] ?? href;

      if (returned.has(file)) {
        return 'href="chat.html"';
      }

      return `href="${routes.has(file) ? href : `../../${href}`}"`;
    });
const close =
  '<button class="icon-button revision-close" type="button" data-close aria-label="Закрыть"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" /></svg></button>';
const panels = definitions
  .map(({ id, file, title }) => {
    const source = readRaw(file);
    let main = source.match(
      /<main class="main narrow">([\s\S]*?)<\/main>/,
    )?.[1];

    if (!main) {
      throw new Error(`Не найдена исходная форма: ${file}`);
    }

    main = main
      .replace(/<footer class="site-footer">[\s\S]*?<\/footer>/g, "")
      .replace(/<(?:p|a) class="review-link"[\s\S]*?<\/(?:p|a)\s*>/g, "")
      .replace(
        /<a class="inline-link" href="report\.html\?screen=chat"[\s\S]*?<\/a\s*>/g,
        "",
      );
    const heading = /<header class="heading"><h1>[\s\S]*?<\/h1><\/header>/;

    if (heading.test(main)) {
      main = main.replace(
        heading,
        `<header class="heading"><h1 id="title-${id}">${title}</h1>${close}</header>`,
      );
    } else {
      main = `<header class="heading revision-mobile-title"><h1 id="title-${id}">${title}</h1>${close}</header>${main}`;
    }

    main = main.replace(
      /^(\s*)<a class="inline-link"([\s\S]*?)<\/a\s*>/,
      '$1<a class="inline-link revision-back" data-close$2</a>',
    );
    main = linkPaths(main);

    if (id === "photo-retry") {
      main = main.replace('href="../../album.html"', 'href="chat.html"');
    }

    return `<section class="main narrow" data-view="${id}" data-file="${file}" hidden>${main}</section>`;
  })
  .join("\n");

let chat = readRaw("chat-menu.html").match(
  /<body[^>]*>([\s\S]*?)<\/body>/,
)?.[1];

if (!chat) {
  throw new Error("Не найден исходный чат");
}

chat = chat
  .replace(/<a class="review-link"[\s\S]*?<\/a\s*>/g, "")
  .replace(
    '<div class="floating"',
    '<div class="floating" data-revision-menu hidden',
  )
  .replace(
    'href="chat.html" aria-label="Закрыть меню"',
    'href="chat-menu.html" aria-label="Добавить к встрече"',
  );
chat = linkPaths(chat);
const end = chat.lastIndexOf("</div>");
const workspaceEnd = chat.lastIndexOf("</div>", end - 1);
chat = `${chat.slice(0, workspaceEnd)}<dialog class="revision-sheet">${panels}</dialog>${chat.slice(workspaceEnd)}`;
const document = (initial: string, title: string) => `<!doctype html>
<!-- Генерируется generate.ts из перечисленных в provenance.json утверждённых источников. -->
<html lang="ru"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
<title>${title} · somewhere · ревизия 27.10.2026</title>
<link rel="stylesheet" href="revision.css" />
<script type="module" src="revision.js"></script></head>
<body class="chat" data-initial="${initial}">${chat}</body></html>\n`;

for (const item of definitions) {
  writeFileSync(resolve(output, item.file), document(item.id, item.title));
}

writeFileSync(resolve(output, "chat.html"), document("", "Чат встречи"));
writeFileSync(
  resolve(output, "chat-menu.html"),
  document("menu", "Меню действий"),
);
const interactive = readFileSync(resolve(output, "revision.ts"), "utf8");
writeFileSync(
  resolve(output, "revision.js"),
  "// Generated from revision.ts by generate.ts.\n" +
    ts.transpile(interactive, {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
    }),
);

const tokens = JSON.parse(
  read(resolve(root, "design-system/tokens.json")),
) as Record<string, unknown>;
const tokenAt = (path: string): { $value: unknown; $type: string } => {
  const token = path
    .split(".")
    .reduce<unknown>(
      (value, part) => (value as Record<string, unknown>)[part],
      tokens,
    ) as { $value: unknown; $type: string };

  if (typeof token.$value === "string" && token.$value.startsWith("{")) {
    return tokenAt(token.$value.slice(1, -1));
  }

  return token;
};
const roles = [
  "space.s12",
  "space.s20",
  "space.s24",
  "space.s48",
  "radius.sheet",
  "target.web",
  "typography.size.mobileActionHeading",
  "component.action.headingLineHeight",
  "component.action.headingTrackingMobile",
  "color.surface",
  "color.sheetBackdrop",
  "component.sheet.backdropBlur",
];
const declarations = roles.map((path) => {
  const token = tokenAt(path);
  let value: string;

  if (token.$type === "dimension") {
    const dimension = token.$value as { value: number; unit: string };
    value = `${dimension.value}${dimension.unit}`;
  } else if (token.$type === "color") {
    const color = token.$value as { components: number[]; alpha: number };
    const channels =
      color.alpha < 1 ? [...color.components, color.alpha] : color.components;
    value = `#${channels
      .map((channel) =>
        Math.round(channel * 255)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")}`;
  } else {
    value = String(token.$value);
  }

  return `  --revision-${path.replaceAll(".", "-")}: ${value};`;
});
writeFileSync(
  resolve(output, "revision-tokens.css"),
  `/* Snapshot из design-system/tokens.json; обновляется generate.ts. */\n:root {\n${declarations.join("\n")}\n}\n`,
);
for (const file of [
  "styles.css",
  "brand.svg",
  "boardgame.png",
  "dinner.png",
  "chat-emoji.html",
]) {
  sourceFiles.add(resolve(raw, file));
}
sourceFiles.add(
  resolve(
    root,
    "openspec/changes/gathering-activity-feed/assets/date-poll-v1/date-poll.css",
  ),
);
const sources = [...sourceFiles].sort().map((path) => ({
  path: relative(root, path),
  sha256: createHash("sha256").update(readFileSync(path)).digest("hex"),
}));
writeFileSync(
  resolve(output, "provenance.json"),
  JSON.stringify(
    {
      status: "unpublished-reference-revision",
      revision: "2026-10-27-chat-sheets",
      sources,
      roles,
      excluded: [
        "settings",
        "task-details",
        "reaction-people",
        "full-multi-date-form",
      ],
    },
    null,
    2,
  ) + "\n",
);

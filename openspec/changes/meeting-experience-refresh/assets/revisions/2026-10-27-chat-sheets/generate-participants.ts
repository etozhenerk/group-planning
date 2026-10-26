import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import ts from "typescript";

const output = dirname(fileURLToPath(import.meta.url));
const root = resolve(output, "../../../../../..");
const inputs = [
  "meeting-details.html",
  "revision.css",
  "revision.js",
  "revision-tokens.css",
  "participants.ts",
  "participants.css",
  "generate-participants.ts",
  "../../styles.css",
  "../../../../gathering-activity-feed/assets/meeting-info.html",
  "../../../../gathering-activity-feed/specs/event-feed/spec.md",
];
const base = readFileSync(resolve(output, "meeting-details.html"), "utf8");
const infoStart = base.indexOf('data-view="info"');
const prefix = base.slice(0, infoStart);
const info = base.slice(infoStart);
const people = info.match(/<div class="people">[\s\S]*?<\/div>/)?.[0];

if (!people) {
  throw new Error("Компактный исходный состав не найден");
}

const rows = [
  ["Саша", "С", "", "Организатор"],
  ["Лена", "Л", "lilac", "Приду"],
  ["Миша", "М", "mint", "Приду"],
  ["Аня", "А", "", "Приду"],
  ["Дима", "Д", "blue", "Приду"],
  ["Катя", "К", "lilac", "Приду"],
]
  .map(
    ([name, initial, tone, answer]) =>
      `<li class="row"><span class="avatar ${tone}" aria-hidden="true">${initial}</span><div class="grow">${name}<div class="caption">${answer}</div></div></li>`,
  )
  .join("\n");
const expanded = `<section class="stack" id="participants-full" data-participants-expanded>
  <button class="inline-link participants-collapse" type="button" data-participants-collapse>Скрыть состав</button>
  <ul class="stack participants-list" aria-label="Все участники встречи">${rows}</ul>
</section>`;
const toggle = people
  .replace(
    '<div class="people">',
    '<button type="button" class="people participants-toggle" aria-label="Все участники встречи" aria-expanded="true" aria-controls="participants-full" data-participants-toggle hidden>',
  )
  .replace(/<\/div>$/, "</button>");
const template = (
  prefix +
  info
    .replace(people, toggle + expanded)
    .replace(
      "<h3>Кто придёт</h3>",
      "<h3 data-participants-heading>Участники</h3>",
    )
)
  .replace(
    /(\s*<\/section>\s*<\/section>\s*<\/dialog>)/,
    "<!-- role-actions -->$1",
  )
  .replace(
    '<script type="module" src="revision.js"></script>',
    '<script type="module" src="revision.js"></script>\n<link rel="stylesheet" href="participants.css"/>\n<script type="module" src="participants.js"></script>',
  );

for (const [file, action] of [
  [
    "meeting-participants-organizer.html",
    '<button type="button" class="button subtle">Изменить настройки</button>',
  ],
  [
    "meeting-participants-member.html",
    '<section class="stack"><h3>Ваш ответ</h3><div class="row wrap"><button type="button" class="button primary" aria-pressed="true">Приду</button><button type="button" class="button subtle" aria-pressed="false">Возможно</button><button type="button" class="button subtle" aria-pressed="false">Не смогу</button></div></section>',
  ],
] as const) {
  let source = template
    .replace(/meeting-details\.html/g, file)
    .replace("<!-- role-actions -->", action);

  if (file.endsWith("member.html")) {
    source = source
      .replace(
        /<a\s+class="icon-button"\s+href="share.html"\s+aria-label="Пригласить друзей"[\s\S]*?<\/a\s*>/,
        "",
      )
      .replace(
        /<a class="button subtle" href="share.html"[\s\S]*?<\/a\s*>/,
        "",
      );
  }

  writeFileSync(resolve(output, file), source);
}

writeFileSync(
  resolve(output, "participants.js"),
  ts.transpileModule(readFileSync(resolve(output, "participants.ts"), "utf8"), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
    },
  }).outputText,
);
writeFileSync(
  resolve(output, "participants-provenance.json"),
  JSON.stringify(
    {
      status: "unpublished-participants-composition",
      sourceRule:
        "Исходная info-композиция + ранее принятый состав/RSVP, только raw-компоненты. App actual не является источником.",
      inputs: inputs.map((name) => {
        const path = resolve(output, name);

        return {
          path: relative(root, path),
          sha256: createHash("sha256").update(readFileSync(path)).digest("hex"),
        };
      }),
    },
    null,
    2,
  ) + "\n",
);

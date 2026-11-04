import { build } from "esbuild";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { z } from "zod";

const dir = dirname(fileURLToPath(import.meta.url));
const change = resolve(dir, "../..");
const root = resolve(change, "../../..");
const json = async (path: string): Promise<unknown> =>
  JSON.parse(await readFile(path, "utf8"));
const approvedSchema = z.object({
  references: z.array(
    z.object({
      id: z.string(),
      path: z.string(),
      sha256: z.string(),
      copySource: z.object({ path: z.string(), sha256: z.string() }).optional(),
    }),
  ),
});
const controlsSchema = z.array(
  z.object({
    id: z.string(),
    options: z.array(z.object({ html: z.string() })),
  }),
);
const hash = (data: string) => createHash("sha256").update(data).digest("hex");
const approved = approvedSchema.parse(
  await json(resolve(change, "approved-designs.json")),
);
const controls = controlsSchema.parse(
  await json(resolve(change, "preparation/preview-controls.json")),
);
const compiled = await build({
  entryPoints: [resolve(dir, "normalize.ts")],
  bundle: true,
  write: false,
  format: "iife",
  minify: true,
});
const normalization = compiled.outputFiles[0].text;
const css = await readFile(resolve(dir, "normalize.css"), "utf8");
const inventory = [];

for (const reference of approved.references) {
  if (reference.id === "back" || reference.id === "launch") {
    continue;
  }
  const inputReference =
    reference.id === "onboarding" && reference.copySource
      ? reference.copySource
      : reference;
  const source = resolve(root, inputReference.path);
  const target = resolve(change, "preparation/references", reference.id);
  await mkdir(target, { recursive: true });
  const input = await readFile(source, "utf8");
  if (hash(input) !== inputReference.sha256) {
    throw new Error(`Изменён одобренный вход: ${inputReference.path}`);
  }
  let renderedInput = input;
  if (reference.id === "onboarding") {
    const before = 't(Bo.length-1),r("error")';
    if (!input.includes(before)) {
      throw new Error(
        "Изменилась fixture входа: требуется пересмотреть генератор",
      );
    }
    renderedInput = input.replace(
      before,
      't(Bo.length-1),r(document.body.dataset.entryState??"error")',
    );
  }
  if (reference.id === "list") {
    // Только входные данные дополнительного состояния. Правило рендера нуля
    // уже содержится в одобренном UnreadIndicator; original snapshot не меняется.
    const before = ':e.state==="many-unread"?t.map((r,n)=>n===0?{...r,unreadCount:"127"}:r):t,o=';
    if (!renderedInput.includes(before)) {
      throw new Error("Изменилась fixture списка: требуется пересмотреть генератор");
    }
    renderedInput = renderedInput.replace(before,
      ':e.state==="unread-zero"?t.map((r,n)=>n===0?{...r,unreadCount:"0"}:r):e.state==="many-unread"?t.map((r,n)=>n===0?{...r,unreadCount:"127"}:r):t,o=');
  }
  const base = relative(target, dirname(source)) + "/";
  const states = controls.find(
    (item: { id: string }) => item.id === reference.id,
  )?.options[0]?.html;
  const allSelectors = states
    ? [...states.matchAll(/value="([^"]+)"/g)].map(
        (match: RegExpMatchArray) => match[1],
      )
    : [];
  const selectors = allSelectors.filter((state) => !state.startsWith("map"));
  const withoutMapBootstrap = ["create", "place"].includes(reference.id)
    ? `<script>{const q=new URLSearchParams(location.search);if(q.get("state")?.startsWith("map")){q.set("state","${reference.id === "create" ? "filled" : "form"}");history.replaceState(null,"","?"+q);}}</script>`
    : "";
  // Оригинальная сборка/данные сохранены. base обеспечивает разрешение её ресурсов.
  const html = renderedInput
    .replace("<head>", `<head><base href="${base}">`)
    .replace("</head>", `<style>${css}</style></head>`)
    .replace(
      "<body>",
      reference.id === "onboarding"
        ? '<body data-back-label="Предыдущий шаг">'
        : "<body>" + withoutMapBootstrap,
    )
    .replace("</body>", `<script>${normalization}</script></body>`);
  await writeFile(resolve(target, "frame.html"), html);
  inventory.push({
    id: reference.id,
    source: relative(root, source),
    sourceSha256: hash(input),
    normalized: relative(root, resolve(target, "frame.html")),
    normalizedSha256: hash(html),
    selectors,
    scope:
      "Изолированный web-render макета; native adaptation отдельно в packet. Не реализация и не client evidence.",
  });
}
await writeFile(
  resolve(change, "preparation/references.json"),
  JSON.stringify(inventory, null, 2) + "\n",
);
console.log(
  `Созданы ${inventory.length} производных референсов; исходные snapshots не изменены.`,
);

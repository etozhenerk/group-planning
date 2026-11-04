import {fileURLToPath} from "node:url";
import {dirname} from "node:path";
import * as esbuild from "/Users/misha/Documents/Codex/projects/group-planning/node_modules/esbuild/lib/main.js";
import { readFile, writeFile, mkdir, cp } from "node:fs/promises";
const root = "/Users/misha/Documents/Codex/projects/group-planning";
const project=dirname(fileURLToPath(import.meta.url));
const output=project;
const plugin = {
  name: "isolated-desktop-list",
  setup(build) {
    for (const name of ["CalendarGrid", "CalendarDay"])
      build.onLoad(
        { filter: new RegExp(name + "/" + name + "\\.module\\.css$") },
        async () => ({
          contents: await readFile(
            project + "/src/app/adapters/" + name + ".module.css",
            "utf8",
          ),
          loader: "local-css",
        }),
      );
    build.onLoad({ filter: /useCoverImage\.ts$/ }, () => ({
      contents:
        'export const useCoverImage=(url:string)=>({src:url.includes("boardgame")?"./boardgame.png":"./dinner.png",loading:false,error:null})',
      loader: "ts",
    }));
    build.onLoad(
      { filter: /shared\/ui\/Avatar\/Avatar\.tsx$/ },
      async (args) => ({
        contents:
          'import {UserRound} from "lucide-react";' +
          (await readFile(args.path, "utf8")).replace(
            "name.trim().slice(0, 1).toUpperCase() || '?'",
            "<UserRound size={18} strokeWidth={1.6}/>",
          ),
        loader: "tsx",
        resolveDir: args.path.slice(0, args.path.lastIndexOf("/")),
      }),
    );
  },
};
const bundle = await esbuild.build({
  metafile: true,
  bundle: true,
  minify: true,
  format: "esm",
  loader: { ".svg": "dataurl" },
  outdir: project + "/dist",
  jsx: "automatic",
  nodePaths: [root + "/node_modules"],
  alias: { "@": project + "/fixture-source/frontend/web/src", "@list": project + "/src" },
  define: { "process.env.NODE_ENV": '"production"' },
  entryPoints: [project + "/src/app/entry.tsx"],
  plugins: [plugin],
});
const css = await readFile(project + "/dist/entry.css", "utf8"),
  js = await readFile(project + "/dist/entry.js", "utf8");
await mkdir(output, { recursive: true });
await writeFile(
  output + "/preview.html",
  '<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>somewhere · Мои встречи · десктоп r2</title><style>html,body{margin:0}' +
    css +
    '</style></head><body><div id="root"></div><script type="module">' +
    js.replaceAll("</script", "<\\/script") +
    "</script></body></html>",
);
for (const file of ["avatars", "somewhere.svg"])
  await cp(
    project + "/assets/" + file,
    output + "/" + file,
    { recursive: true },
  );
for (const file of ["dinner.png", "boardgame.png"])
  await cp(project + "/assets/" + file, output + "/" + file);
console.log("Desktop list preview built");

const chatSource =
  "/Users/misha/.codex/visualizations/2026/11/03/01a1a1fe-931f-7a82-bd70-b347dcbb5ef1/desktop-design/chat-r2";
await mkdir(output + "/chat", { recursive: true });
for (const file of ["avatars", "dinner.png", "somewhere.svg"])
  await cp(chatSource + "/" + file, output + "/chat/" + file, {
    recursive: true,
  });
const returnBuild = await esbuild.build({
  entryPoints: [project + "/src/app/chatReturn.ts"],
  bundle: true,
  minify: true,
  format: "esm",
  write: false,
});
const chatHtml = await readFile(chatSource + "/preview.html", "utf8");
await writeFile(
  output + "/chat/preview.html",
  chatHtml.replace(
    "</body>",
    '<script type="module">' +
      returnBuild.outputFiles[0].text +
      "</script></body>",
  ),
);

await writeFile(
  project + "/metafile.json",
  JSON.stringify(bundle.metafile, null, 2),
);

import {resolve as resolveArtifactPath,dirname as parentArtifactPath} from "node:path";
import {fileURLToPath as artifactFilePath} from "node:url";
const artifactDirectory=parentArtifactPath(artifactFilePath(import.meta.url));
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import * as esbuild from "esbuild";
import { readFile, writeFile, mkdir, cp } from "node:fs/promises";
const root = resolveArtifactPath(artifactDirectory,"../../../..");
const project = dirname(fileURLToPath(import.meta.url));
const output = project;
const plugin = {
  name: "isolated-desktop-create",
  setup(build) {
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
  alias: {
    "@": project + "/fixture-source/frontend/web/src",
    "@create": project + "/src",
  },
  define: { "process.env.NODE_ENV": '"production"' },
  entryPoints: [project + "/src/app/entry.tsx"],
  plugins: [plugin],
});
const css = await readFile(project + "/dist/entry.css", "utf8"),
  js = await readFile(project + "/dist/entry.js", "utf8");
await mkdir(output, { recursive: true });
await writeFile(
  output + "/preview.html",
  '<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>somewhere · Создание встречи · десктоп r2</title><style>html,body{margin:0}' +
    css +
    '</style></head><body><div id="root"></div><script type="module">' +
    js.replaceAll("</script", "<\\/script") +
    "</script></body></html>",
);
for (const file of ["avatars", "somewhere.svg"])
  await cp(project + "/assets/" + file, output + "/" + file, {
    recursive: true,
  });
for (const file of ["dinner.png", "boardgame.png"])
  await cp(project + "/assets/" + file, output + "/" + file);
console.log("Desktop create preview built");

await writeFile(
  project + "/metafile.json",
  JSON.stringify(bundle.metafile, null, 2),
);
const live = "/private/tmp/somewhere-onboarding/desktop-create-r2";
await mkdir(live, { recursive: true });
for (const file of [
  "preview.html",
  "avatars",
  "somewhere.svg",
  "dinner.png",
  "boardgame.png",
])
  await cp(output + "/" + file, live + "/" + file, { recursive: true });

import {resolve as resolveArtifactPath,dirname as parentArtifactPath} from "node:path";
import {fileURLToPath as artifactFilePath} from "node:url";
const artifactDirectory=parentArtifactPath(artifactFilePath(import.meta.url));
import {dirname} from "node:path";
import {fileURLToPath} from "node:url";
import * as esbuild from "esbuild";
import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";

const root = resolveArtifactPath(artifactDirectory,"../../../..");
const dir=dirname(fileURLToPath(import.meta.url));
const out=dir;
const hooks = [
  "queries",
  "useDatePoll",
  "usePlacePoll",
  "usePreparationTask",
  "useCoverImage",
  "useMediaImage",
  "useChatSyncEnabled",
  "useTaskControls",
  "useRespond",
];
const adapters: esbuild.Plugin = {
  name: "desktop-calendar",
  setup: (build) => {
    for (const name of ["CalendarGrid", "CalendarDay"])
      build.onLoad(
        { filter: new RegExp(name + "/" + name + "\\.module\\.css$") },
        async () => ({
          contents: await readFile(
            dir + "/src/app/adapters/" + name + ".module.css",
            "utf8",
          ),
          loader: "local-css",
        }),
      );
  },
};
const fixture: esbuild.Plugin = {
  name: "isolated-fixture",
  setup: (build) => {
    build.onLoad({ filter: /frontend\/web\/src\/.*\.ts$/ }, (args) => {
      const name = args.path.split("/").pop()!.replace(".ts", "");
      if (!hooks.includes(name)) return;
      const names =
        name === "queries"
          ? [
              "useMeeting",
              "useMeetings",
              "useInvitation",
              "useInvitationOrganizer",
              "useParticipants",
            ]
          : [name];
      return {
        contents: `export {${names.join(",")}} from '${dir}/src/pages/entry/model/fixtureHooks.ts'`,
        loader: "ts",
      };
    });
    build.onLoad(
      { filter: /frontend\/web\/src\/shared\/ui\/Avatar\/Avatar.tsx$/ },
      async (args) => ({
        contents: 'import {UserRound} from "lucide-react";' + (await readFile(args.path, "utf8")).replace(
          "src = null",
          'src = ({Миша:"./avatars/misha.jpg",Лена:"./avatars/lena.jpg",Саша:"./avatars/sasha.jpg"} as Record<string,string>)[name] ?? null',
        ).replace("name.trim().slice(0, 1).toUpperCase() || '?'",'<UserRound size={18} strokeWidth={1.6}/>'),
        loader: "tsx",
        resolveDir: args.path.slice(0, args.path.lastIndexOf("/")),
      }),
    );
  },
};
await mkdir(out + "/avatars", { recursive: true });
const bundle = await esbuild.build({
  metafile: true,
  entryPoints: [dir + "/src/app/entry.tsx"],
  outdir: dir + "/dist",
  bundle: true,
  minify: true,
  format: "esm",
  jsx: "automatic",
  nodePaths: [root + "/node_modules"],
  alias: { "@": dir + "/fixture-source/frontend/web/src", "@prototype": dir + "/src", "@message":resolveArtifactPath(root,'docs/design/desktop-mvp/message-grouping-r1/src') },
  define: { "process.env.NODE_ENV": '"production"' },
  loader: { ".svg": "dataurl" },
  plugins: [adapters, fixture],
});
const css = await readFile(dir + "/dist/entry.css", "utf8");
const js = await readFile(dir + "/dist/entry.js", "utf8");
await writeFile(
  out + "/preview.html",
  `<!doctype html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>somewhere · знакомство на десктопе · r5</title><style>html{scroll-behavior:smooth;scroll-padding-top:32px}body{margin:0} @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}${css}</style></head><body><div id="root"></div><script type="module">${js.replaceAll("</script", "<\\/script")}</script></body></html>`,
);
for (const name of ["boardgame.png", "dinner.png"])
  await copyFile(
    dir + "/assets/" + name,
    out + "/" + name,
  );
await copyFile(
  dir + "/assets/somewhere.svg",
  out + "/somewhere.svg",
);
for (const name of ["misha", "lena", "sasha"])
  await copyFile(
    dir + "/assets/avatars/" + name + ".jpg",
    out + "/avatars/" + name + ".jpg",
  );
console.log("Built desktop preview: " + out + "/preview.html");

await writeFile(
  dir + "/metafile.json",
  JSON.stringify(bundle.metafile, null, 2),
);

await writeFile(
  out + "/somewhere-mark.svg",
  (await readFile(dir + "/assets/somewhere.svg", "utf8")).replace(
    /<rect width="1254" height="1254" fill="#24252A"\/>/,
    "",
  ),
);

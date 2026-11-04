import * as esbuild from 'esbuild';
import { readFile,writeFile,mkdir,cp } from 'node:fs/promises';
import { dirname,resolve,relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir=dirname(fileURLToPath(import.meta.url));
const change=resolve(dir,'../..');
const root=resolve(change,'../../..');
const source=resolve(dir,'source');
const alias={'@rsvp':source,'@':resolve(source,'fixture-source'),'@stage':resolve(root,'.agents/skills/stageshow/kit')};
const common={bundle:true,minify:true,format:'esm' as const,jsx:'automatic' as const,alias,define:{'process.env.NODE_ENV':'"production"'}};
const bridge=await esbuild.build({...common,entryPoints:[resolve(source,'mobile/adapter.ts')],write:false});
const js=bridge.outputFiles[0].text;
const inventory: Array<{id:string;normalized:string}>=JSON.parse(await readFile(resolve(change,'preparation/references.json'),'utf8'));
for(const id of ['invite','invitations','chat','list']){
  const record=inventory.find(item=>item.id===id);
  if(!record){throw new Error('Missing reference '+id);}
  const original=resolve(root,record.normalized);
  let html=await readFile(original,'utf8');
  const match=html.match(/<base href="([^"]+)"/);
  if(!match){throw new Error('Missing reference base '+id);}
  const resource=resolve(dirname(original),match[1]);
  const target=resolve(dir,'mobile',id,'frame.html');
  await mkdir(dirname(target),{recursive:true});
  html=html.replace(match[0],`<base href="${relative(dirname(target),resource)}/"`);
  html=html.replaceAll('../../../assets/info-r2/avatars/',relative(dirname(target),resolve(change,'assets/info-r2/avatars'))+'/');
  html=html.replace('</head>','<style>img[src*="somewhere.svg"]{border-radius:50%}</style></head>');
  html=html.replace('</body>',`<script type="module">${js.replaceAll('</script','<\\/script')}</script></body>`);
  await writeFile(target,html);
  const resources=relative(resolve(change,'assets'),resource);
  await cp(resource,resolve('/private/tmp/somewhere-onboarding',resources),{recursive:true});
}
await esbuild.build({...common,entryPoints:[resolve(source,'mobile/entry.tsx')],outdir:resolve(dir,'dist/mobile')});
const css=await readFile(resolve(dir,'dist/mobile/entry.css'),'utf8');
const declinedJs=await readFile(resolve(dir,'dist/mobile/entry.js'),'utf8');
await mkdir(resolve(dir,'mobile/declined'),{recursive:true});
await writeFile(resolve(dir,'mobile/declined/frame.html'),`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ответ на приглашение</title><style>${css}</style></head><body><div id="root"></div><script type="module">${declinedJs.replaceAll('</script','<\\/script')}</script></body></html>`);
await esbuild.build({...common,entryPoints:[resolve(source,'studyEntry.tsx')],outdir:resolve(dir,'dist/study')});
const studyCss=await readFile(resolve(dir,'dist/study/studyEntry.css'),'utf8');
const studyJs=await readFile(resolve(dir,'dist/study/studyEntry.js'),'utf8');
await writeFile(resolve(dir,'preview-mobile.html'),`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Приглашение · мобильный сценарий</title><style>html,body{margin:0;background:#ededeb}body{padding:20px;box-sizing:border-box}${studyCss}</style></head><body><div id="root"></div><script type="module">${studyJs.replaceAll('</script','<\\/script')}</script></body></html>`);
await cp(dir,'/private/tmp/somewhere-onboarding/rsvp-mobile-source',{recursive:true});
await mkdir('/private/tmp/somewhere-onboarding/response-mobile-r1',{recursive:true});
await cp(resolve(dir,'preview-mobile.html'),'/private/tmp/somewhere-onboarding/response-mobile-r1/preview.html');
await cp(resolve(change,'assets/info-r2/avatars'),'/private/tmp/somewhere-onboarding/info-r2/avatars',{recursive:true});
console.log('Mobile RSVP candidate generated; original accepted references preserved.');

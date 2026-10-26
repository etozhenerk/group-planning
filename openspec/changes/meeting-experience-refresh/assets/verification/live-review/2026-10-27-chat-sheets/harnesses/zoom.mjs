import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
const root=process.cwd();
const harnessHash=crypto.createHash('sha256').update(await fs.readFile(new URL(import.meta.url))).digest('hex');
const require=createRequire(path.join(root,'package.json'));
const {chromium}=require('playwright');
const {expect}=require('@playwright/test');
const assets=path.join(root,'openspec/changes/meeting-experience-refresh/assets');
const requestedOutput=process.env.REVIEW_OUTPUT;
if(!requestedOutput?.startsWith('2026-10-27-chat-sheets/')||requestedOutput.includes('..'))throw Error('REVIEW_OUTPUT must name a new directory within 2026-10-27-chat-sheets/');
const output=path.join(assets,'verification/live-review',requestedOutput);
await fs.mkdir(output,{recursive:true});
const sourceHash=process.env.REVIEW_SOURCE_HASH;
if(!/^[0-9a-f]{64}$/.test(sourceHash||''))throw Error('REVIEW_SOURCE_HASH required');
const publishedReferenceFiles=new Set(['chat-menu.html','action-date.html','action-place.html','action-task.html','upload.html','upload-one.html','upload-file.html','upload-error.html','share.html','share-copied.html','meeting-details.html']);
const referencePath=file=>publishedReferenceFiles.has(file)?'revisions/2026-10-27-chat-sheets/'+file:file;
const referencePolicy={revision:'2026-10-27-chat-sheets',gaps:['full multi-date composition','task details','settings','reaction people','file-specific upload error'],note:'Published simplified date reference verifies the shell only; raw creation and reaction-picker pages do not establish complete settings or reaction-people designs.'};
const origin='https://127.0.0.1:8444';
const fixtureFiles={};
for(const file of ['backend/internal/httpapi/browser_design_fixture_test.go','backend/internal/httpapi/native_design_fixture_test.go','backend/internal/httpapi/browser_fixture_test.go','contracts/fixtures/cases.json']) {
 try { fixtureFiles[file]=crypto.createHash('sha256').update(await fs.readFile(path.join(root,file))).digest('hex'); } catch {}
}
const fixtureHash=crypto.createHash('sha256').update(JSON.stringify(fixtureFiles)).digest('hex');
const profile=await fs.mkdtemp(path.join(os.tmpdir(),'somewhere-review-zoom-'));
const extension=path.join(path.dirname(new URL(import.meta.url).pathname),'zoom-extension');
const context=await chromium.launchPersistentContext(profile,{channel:'chromium',headless:true,baseURL:origin,ignoreHTTPSErrors:true,locale:'ru-RU',timezoneId:'Europe/Moscow',viewport:{width:390,height:844},colorScheme:'dark',ignoreDefaultArgs:['--disable-extensions'],args:['--disable-extensions-except='+extension,'--load-extension='+extension]});
const browser=context.browser();
const worker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker');
const browserZoom=async(target,factor)=>worker.evaluate(async({url,factor})=>{const tabs=await chrome.tabs.query({});const tab=tabs.find(tab=>tab.url===url);if(!tab||typeof tab.id!=='number')throw Error('Review tab not found');if(factor!==null)await chrome.tabs.setZoom(tab.id,factor);return await chrome.tabs.getZoom(tab.id);},{url:target.url(),factor:factor??null});
let configuredViewport={width:390,height:844};
const page=await context.newPage();
const reference=await context.newPage();
const journal=[];
const record=async(action,result)=>{journal.push({at:new Date().toISOString(),action,result});await fs.writeFile(path.join(output,'interactions.json'),JSON.stringify(journal,null,2)+'\n');};
await reference.route('**/__design/**',async route=>{
 const file=new URL(route.request().url()).pathname.split('/__design/')[1];
 if(!file||file.includes('..'))return route.abort();
 await route.fulfill({body:await fs.readFile(path.join(assets,file)),contentType:({'.css':'text/css','.js':'application/javascript','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)]||'text/html'});
});
const capture=async(target,name,kind='actual')=>{
 await target.evaluate(()=>document.fonts.ready);
 await target.waitForFunction(()=>Array.from(document.querySelectorAll('dialog[open][data-motion]')).every(el=>el.getAttribute('data-motion')==='open'));
 const state=await target.evaluate(()=>({url:location.pathname+location.search,viewport:{width:innerWidth,height:innerHeight},deviceScaleFactor:devicePixelRatio,locale:navigator.language,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,rootFont:getComputedStyle(document.documentElement).fontSize,bodyFont:getComputedStyle(document.body).fontFamily,overflow:document.documentElement.scrollWidth>innerWidth}));
 const cdp=await target.context().newCDPSession(target);
 await cdp.send('DOM.enable');await cdp.send('CSS.enable');
 const {root:dom}=await cdp.send('DOM.getDocument');
 let scopeNode=dom.nodeId;let fontScope='document';
 for(const selector of ['dialog[open] [data-view]:not([hidden])','dialog[open]','main']){
  const found=await cdp.send('DOM.querySelector',{nodeId:dom.nodeId,selector});
  if(found.nodeId){scopeNode=found.nodeId;fontScope=selector;break;}
 }
 const {nodeIds}=await cdp.send('DOM.querySelectorAll',{nodeId:scopeNode,selector:'h1,h2,p,label,input,textarea,button,a,span'});
 const fontMap=new Map();for(const nodeId of nodeIds.slice(0,70)){for(const font of (await cdp.send('CSS.getPlatformFontsForNode',{nodeId})).fonts){fontMap.set(font.postScriptName,font);}}const fonts=[...fontMap.values()];await cdp.detach();
 await target.screenshot({path:path.join(output,name+'.png'),fullPage:false,animations:'disabled'});
 const zoom=await browserZoom(target);const png=await fs.readFile(path.join(output,name+'.png'));const pixelBounds={width:png.readUInt32BE(16),height:png.readUInt32BE(20)};
 const meta={kind,sourceHash,fixtureHash,configuredViewport:{...configuredViewport},browserZoom:zoom,pixelBounds,textScale:zoom,scaleMode:'chrome.tabs.setZoom in a disposable isolated profile; actual layout viewport and DPR recorded separately',runtime:browser.version(),os:os.release(),fonts,fontScope,...state,capturedAt:new Date().toISOString()};
 await fs.writeFile(path.join(output,name+'.json'),JSON.stringify(meta,null,2)+'\n');
 await record('capture '+name,{kind,overflow:state.overflow,fonts:fonts.map(x=>x.familyName)});
 console.log(name+' captured');
};
const surface=title=>page.getByRole('main',{name:title,exact:true}).or(page.getByRole('dialog',{name:title,exact:true}));
const boot=async(c,p,user)=>{const started=await c.request.post(origin+'/api/v1/auth/yandex/start',{headers:{Origin:origin},data:{client_kind:'web',return_context:{kind:'home'}}});if(!started.ok())throw Error('fixture auth '+started.status());const {authorization_url}=await started.json();if(new URL(authorization_url).origin!==origin)throw Error('unexpected provider');await p.goto(authorization_url);await p.getByRole('link',{name:'Войти как '+user,exact:true}).click();await p.waitForURL(origin+'/meetings');};
const headers=async(p)=>{const me=await(await p.request.get(origin+'/api/v1/me')).json();return{Origin:origin,'X-CSRF-Token':me.csrf_token,'Idempotency-Key':crypto.randomUUID()};};
const create=async(title)=>{const r=await page.request.post(origin+'/api/v1/meetings',{headers:await headers(page),data:{title,starts_at:'2099-10-24T19:00:00+03:00',timezone:'Europe/Moscow'}});if(r.status()!==201)throw Error('create '+r.status());return(await r.json()).meeting;};
const board='deb00000-0000-4000-8000-000000000002';
const chat=async(id=board,p=page)=>{await p.goto(origin+'/meetings/'+id);await p.getByLabel('Сообщение',{exact:true}).waitFor();};
const close=async(form)=>{await form.getByRole('button',{name:/^(Закрыть|Назад)$/}).click();await form.waitFor({state:'hidden'});};
const raw=async(name,file,width)=>{await reference.goto(origin+'/__design/'+referencePath(file));await capture(reference,name+'-'+width+'-reference','reference');};
const failures=[];
const attempt=async(name,fn)=>{try{await fn();await record(name,'completed');}catch(e){failures.push(name);await record(name,String(e));console.error(name+': '+String(e).split('\n')[0]);try{await capture(page,name+'-failure');}catch{} }};

const widths=(process.env.REVIEW_WIDTHS||'320,390,768,1440').split(',').map(Number);if(widths.some(w=>![320,390,768,1440].includes(w)))throw Error('Unexpected viewport selection');
const titles=[['date','Предложить дату'],['place','Предложить место'],['task','Предложить задачу']];
const inside=async(element)=>{const b=await element.boundingBox();const v=await page.evaluate(()=>({width:innerWidth,height:innerHeight}));return !!b&&b.x>=0&&b.y>=0&&b.x+b.width<=v.width+1&&b.y+b.height<=v.height+1;};
try{
 await fs.writeFile(path.join(output,'run.json'),JSON.stringify({sourceHash,fixtureHash,fixtureFiles,referencePolicy,harnessHash,runtime:browser.version(),os:os.release(),mode:'independent-live',startedAt:new Date().toISOString(),browserZoom:2,selection:{widths},note:'Real browser tab zoom in a temporary dedicated Chromium profile. No changes to user browsers. Captures require personal inspection.'},null,2)+'\n');
 await boot(context,page,'Саша');
 for(const width of widths){
  configuredViewport={width,height:844};await page.setViewportSize(configuredViewport);await reference.setViewportSize(configuredViewport);
  await attempt('zoom-list-'+width,async()=>{
   await page.goto(origin+'/meetings');await expect(page.getByRole('heading',{name:'Мои встречи',exact:true})).toBeVisible();await browserZoom(page,2);await capture(page,'list-large-text-'+width);await reference.goto(origin+'/__design/list.html');await browserZoom(reference,2);await capture(reference,'list-large-text-'+width+'-reference','reference');
   const noCover=page.getByRole('link').filter({hasText:'Воскресенье без планов'});await noCover.scrollIntoViewIfNeeded();await capture(page,'list-no-cover-large-text-'+width);const before=await noCover.boundingBox();await noCover.click();await expect(page.getByLabel('Сообщение',{exact:true})).toBeVisible();await page.getByRole('link',{name:'К моим встречам',exact:true}).click();await noCover.waitFor();const after=await noCover.boundingBox();await capture(page,'list-return-large-text-'+width);await record('large list return '+width,{before,after,zoom:await browserZoom(page)});
  });
  for(const [key,title] of titles)await attempt('zoom-'+key+'-'+width,async()=>{
   await chat();await browserZoom(page,2);await page.getByRole('button',{name:'Добавить к встрече'}).click();await page.getByRole('menuitem',{name:title,exact:true}).click();const form=surface(title);await form.waitFor();if(key==='place')await form.getByLabel('Новое место').fill('Кафе у метро');if(key==='task')await form.getByLabel('Что сделать').fill('Принести настолку');await capture(page,key+'-large-text-open-'+width);
   await reference.goto(origin+'/__design/'+referencePath('action-'+key+'.html'));await browserZoom(reference,2);await capture(reference,key+'-large-text-'+width+'-reference','reference');
   const submit=form.getByRole('button',{name:key==='date'?'Создать опрос':title,exact:true});await submit.scrollIntoViewIfNeeded();await capture(page,key+'-large-text-submit-'+width);const closeButton=form.getByRole('button',{name:/^(Закрыть|Назад)$/});const geometry={submitFullyInLayoutViewport:await inside(submit),closeFullyInLayoutViewport:await inside(closeButton),horizontalOverflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),zoom:await browserZoom(page)};await record('large text geometry '+key+' '+width,geometry);if(!geometry.submitFullyInLayoutViewport)throw Error('CTA not fully reachable within layout viewport');await close(form);await expect(page.getByLabel('Сообщение',{exact:true})).toBeVisible();
  });
 }
 await record('End',{failures});if(failures.length)process.exitCode=1;
}finally{await context.close();await fs.rm(profile,{recursive:true,force:true});}

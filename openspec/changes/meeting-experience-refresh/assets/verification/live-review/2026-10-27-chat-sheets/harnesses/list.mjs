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
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({baseURL:origin,ignoreHTTPSErrors:true,locale:'ru-RU',timezoneId:'Europe/Moscow',viewport:{width:390,height:844},colorScheme:'dark'});
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
 const meta={kind,sourceHash,fixtureHash,runtime:browser.version(),os:os.release(),fonts,fontScope,...state,capturedAt:new Date().toISOString()};
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

const longTitle='Большой совместный вечер настольных игр, домашней пиццы и разговоров с друзьями';
try{
 await boot(context,page,'Саша');
 const created=await page.request.post(origin+'/api/v1/meetings',{headers:await headers(page),data:{title:longTitle,starts_on:'2026-11-08',timezone:'Europe/Moscow'}});if(created.status()!==201)throw Error('Long title fixture '+created.status());const {meeting}=await created.json();
 const fixtureVariant={baseFixtureHash:fixtureHash,createdMeeting:{title:longTitle,starts_on:'2026-11-08',timezone:'Europe/Moscow',participantCount:1,organizer:'Саша',cover:null},referenceAdaptation:'Clone approved no-cover card; substitute only fixture title/date/participant count and clone approved organizer crown. No CSS or layout changes.'};
 await fs.writeFile(path.join(output,'fixture-variant.json'),JSON.stringify(fixtureVariant,null,2)+'\n');await fs.writeFile(path.join(output,'run.json'),JSON.stringify({sourceHash,fixtureHash,fixtureFiles,referencePolicy,harnessHash,runtime:browser.version(),os:os.release(),startedAt:new Date().toISOString(),mode:'independent-live',note:'Adds one isolated QA meeting through API. Reference uses published card markup with matching fixture data. No app/source/style edits.'},null,2)+'\n');
 for(const width of [320,390,768,1440])await attempt('list-states-'+width,async()=>{
  await page.setViewportSize({width,height:1000});await reference.setViewportSize({width,height:1000});await page.goto(origin+'/meetings');const card=page.getByTestId('meeting-card').filter({has:page.locator('a[href="/meetings/'+meeting.id+'"]')});await card.waitFor();await card.scrollIntoViewIfNeeded();await capture(page,'list-long-title-'+width);
  const geometry=await card.evaluate(el=>{const heading=el.querySelector('h2,h3');const b=el.getBoundingClientRect();const h=heading?.getBoundingClientRect();return{card:{x:b.x,y:b.y,width:b.width,height:b.height},heading:h?{x:h.x,y:h.y,width:h.width,height:h.height}:null,headingText:heading?.textContent,headingOverflow:heading?heading.scrollHeight>heading.clientHeight+1:null,hasImage:!!el.querySelector('img'),viewport:{width:innerWidth,height:innerHeight}};});await record('Long title geometry '+width,geometry);if(geometry.headingOverflow)throw Error('Long title clipped');if(geometry.hasImage)throw Error('Unexpected cover in no-cover card');
  await reference.goto(origin+'/__design/list.html');await reference.evaluate(title=>{const original=document.querySelector('a[href="chat-sunday.html"]');const crown=document.querySelector('.meeting-card .crown');if(!original||!crown)throw Error('Reference card/crown missing');const clone=original.cloneNode(true);clone.setAttribute('data-review-fixture','long-title');const h=clone.querySelector('h2');h.textContent=title;h.append(crown.cloneNode(true));const faces=Array.from(clone.querySelectorAll('.face'));faces.slice(1).forEach(face=>face.remove());original.parentElement.append(clone);},longTitle);await reference.locator('[data-review-fixture="long-title"]').scrollIntoViewIfNeeded();await capture(reference,'list-long-title-'+width+'-reference','reference');
  const link=card.locator('a[href="/meetings/'+meeting.id+'"]');const before=await card.boundingBox();await link.click();await expect(page.getByLabel('Сообщение',{exact:true})).toBeVisible();await page.getByRole('link',{name:'К моим встречам',exact:true}).click();await card.waitFor();const after=await card.boundingBox();await capture(page,'list-return-from-chat-'+width);await record('List return position '+width,{before,after,deltaY:after&&before?after.y-before.y:null});
 });
 await record('End',{failures});if(failures.length)process.exitCode=1;
}finally{await browser.close();}

import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
const root=process.cwd();
const require=createRequire(path.join(root,'package.json'));
const {chromium}=require('playwright');
const {expect}=require('@playwright/test');
const assets=path.join(root,'openspec/changes/meeting-experience-refresh/assets');
const output=path.join(assets,'verification/live-review',process.env.REVIEW_OUTPUT||'web-remaining-unfrozen');
await fs.mkdir(output,{recursive:true});
const sourceHash=process.env.REVIEW_SOURCE_HASH;
if(!/^[0-9a-f]{64}$/.test(sourceHash||''))throw Error('REVIEW_SOURCE_HASH required');
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
 const {nodeIds}=await cdp.send('DOM.querySelectorAll',{nodeId:dom.nodeId,selector:'h1,h2,p,label,input,textarea,button,a,span'});
 const fontMap=new Map();for(const nodeId of nodeIds.slice(0,70)){for(const font of (await cdp.send('CSS.getPlatformFontsForNode',{nodeId})).fonts){fontMap.set(font.postScriptName,font);}}const fonts=[...fontMap.values()];await cdp.detach();
 await target.screenshot({path:path.join(output,name+'.png'),fullPage:false,animations:'disabled'});
 const meta={kind,sourceHash,fixtureHash,runtime:browser.version(),os:os.release(),fonts,...state,capturedAt:new Date().toISOString()};
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
const raw=async(name,file,width)=>{await reference.goto(origin+'/__design/'+file);await capture(reference,name+'-'+width+'-reference','reference');};
const failures=[];
const attempt=async(name,fn)=>{try{await fn();await record(name,'completed');}catch(e){failures.push(name);await record(name,String(e));console.error(name+': '+String(e).split('\n')[0]);try{await capture(page,name+'-failure');}catch{} }};
try{await boot(context,page,'Саша');for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:1000});await reference.setViewportSize({width,height:1000});
  for(const kind of ['file'])await attempt('upload-'+kind+'-'+width,async()=>{
   const meeting=await create((kind==='file'?'Документы':'Фото')+' — независимый review '+width);await chat(meeting.id);await page.getByLabel('Сообщение',{exact:true}).fill('Обсудим после');
   await page.getByRole('button',{name:'Добавить к встрече'}).click();const chooserPromise=page.waitForEvent('filechooser');await page.getByRole('menuitem',{name:kind==='file'?'Файл':'Фото',exact:true}).click();const chooser=await chooserPromise;await page.waitForURL(origin+'/meetings/'+meeting.id+'?action=file');await surface('Отправить файл').waitFor();await page.waitForFunction(()=>Array.from(document.querySelectorAll('dialog[open][data-motion]')).every(el=>el.getAttribute('data-motion')==='open'));
   await chooser.setFiles(kind==='file'?{name:'review-rules.txt',mimeType:'text/plain',buffer:Buffer.from('Тестовые правила встречи')}:{name:'friends.png',mimeType:'image/png',buffer:await fs.readFile(path.join(assets,'friends.png'))});
   const title=kind==='file'?'Отправить файл':'Отправить фото';const form=surface(title);await form.waitFor();await expect(form.getByRole('button',{name:'Отправить',exact:true})).toBeEnabled();if(kind==='file')await form.getByLabel('Подпись к review-rules.txt').fill('Правила на вечер');await capture(page,'upload-'+kind+'-open-'+width);await raw('upload-'+kind,kind==='file'?'upload-file.html':'upload.html',width);
   await close(form);await expect(page.getByLabel('Сообщение',{exact:true})).toHaveValue('Обсудим после');await page.getByRole('button',{name:'Добавить к встрече'}).click();await page.getByRole('menuitem',{name:kind==='file'?'Файл':'Фото',exact:true}).click();await form.waitFor();if(kind==='file')await expect(form.getByLabel('Подпись к review-rules.txt')).toHaveValue('Правила на вечер');await capture(page,'upload-'+kind+'-reopen-'+width);
   let attempts=0;const routePattern='**/api/v1/meetings/'+meeting.id+'/media/*/content';await page.route(routePattern,async route=>{if(route.request().method()!=='PUT')return route.continue();attempts++;if(attempts===1)return route.fulfill({status:503,json:{error:{code:'unavailable',field_errors:{},request_id:'independent-review'}}});return route.continue();});
   await form.getByRole('button',{name:'Отправить',exact:true}).click();await form.getByRole('button',{name:'Повторить',exact:true}).waitFor();await capture(page,'upload-'+kind+'-error-'+width);await close(form);await page.getByRole('button',{name:'Добавить к встрече'}).click();await page.getByRole('menuitem',{name:kind==='file'?'Файл':'Фото',exact:true}).click();await form.getByRole('button',{name:'Повторить',exact:true}).waitFor();await form.getByRole('button',{name:'Повторить',exact:true}).click();await expect(form.getByText('Добавлено',{exact:true})).toHaveCount(1);await capture(page,'upload-'+kind+'-retry-success-'+width);await form.getByRole('button',{name:'Готово',exact:true}).click();await form.waitFor({state:'hidden'});await expect(page.getByLabel('Сообщение',{exact:true})).toHaveValue('Обсудим после');if(attempts!==2)throw Error('unexpected content attempts '+attempts);await record('upload retry '+kind+' '+width,{contentAttempts:attempts,composerPreserved:true});await page.unroute(routePattern);
  });
  await attempt('profile-scoped-'+width,async()=>{await page.goto(origin+'/profile');await page.getByRole('main').getByRole('link',{name:'Сообщить о проблеме',exact:true}).scrollIntoViewIfNeeded();await capture(page,'profile-service-links-'+width);});
}await record('End',{failures});if(failures.length)process.exitCode=1;}finally{await browser.close();}

import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
const root=process.cwd();
const harnessHash=crypto.createHash('sha256').update(await fs.readFile(new URL(import.meta.url))).digest('hex');
const require=createRequire(path.join(root,'package.json'));
const {chromium}=require('playwright');
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
const context=await browser.newContext({ignoreHTTPSErrors:true,locale:'ru-RU',timezoneId:'Europe/Moscow',viewport:{width:390,height:844},colorScheme:'dark'});
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
try{
 await fs.writeFile(path.join(output,'run.json'),JSON.stringify({sourceHash,fixtureHash,fixtureFiles,referencePolicy,harnessHash,runtime:browser.version(),os:os.release(),mode:'independent-live',startedAt:new Date().toISOString(),note:'Frozen-source QA captures require independent personal visual inspection; this driver never assigns pass.'},null,2)+'\n');
 const started=await context.request.post(origin+'/api/v1/auth/yandex/start',{headers:{Origin:origin},data:{client_kind:'web',return_context:{kind:'home'}}});
 if(!started.ok())throw Error('auth start '+started.status());
 const {authorization_url}=await started.json();
 if(new URL(authorization_url).origin!==origin)throw Error('unexpected fixture provider');
 await page.goto(authorization_url);
 await page.getByRole('link',{name:'Войти как Саша',exact:true}).click();
 await page.waitForURL(origin+'/meetings');
 await record('Fixture OAuth bootstrap','Саша logged in to production dist; no demo mode.');
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:1000});await reference.setViewportSize({width,height:1000});
  await page.goto(origin+'/meetings?view=list&period=upcoming');
  await page.getByRole('heading',{name:'Мои встречи',exact:true}).waitFor();
  await page.getByText('Настолки у Саши',{exact:false}).first().waitFor();
  await capture(page,'list-'+width);
  await reference.goto(origin+'/__design/list.html');await capture(reference,'list-'+width+'-reference','reference');
  await page.goto(origin+'/meetings/deb00000-0000-4000-8000-000000000002');
  await page.getByLabel('Сообщение',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Добавить к встрече'}).click();
  await capture(page,'menu-'+width);
  await reference.goto(origin+'/__design/'+referencePath('chat-menu.html'));await capture(reference,'menu-'+width+'-reference','reference');
  await page.keyboard.press('Escape');
  await record('Menu '+width,'Opened plus menu, dismissed Escape; focus='+await page.locator(':focus').getAttribute('aria-label'));
  for(const [key,title] of [['date','Предложить дату'],['place','Предложить место'],['task','Предложить задачу']]){
   await page.getByRole('button',{name:'Добавить к встрече'}).click();
   await page.getByRole('menuitem',{name:title,exact:true}).click();
   const form=surface(title);await form.waitFor();
   if(key==='task')await form.getByLabel('Что сделать').fill('Заказать пиццу');
   if(key==='place'){await form.getByLabel('Новое место').fill('Кафе «Соседи»');await form.getByLabel('Почему здесь').fill('Рядом с метро');}
   await capture(page,'action-'+key+'-'+width);
   await reference.goto(origin+'/__design/'+referencePath('action-'+key+'.html'));await capture(reference,'action-'+key+'-'+width+'-reference','reference');
   await form.getByRole('button',{name:width<740?'Закрыть':'Назад',exact:true}).click();
   await form.waitFor({state:'hidden'});
   await page.getByRole('button',{name:'Добавить к встрече'}).click();await page.getByRole('menuitem',{name:title,exact:true}).click();
   let result='date controls reopened';
   if(key==='task')result=await surface(title).getByLabel('Что сделать').inputValue();
   if(key==='place')result=(await surface(title).getByLabel('Новое место').inputValue())+' / '+(await surface(title).getByLabel('Почему здесь').inputValue());
   await record('Open/edit/close/reopen '+key+' '+width,result);
   await surface(title).getByRole('button',{name:width<740?'Закрыть':'Назад',exact:true}).click();await surface(title).waitFor({state:'hidden'});
  }
 }
 await record('End','Preliminary basic screen captures completed. Images still require independent visual inspection.');
}catch(error){await record('Failure',String(error));console.error(String(error));process.exitCode=1;}finally{await browser.close();}

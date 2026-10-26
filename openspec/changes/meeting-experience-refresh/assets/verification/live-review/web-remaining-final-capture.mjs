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
const output=path.join(assets,'verification/live-review',process.env.REVIEW_OUTPUT||'web-remaining-final-unfrozen');
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
const widths=(process.env.REVIEW_WIDTHS||'320,390,768,1440').split(',').map(Number);if(widths.some(w=>![320,390,768,1440].includes(w)))throw Error('Unexpected viewport selection');
const scenario=process.env.REVIEW_SCENARIO?new RegExp(process.env.REVIEW_SCENARIO):null;
const failures=[];
const attempt=async(name,fn)=>{if(scenario&&!scenario.test(name))return;try{await fn();await record(name,'completed');}catch(e){failures.push(name);await record(name,String(e));console.error(name+': '+String(e).split('\n')[0]);try{await capture(page,name+'-failure');}catch{} }};
const memberContext=await browser.newContext({baseURL:origin,ignoreHTTPSErrors:true,locale:'ru-RU',timezoneId:'Europe/Moscow',viewport:{width:390,height:1000},colorScheme:'dark'});
const member=await memberContext.newPage();
try{
 await fs.writeFile(path.join(output,'run.json'),JSON.stringify({sourceHash,fixtureHash,fixtureFiles,harnessHash,runtime:browser.version(),os:os.release(),mode:'independent-live',selection:{widths,scenario:process.env.REVIEW_SCENARIO||'all'},startedAt:new Date().toISOString(),note:'Isolated QA fixtures and injected errors; no final acceptance before visual inspection.'},null,2)+'\n');
 await context.grantPermissions(['clipboard-read','clipboard-write'],{origin});
 await boot(context,page,'Саша');await boot(memberContext,member,'Лена');
 for(const width of widths){
  await page.setViewportSize({width,height:1000});await reference.setViewportSize({width,height:1000});await member.setViewportSize({width,height:1000});
  await attempt('info-settings-'+width,async()=>{
   await chat();await page.getByRole('button',{name:'Информация о встрече'}).click();
   const info=page.getByRole('dialog',{name:'Настолки у Саши',exact:true});await info.waitFor();
   await expect(info.getByRole('link',{name:/Помощь|Сообщить|О somewhere|Политика|Cookie|Версия/})).toHaveCount(0);
   await capture(page,'info-organizer-'+width);await raw('info','meeting-details.html',width);
   await info.getByRole('button',{name:'Изменить настройки'}).click();
   const edit=page.getByRole('dialog',{name:'Настройки встречи',exact:true});await edit.waitFor();
   await capture(page,'settings-open-'+width);await raw('settings','create.html',width);
   await edit.getByLabel('Название',{exact:true}).fill('Настолки — черновик');if(width>=740){const field=edit.getByLabel('Название',{exact:true});await field.pressSequentially('!');await field.press('Backspace');await expect(field).toHaveValue('Настолки — черновик');await expect(field).toBeFocused();await capture(page,'settings-desktop-keyboard-'+width);await record('settings desktop keyboard '+width,{fieldFocused:true,typedAndErased:true,softwareIME:false});}
   await close(edit);await page.getByRole('button',{name:'Информация о встрече'}).click();await info.getByRole('button',{name:'Изменить настройки'}).click();
   await expect(edit.getByLabel('Название',{exact:true})).toHaveValue('Настолки — черновик');await capture(page,'settings-reopen-'+width);await close(edit);
   await chat(board,member);await member.getByRole('button',{name:'Информация о встрече'}).click();
   const memberInfo=member.getByRole('dialog',{name:'Настолки у Саши',exact:true});await memberInfo.waitFor();await expect(memberInfo.getByRole('button',{name:'Изменить настройки'})).toHaveCount(0);await capture(member,'info-member-'+width);await memberInfo.getByRole('button',{name:'Закрыть',exact:true}).click();await memberInfo.waitFor({state:'hidden'});
   await page.goto(origin+'/profile');await page.getByRole('main').getByRole('link',{name:'Сообщить о проблеме',exact:true}).scrollIntoViewIfNeeded();await capture(page,'profile-service-links-'+width);
  });
  await attempt('share-'+width,async()=>{
   await chat();await page.getByRole('button',{name:'Пригласить друзей',exact:true}).first().click();const form=surface('Пригласить друзей');await form.getByLabel('Ссылка приглашения').waitFor();await capture(page,'share-open-'+width);await raw('share','share.html',width);
   const link=await form.getByLabel('Ссылка приглашения').inputValue();await form.getByRole('button',{name:'Скопировать ссылку',exact:true}).click();await expect(form.getByText('Ссылка скопирована.',{exact:true})).toBeVisible();const copied=await page.evaluate(()=>navigator.clipboard.readText());if(copied!==link)throw Error('clipboard differs');await capture(page,'share-copied-'+width);await raw('share-copied','share-copied.html',width);await close(form);await expect(page.getByLabel('Сообщение',{exact:true})).toBeVisible();await record('share copied/cancel '+width,{clipboardMatches:true,returnedToChat:true});
  });
  await attempt('reaction-people-'+width,async()=>{
   await chat();const row=page.getByTestId('feed-message').filter({hasText:'Я принесу настолки. Во что будем играть?'});await row.getByRole('button',{name:'Добавить реакцию'}).click();await page.getByRole('button',{name:'Кто отреагировал',exact:true}).click();const people=page.getByRole('dialog',{name:'Реакции',exact:true});await people.waitFor();await capture(page,'reaction-people-open-'+width);await raw('reaction-people','chat-reacted.html',width);await close(people);await expect(row).toBeVisible();await record('reaction people return '+width,'chat row preserved');
  });
  for(const kind of ['file','photo'])await attempt('upload-'+kind+'-'+width,async()=>{
   const meeting=await create((kind==='file'?'Документы':'Фото')+' — независимый review '+width);await chat(meeting.id);await page.getByLabel('Сообщение',{exact:true}).fill('Обсудим после');
   await page.getByRole('button',{name:'Добавить к встрече'}).click();const chooserPromise=page.waitForEvent('filechooser');await page.getByRole('menuitem',{name:kind==='file'?'Файл':'Фото',exact:true}).click();const chooser=await chooserPromise;
   await chooser.setFiles(kind==='file'?{name:'review-rules.txt',mimeType:'text/plain',buffer:Buffer.from('Тестовые правила встречи')}:{name:'friends.png',mimeType:'image/png',buffer:await fs.readFile(path.join(assets,'friends.png'))});
   const title=kind==='file'?'Отправить файл':'Отправить фото';const form=surface(title);await form.waitFor();await expect(form.getByRole('button',{name:'Отправить',exact:true})).toBeEnabled();if(kind==='file')await form.getByLabel('Подпись к review-rules.txt').fill('Правила на вечер');await capture(page,'upload-'+kind+'-open-'+width);await raw('upload-'+kind,kind==='file'?'upload-file.html':'upload.html',width);
   await close(form);await expect(page.getByLabel('Сообщение',{exact:true})).toHaveValue('Обсудим после');await page.getByRole('button',{name:'Добавить к встрече'}).click();await page.getByRole('menuitem',{name:kind==='file'?'Файл':'Фото',exact:true}).click();await form.waitFor();if(kind==='file')await expect(form.getByLabel('Подпись к review-rules.txt')).toHaveValue('Правила на вечер');await capture(page,'upload-'+kind+'-reopen-'+width);
   let attempts=0;const routePattern='**/api/v1/meetings/'+meeting.id+'/media/*/content';await page.route(routePattern,async route=>{if(route.request().method()!=='PUT')return route.continue();attempts++;if(attempts===1)return route.fulfill({status:503,json:{error:{code:'unavailable',field_errors:{},request_id:'independent-review'}}});return route.continue();});
   await form.getByRole('button',{name:'Отправить',exact:true}).click();await form.getByRole('button',{name:'Повторить',exact:true}).waitFor();await capture(page,'upload-'+kind+'-error-'+width);await close(form);await page.getByRole('button',{name:'Добавить к встрече'}).click();await page.getByRole('menuitem',{name:kind==='file'?'Файл':'Фото',exact:true}).click();await form.getByRole('button',{name:'Повторить',exact:true}).waitFor();await form.getByRole('button',{name:'Повторить',exact:true}).click();await expect(form.getByText('Добавлено',{exact:true})).toHaveCount(1);await capture(page,'upload-'+kind+'-retry-success-'+width);await form.getByRole('button',{name:'Готово',exact:true}).click();await form.waitFor({state:'hidden'});await expect(page.getByLabel('Сообщение',{exact:true})).toHaveValue('Обсудим после');if(attempts!==2)throw Error('unexpected content attempts '+attempts);await record('upload retry '+kind+' '+width,{contentAttempts:attempts,composerPreserved:true});await page.unroute(routePattern);
  });
  await attempt('settings-failure-'+width,async()=>{
   const meeting=await create('Настройки — независимый review '+width);await chat(meeting.id);await page.getByRole('button',{name:'Информация о встрече'}).click();await page.getByRole('dialog',{name:meeting.title,exact:true}).getByRole('button',{name:'Изменить настройки'}).click();const edit=page.getByRole('dialog',{name:'Настройки встречи',exact:true});await edit.getByLabel('Название',{exact:true}).fill('Название после повтора');let requests=[];const pattern='**/api/v1/meetings/'+meeting.id;await page.route(pattern,async route=>{if(route.request().method()!=='PATCH')return route.continue();requests.push({key:route.request().headers()['idempotency-key'],body:route.request().postData()});if(requests.length===1)return route.abort('failed');return route.continue();});await edit.getByRole('button',{name:'Сохранить изменения',exact:true}).click();await edit.getByRole('button',{name:'Повторить отправку',exact:true}).waitFor();await capture(page,'settings-error-'+width);await close(edit);await page.getByRole('button',{name:'Информация о встрече'}).click();await page.getByRole('dialog',{name:meeting.title,exact:true}).getByRole('button',{name:'Изменить настройки'}).click();await expect(edit.getByLabel('Название',{exact:true})).toHaveValue('Название после повтора');await edit.getByRole('button',{name:'Повторить отправку',exact:true}).click();await edit.waitFor({state:'hidden'});if(requests.length!==2||requests[0].key!==requests[1].key||requests[0].body!==requests[1].body)throw Error('settings retry changed key/body');await capture(page,'settings-retry-return-'+width);await record('settings retry '+width,{requests:2,sameKey:true,sameBody:true});await page.unroute(pattern);
  });
  await attempt('task-details-'+width,async()=>{
   const meeting=await create('Задача — независимый review '+width);const me=await(await page.request.get(origin+'/api/v1/me')).json();const proposed=await page.request.post(origin+'/api/v1/meetings/'+meeting.id+'/preparation-tasks',{headers:await headers(page),data:{title:'Заказать пиццу',recipient_id:me.user.id}});if(proposed.status()!==201)throw Error('task seed '+proposed.status());await chat(meeting.id);const card=page.getByRole('region',{name:'Задача подготовки'});await card.locator('summary').click();await card.getByRole('button',{name:'Принять задачу',exact:true}).waitFor();await capture(page,'task-details-open-'+width);await raw('task-details','chat-menu.html',width);
   let requests=[];const pattern='**/api/v1/meetings/'+meeting.id+'/preparation-tasks/*/accept';await page.route(pattern,async route=>{requests.push({key:route.request().headers()['idempotency-key'],body:route.request().postData()});if(requests.length===1)return route.abort('failed');return route.continue();});await card.getByRole('button',{name:'Принять задачу',exact:true}).click();await card.getByRole('button',{name:'Повторить действие',exact:true}).waitFor();await capture(page,'task-details-error-'+width);await card.getByRole('button',{name:'Повторить действие',exact:true}).click();await expect(card.getByText('Исполняет Саша',{exact:true})).toBeVisible();await capture(page,'task-details-accepted-'+width);if(requests.length!==2||requests[0].key!==requests[1].key||requests[0].body!==requests[1].body)throw Error('task retry changed key/body');await record('task action retry '+width,{requests:requests.length,sameKey:requests[0]?.key===requests[1]?.key,sameBody:requests[0]?.body===requests[1]?.body});await page.unroute(pattern);
  });
 }
 await record('End',{failures});if(failures.length)process.exitCode=1;
}finally{await browser.close();}

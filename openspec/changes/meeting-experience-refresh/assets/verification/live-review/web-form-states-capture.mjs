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
const output=path.join(assets,'verification/live-review',process.env.REVIEW_OUTPUT||'web-form-states-unfrozen');
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

const memberContext=await browser.newContext({baseURL:origin,ignoreHTTPSErrors:true,locale:'ru-RU',timezoneId:'Europe/Moscow',viewport:{width:390,height:844},colorScheme:'dark'});
const member=await memberContext.newPage();
const definitions=[
 {kind:'date',title:'Предложить дату',endpoint:'date-polls',submit:'Создать опрос',region:'Опрос о дате',raw:'action-date.html'},
 {kind:'place',title:'Предложить место',endpoint:'place-polls',submit:'Предложить место',region:'Опрос о месте',raw:'action-place.html'},
 {kind:'task',title:'Предложить задачу',endpoint:'preparation-tasks',submit:'Предложить задачу',region:'Задача подготовки',raw:'action-task.html'},
];
const formFor=(p,title)=>p.getByRole('main',{name:title,exact:true}).or(p.getByRole('dialog',{name:title,exact:true}));
const open=async(p,definition)=>{await p.getByRole('button',{name:'Добавить к встрече'}).click();await p.getByRole('menuitem',{name:definition.title,exact:true}).click();const form=formFor(p,definition.title);await form.waitFor();if(await form.getAttribute('role')==='dialog'||await form.evaluate(el=>el.tagName==='DIALOG'))await expect(form).toHaveAttribute('data-motion','open');return form;};
const fill=async(form,kind)=>{if(kind==='place'){await form.getByLabel('Новое место').fill('Кафе у парка');await form.getByLabel('Почему здесь').fill('Есть большой стол для компании');}if(kind==='task')await form.getByLabel('Что сделать').fill('Принести настолку');};
try{
 await fs.writeFile(path.join(output,'run.json'),JSON.stringify({sourceHash,fixtureHash,fixtureFiles,harnessHash,runtime:browser.version(),os:os.release(),mode:'independent-live',selection:{widths,scenario:process.env.REVIEW_SCENARIO||'all'},startedAt:new Date().toISOString(),note:'Production dist with isolated QA API; snapshots require personal review. No request credentials or idempotency values are stored.'},null,2)+'\n');
 await boot(context,page,'Саша');await boot(memberContext,member,'Лена');
 for(const width of widths){
  await page.setViewportSize({width,height:844});await reference.setViewportSize({width,height:844});await member.setViewportSize({width,height:844});
  for(const d of definitions){
   await attempt('uncertain-'+d.kind+'-'+width,async()=>{
    const meeting=await create('Повтор '+d.kind+' '+width);await chat(meeting.id);await page.getByLabel('Сообщение',{exact:true}).fill('Контекст под панелью');const form=await open(page,d);await fill(form,d.kind);
    const requests=[];let release=()=>{};let held=false;const gate=new Promise(resolve=>{release=resolve;});const pattern='**/api/v1/meetings/'+meeting.id+'/'+d.endpoint;
    await page.route(pattern,async route=>{
     if(route.request().method()!=='POST')return route.continue();
     const response=await route.fetch();if(!response.ok())throw Error('Commit '+response.status());const body=await response.json();requests.push({key:route.request().headers()['idempotency-key'],body:route.request().postData(),id:body.id});
     if(requests.length===1){held=true;await gate;return route.abort('failed');}return route.fulfill({response});
    });
    try{
     const submit=form.getByRole('button',{name:d.submit,exact:true});await submit.click();await expect.poll(()=>held).toBe(true);await expect(submit).toBeDisabled();for(const input of await form.locator('input,textarea,select').all())await expect(input).toBeDisabled();await capture(page,d.kind+'-pending-'+width);await record('pending repeat '+d.kind+' '+width,{requests:requests.length,submitDisabled:true});
     release();const retry=form.getByRole('button',{name:'Повторить отправку',exact:true});await expect(retry).toBeEnabled();for(const input of await form.locator('input,textarea,select').all())await expect(input).toBeDisabled();await capture(page,d.kind+'-uncertain-error-'+width);await raw(d.kind+'-content',d.raw,width);
     await close(form);await expect(page.getByLabel('Сообщение',{exact:true})).toHaveValue('Контекст под панелью');await open(page,d);for(const input of await form.locator('input,textarea,select').all())await expect(input).toBeDisabled();await capture(page,d.kind+'-uncertain-reopen-'+width);await retry.click();await form.waitFor({state:'hidden'});await expect(page.getByRole('region',{name:d.region,exact:true})).toHaveCount(1);
     if(requests.length!==2||!requests[0].key||requests[0].key!==requests[1].key||requests[0].body!==requests[1].body||!requests[0].id||requests[0].id!==requests[1].id)throw Error('Retry key/body/object differed');await capture(page,d.kind+'-retry-success-'+width);await record('uncertain retry '+d.kind+' '+width,{requests:2,sameKey:true,sameBody:true,sameObjectId:true,oneFeedObject:true,composerPreserved:true});
    }finally{release();await page.unroute(pattern);}
   });
   await attempt('reduced-motion-'+d.kind+'-'+width,async()=>{
    await page.emulateMedia({reducedMotion:'reduce'});
    await chat();
    const probe=await page.evaluateHandle(()=>{
     let frames=0;let maximum=0;let running=0;let id=0;
     const sample=()=>{
      frames++;
      for(const el of document.querySelectorAll('dialog[open]')){
       for(const animation of el.getAnimations()){
        if(animation.playState!=='running')continue;
        running++;
        maximum=Math.max(maximum,Number(animation.effect?.getComputedTiming().duration)||0);
       }
      }
      id=requestAnimationFrame(sample);
     };
     id=requestAnimationFrame(sample);
     return{stop:()=>{cancelAnimationFrame(id);return{frames,maximumRunningDurationMs:maximum,runningAnimationSamples:running};}};
    });
    try{
     const form=await open(page,d);await fill(form,d.kind);
     const animations=await form.evaluate(el=>({reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,transition:getComputedStyle(el).transitionDuration,animation:getComputedStyle(el).animationDuration}));
     await capture(page,d.kind+'-reduced-motion-'+width);await close(form);
     await expect(page.getByRole('button',{name:'Добавить к встрече'})).toBeFocused();
     const transition=await probe.evaluate(p=>p.stop());
     await record('reduced motion '+d.kind+' '+width,{...animations,transition,returnedFocusToTrigger:true});
     if(transition.frames===0||transition.maximumRunningDurationMs>1)throw Error('Observed animated dialog transition under reduced motion');
    }finally{
     await probe.evaluate(p=>p.stop()).catch(()=>{});await probe.dispose();
     await page.emulateMedia({reducedMotion:'no-preference'});
    }
   });
   if(width>=740)await attempt('desktop-keyboard-'+d.kind+'-'+width,async()=>{
    await chat();const form=await open(page,d);const field=d.kind==='date'?form.getByRole('combobox',{name:'Вариант 1',exact:true}):form.getByLabel(d.kind==='place'?'Новое место':'Что сделать');let tabs=0;for(;tabs<40;tabs++){if(await field.evaluate(el=>el===document.activeElement||el.contains(document.activeElement)))break;await page.keyboard.press('Tab');}await expect(field).toBeFocused();
    if(d.kind==='date'){await field.press('Alt+ArrowDown');const popup=page.locator('.g-popup').filter({has:page.getByRole('grid')});await expect(popup).toBeVisible();await capture(page,d.kind+'-desktop-keyboard-'+width);await page.keyboard.press('Escape');await expect(popup).not.toBeVisible();await expect(form).toBeVisible();}else{await page.keyboard.type('Keyboard review');await expect(field).toHaveValue('Keyboard review');await capture(page,d.kind+'-desktop-keyboard-'+width);}
    await record('desktop keyboard '+d.kind+' '+width,{tabs,fieldFocused:true,mode:'keyboard events in desktop Chromium; no software IME claim'});await close(form);
   });
   await attempt('access-revoked-'+d.kind+'-'+width,async()=>{
    const meeting=await create('Отзыв доступа '+d.kind+' '+width);const invitationResponse=await page.request.get(origin+'/api/v1/meetings/'+meeting.id+'/invitation');if(!invitationResponse.ok())throw Error('Invitation '+invitationResponse.status());const {invitation_url}=await invitationResponse.json();const invitation=new URL(invitation_url).pathname.replace('/i/','/api/v1/invitations/');const answer=async(value,revision)=>{const r=await member.request.put(origin+invitation+'/rsvp',{headers:await headers(member),data:{answer:value,expected_revision:revision}});if(r.status()!==200)throw Error('RSVP '+r.status());};
    await answer('going','0');await chat(meeting.id,member);const form=await open(member,d);await fill(form,d.kind);if(d.kind==='date')await form.getByRole('checkbox',{name:'Анонимное голосование'}).check();await capture(member,d.kind+'-before-revoke-'+width);await answer('maybe','1');await expect(form).toHaveCount(0,{timeout:15000});await expect(member.getByLabel('Сообщение',{exact:true})).toHaveCount(0);await capture(member,d.kind+'-access-revoked-'+width);
    await answer('going','2');await chat(meeting.id,member);const reopened=await open(member,d);if(d.kind==='date')await expect(reopened.getByRole('checkbox',{name:'Анонимное голосование'})).not.toBeChecked();if(d.kind==='place')await expect(reopened.getByLabel('Новое место')).toHaveValue('');if(d.kind==='task')await expect(reopened.getByLabel('Что сделать')).toHaveValue('');await capture(member,d.kind+'-after-rejoin-'+width);await close(reopened);await record('access revoked '+d.kind+' '+width,{sheetRemoved:true,composerRemoved:true,newMembershipDraftCleared:true});
   });
  }
 }
 await record('End',{failures});if(failures.length)process.exitCode=1;
}finally{await browser.close();}

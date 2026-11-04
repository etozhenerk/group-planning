import {chromium} from '/Users/misha/Documents/Codex/projects/group-planning/node_modules/playwright/index.mjs';
import {expect} from '/Users/misha/Documents/Codex/projects/group-planning/node_modules/@playwright/test/index.mjs';
const b=await chromium.launch({headless:true}),p=await b.newPage({viewport:{width:390,height:874}}),errors=[];
p.on('pageerror',e=>errors.push(e.message));
for(const name of ['vibe','chat','info','settings','date','place','create','preparation']){
 for(const width of [320,390,402]){
 await p.setViewportSize({width,height:874});await p.goto('http://127.0.0.1:8797/nav-'+name+'/frame.html');
 const scope=['info','settings'].includes(name)?p.frameLocator('iframe'):p; const back=scope.locator('[data-page-back]').first();await back.waitFor({state:'attached'});const size=await back.boundingBox();expect(size.width).toBe(44);expect(size.height).toBe(44);expect(await back.textContent()).toBe('');expect(await back.getAttribute('aria-label')).toBeTruthy();expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 if(width===390)await p.screenshot({path:'/private/tmp/somewhere-navigation/'+name+'.png'});
 }console.log('BACK OK',name);
}
await p.goto('http://127.0.0.1:8797/nav-vibe/preview.html');await p.frameLocator('iframe').locator('[data-page-back]').waitFor();await p.locator('.ss-phone').screenshot({path:'/private/tmp/somewhere-navigation/phone.png'});
console.log('ERRORS',errors);expect(errors).toEqual([]);await b.close();

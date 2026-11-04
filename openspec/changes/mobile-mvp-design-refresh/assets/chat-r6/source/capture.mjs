import {chromium} from '/Users/misha/Documents/Codex/projects/group-planning/node_modules/playwright/index.mjs'
const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1000,height:1050}})
for(const [state,name] of [['ready','main'],['failed','error']]){await page.goto('http://127.0.0.1:8797/chat-r3/preview.html?state='+state);await page.frameLocator('iframe').getByRole('heading',{name:'Ужин в пятницу',exact:true}).waitFor();await page.waitForTimeout(200);await page.locator('.ss-phone').screenshot({path:'/private/tmp/somewhere-chat/r3-phone-'+name+'.png'})}
await browser.close()

import {chromium} from '/Users/misha/Documents/Codex/projects/group-planning/node_modules/playwright/index.mjs'
import {expect} from '/Users/misha/Documents/Codex/projects/group-planning/node_modules/@playwright/test/index.mjs'
const browser=await chromium.launch({headless:true}),errors=[],api=[]
const page=await browser.newPage({viewport:{width:390,height:844}})
page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(['fetch','xhr'].includes(request.resourceType()))api.push(request.url())})
const goto=async(state='ready')=>{await page.goto('http://127.0.0.1:8797/chat-r1/frame.html?state='+state);await page.getByRole('heading',{name:'Ужин в пятницу',exact:true}).waitFor().catch(()=>{});await page.waitForTimeout(180)}
for(const width of [320,390,402]){
 await page.setViewportSize({width,height:874});await goto()
 console.log('LAYOUT',width,await page.evaluate(()=>{const d=document.querySelector('[data-testid="chat-dock"]'),r=d.getBoundingClientRect(),s=getComputedStyle(d);return {overflow:document.documentElement.scrollWidth>innerWidth,dock:[r.x,r.right,r.bottom],radius:[s.borderTopLeftRadius,s.borderBottomLeftRadius],last:document.querySelectorAll('[data-testid="feed-message"]')[4]?.getBoundingClientRect().bottom}}))
 await page.screenshot({path:'/private/tmp/somewhere-chat/chat-'+width+'.png'})
}
await page.getByRole('textbox',{name:'Сообщение',exact:true}).fill('Буду вовремя!')
await page.getByRole('button',{name:'Отправить сообщение',exact:true}).click();await expect(page.getByTestId('message-bubble').filter({hasText:'Буду вовремя!'})).toHaveCount(1);await expect(page.locator('[data-delivery="sending"]')).toHaveCount(0)
await page.getByRole('textbox',{name:'Сообщение',exact:true}).fill('Черновик в чате');await page.reload();await expect(page.getByRole('textbox',{name:'Сообщение',exact:true})).toHaveValue('Черновик в чате');await page.getByRole('textbox',{name:'Сообщение',exact:true}).fill('')
await page.getByRole('button',{name:'Выбрать эмодзи'}).click();await page.waitForTimeout(250);await page.screenshot({path:'/private/tmp/somewhere-chat/emoji.png'});await page.getByRole('button',{name:'Вернуться к клавиатуре'}).click()
await page.getByRole('button',{name:'👍: 2',exact:true}).click();await expect(page.getByRole('button',{name:'👍: 3',exact:true})).toBeVisible()
await page.getByText('Прочитали 3',{exact:true}).click();await expect(page.getByTestId('readers-viewport')).toContainText('Дима');await page.getByRole('button',{name:'Закрыть',exact:true}).click()
await page.getByRole('button',{name:'Взять на себя',exact:true}).click();await page.screenshot({path:'/private/tmp/somewhere-chat/task.png'})
await page.getByRole('button',{name:'Добавить к встрече',exact:true}).click();await expect(page.getByRole('menuitem')).toHaveCount(5);await page.getByRole('menuitem',{name:'Предложить задачу',exact:true}).click();await page.getByRole('textbox',{name:'Что сделать'}).fill('Позвонить в кафе');await page.getByRole('button',{name:'Предложить задачу',exact:true}).click();await expect(page.getByRole('button',{name:'Подробности задачи «Позвонить в кафе»'})).toBeVisible()
await page.getByRole('button',{name:'Добавить к встрече',exact:true}).click();await page.getByRole('menuitem',{name:'Предложить дату',exact:true}).click();await page.waitForTimeout(300);console.log('POLL FORM',await page.getByRole('dialog').innerText());await page.screenshot({path:'/private/tmp/somewhere-chat/poll-form.png'});await page.getByRole('button',{name:'Создать опрос',exact:true}).click();await page.waitForTimeout(300);console.log('POLL CREATED',await page.locator('body').innerText())
for(const mode of ['poll','place','photo','failed','long','empty','error','denied','loading','unread']){await goto(mode);await page.screenshot({path:'/private/tmp/somewhere-chat/'+mode+'.png'});console.log('STATE',mode,(await page.locator('body').innerText()).slice(-700))}
console.log('ERRORS',errors,'API',api);await browser.close()

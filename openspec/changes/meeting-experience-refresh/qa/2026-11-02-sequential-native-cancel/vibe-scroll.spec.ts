import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { apiCreate, apiMeeting, login, writeHeaders } from '@tests/helpers';

test('direct vibe upload returns to the same real scrolled history, draft and selection', async ({page}, info) => {
  await login(page,'Саша');
  const created=await apiCreate(page,'Вайб и место в длинном разговоре');
  const id=created.meeting.id;
  const changed=await page.request.patch(`/api/v1/meetings/${id}`,{headers:await writeHeaders(page),data:{expected_revision:created.meeting.revision,starts_at:'2020-10-24T16:00:00Z',starts_on:'2020-10-24',timezone:'UTC'}});
  expect(changed.status()).toBe(200);
  await expect.poll(async()=>(await apiMeeting(page,id)).period).toBe('past');
  for(let n=0;n<30;n++){
    const key=randomUUID();
    const sent=await page.request.post(`/api/v1/meetings/${id}/messages`,{headers:await writeHeaders(page,key),data:{text:`История ${n}\nНесколько строк для контроля якоря\nПродолжение разговора`,client_request_id:key}});
    expect(sent.status()).toBe(201);
  }
  await page.goto(`/meetings/${id}`);
  const composer=page.getByLabel('Сообщение',{exact:true});
  await expect(composer).toBeVisible();
  await composer.fill('Вайб XX черновик');
  await composer.evaluate((input:HTMLTextAreaElement)=>input.setSelectionRange(5,7));
  const scroll=page.locator('[data-server-count]');
  await scroll.evaluate(el=>el.scrollTop=el.scrollHeight/2);
  await expect.poll(()=>scroll.evaluate(el=>el.scrollTop)).toBeGreaterThan(200);
  const capture=async(id?:string)=>scroll.evaluate((el,entry)=>{
    const top=el.getBoundingClientRect().top;
    const row=[...el.querySelectorAll<HTMLElement>('[data-entry-id]')].find(row=>entry?row.dataset.entryId===entry:row.getBoundingClientRect().bottom>top);
    if(!row)throw new Error('Visible anchor missing');
    return {id:row.dataset.entryId!,offset:row.getBoundingClientRect().top-top,scrollTop:el.scrollTop};
  },id);
  const before=await capture();
  await page.getByRole('link',{name:'Как всё прошло? Добавить фото',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Добавить фото в альбом',exact:true});
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button',{name:'Закрыть',exact:true}).click();
  await expect(page).toHaveURL(new RegExp(`/meetings/${id}$`));
  await expect(composer).toHaveValue('Вайб XX черновик');
  await expect.poll(async()=>Math.abs((await capture(before.id)).offset-before.offset)).toBeLessThanOrEqual(2);
  expect(await composer.evaluate((el:HTMLTextAreaElement)=>[el.selectionStart,el.selectionEnd])).toEqual([5,7]);
  await info.attach('scroll-before-after',{body:JSON.stringify({before,after:await capture(before.id)}),contentType:'application/json'});
  await page.screenshot({path:info.outputPath('chat-position-restored.png')});
});

import { test, expect } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { apiCreate, apiMeeting, login, writeHeaders } from '@tests/helpers';

test('empty vibe banner opens upload directly without chooser or intermediate album', async ({page}, info) => {
  await login(page, 'Саша');
  const created = await apiCreate(page, 'Прямое добавление фото — ' + info.project.name);
  const id = created.meeting.id;
  const changed = await page.request.patch(`/api/v1/meetings/${id}`, {
    headers: await writeHeaders(page),
    data: { expected_revision: created.meeting.revision, starts_at:'2020-10-24T16:00:00Z', starts_on:'2020-10-24', timezone:'UTC' },
  });
  expect(changed.status()).toBe(200);
  await expect.poll(async () => (await apiMeeting(page,id)).period).toBe('past');
  await page.goto(`/meetings/${id}`);
  const composer = page.getByLabel('Сообщение', {exact:true});
  await composer.fill('Вайб XX черновик');
  await composer.evaluate((input:HTMLTextAreaElement) => input.setSelectionRange(5,7));
  let choosers=0;
  page.on('filechooser',()=>choosers++);
  const banner=page.getByRole('link',{name:'Как всё прошло? Добавить фото',exact:true});
  await expect(banner).toBeVisible();
  const entry=await banner.getAttribute('href');
  expect(entry).toContain('action=upload');
  expect(entry).toContain('uploadOrigin=chat');
  const before=await page.evaluate(()=>history.length);
  await banner.click();
  await expect(page.getByRole('dialog',{name:'Добавить фото в альбом',exact:true})).toBeVisible();
  expect(choosers).toBe(0);
  expect(await page.evaluate(()=>history.length)).toBe(before+1);
  await page.screenshot({path:info.outputPath('direct-upload.png')});
  writeFileSync(info.outputPath('fixture.json'),JSON.stringify({id,url:new URL(`/meetings/${id}`,page.url()).toString(),entry,title:created.meeting.title}));
});

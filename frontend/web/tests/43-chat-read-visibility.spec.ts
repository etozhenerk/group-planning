import { test, expect } from '@playwright/test';
import { readChat, postMessage } from '@tests/helpers/readChat';

test('a tall message reads only its visible end after controlled foreground dwell', async ({
  page,
  browser,
}) => {
  const { meeting, friend, context, headers } = await readChat(
    page,
    browser,
    'Конец длинного сообщения',
  );

  const entry = await postMessage(
    page,
    meeting.id,
    headers,
    'Длинное сообщение\n'.repeat(120),
  );

  const writes: number[] = [];
  friend.on('request', (request) => {
    if (request.method() === 'PUT' && request.url().endsWith('/read-marker')) {
      writes.push(Date.now());
    }
  });
  await friend.bringToFront();
  await friend.goto(`/meetings/${meeting.id}`);
  const target = friend.locator(`[data-entry-id="${entry.id}"] [data-read-sequence]`);
  await expect(target).toBeVisible();
  const scroll = friend.locator('[data-server-count]');
  const hiddenEnd = await target.evaluate(
    (element) =>
      element.getBoundingClientRect().bottom >
      document.querySelector('[data-server-count]')!.getBoundingClientRect().bottom,
  );

  expect(hiddenEnd).toBe(true);
  await friend.waitForTimeout(750);
  expect(writes).toEqual([]);
  await page.bringToFront();
  const beforeControl = await friend.evaluate(() => ({
    visibility: document.visibilityState,
    focus: document.hasFocus(),
  }));

  await test.info().attach('headless-background-precondition', {
    body: JSON.stringify(beforeControl),
    contentType: 'application/json',
  });
  await friend.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await scroll.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await friend.waitForTimeout(750);
  expect(writes).toEqual([]);
  await friend.bringToFront();
  const foreground = Date.now();
  await friend.evaluate(() => {
    Reflect.deleteProperty(document, 'visibilityState');
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await friend.waitForTimeout(400);
  expect(writes).toEqual([]);
  await expect.poll(() => writes.length).toBe(1);
  expect(writes[0]! - foreground).toBeGreaterThanOrEqual(500);
  await context.close();
});

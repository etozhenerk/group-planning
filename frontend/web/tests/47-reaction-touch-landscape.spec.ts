import { expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { apiCreate, login, writeHeaders } from '@tests/helpers';

test.use({ hasTouch: true, isMobile: true, viewport: { width: 844, height: 390 } });

test('touch landscape can hold a message, scroll the full picker and tap a whole emoji', async ({
  page,
}) => {
  await login(page, 'Саша');
  const { meeting } = await apiCreate(page, 'Реакция в горизонтальном телефоне');
  const headers = await writeHeaders(page);

  for (let index = 0; index < 14; index++) {
    const key = randomUUID();
    const response = await page.request.post(`/api/v1/meetings/${meeting.id}/messages`, {
      headers: { ...headers, 'Idempotency-Key': key },
      data: { text: `История ${index}`, client_request_id: key },
    });

    expect(response.status()).toBe(201);
  }

  await page.goto(`/meetings/${meeting.id}`);
  expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true);
  const history = page.getByRole('list', { name: 'Разговор встречи' }).locator('..');
  const message = page
    .getByTestId('feed-message')
    .filter({ has: page.getByText('История 1', { exact: true }) });

  const target = message.getByTestId('message-actions');
  await history.evaluate((node) => node.scrollTo({ top: 0 }));
  await target.scrollIntoViewIfNeeded();
  await expect(target).toBeInViewport({ ratio: 1 });
  await expect
    .poll(() =>
      history.evaluate((node) => node.scrollHeight - node.scrollTop - node.clientHeight),
    )
    .toBeGreaterThan(390);
  const reading = await history.evaluate((node) => node.scrollTop);
  const rect = await target.boundingBox();

  if (!rect) {
    throw new Error('Message must have a visible bounding box');
  }

  const touch = await page.context().newCDPSession(page);
  await touch.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }],
  });
  const picker = page.getByRole('dialog', { name: 'Реакция', exact: true });
  await expect(picker).toBeVisible();
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await picker.getByRole('button', { name: 'Все эмодзи', exact: true }).tap();
  await picker.getByRole('searchbox', { name: 'Найти эмодзи' }).fill('пицца');
  const full = picker.locator('[data-reaction-expanded]');
  const before = await full.evaluate((node) => node.scrollTop);
  expect(
    await full.evaluate((node) => node.scrollHeight - node.clientHeight),
  ).toBeGreaterThan(0);
  const panel = await picker.boundingBox();

  if (!panel) {
    throw new Error('Picker must have a visible bounding box');
  }

  await page.screenshot({
    path: test.info().outputPath('touch-landscape-before-pan.png'),
  });
  const x = panel.x + panel.width / 2;
  const y = panel.y + 40;
  await touch.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x, y }],
  });

  for (let step = 1; step <= 5; step++) {
    await touch.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x, y: y - step * 18 }],
    });
    await page.waitForTimeout(40);
  }

  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect
    .poll(() => full.evaluate((node) => node.scrollTop))
    .toBeGreaterThan(before);
  const pizza = picker.getByRole('button', {
    name: 'Поставить реакцию: пицца',
    exact: true,
  });

  await expect(pizza).toBeInViewport({ ratio: 1 });
  await page.screenshot({
    path: test.info().outputPath('touch-landscape-after-pan.png'),
  });
  await pizza.tap();
  await expect(picker).toHaveCount(0);
  await expect(message.getByRole('button', { name: '🍕: 1', exact: true })).toBeVisible();
  expect(await history.evaluate((node) => node.scrollTop)).toBeCloseTo(reading);
  await touch.detach();
});

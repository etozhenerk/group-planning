import { test, expect } from '@playwright/test';
import { apiCreate, login, writeHeaders } from '@tests/helpers';

test('photo carousel removes one selection, retries one batch and preloads swipe images', async ({
  page,
}) => {
  await login(page, 'Саша');
  const { meeting } = await apiCreate(page, 'Карусель и предзагрузка');
  const id = meeting.id;
  const changed = await page.request.patch(`/api/v1/meetings/${id}`, {
    headers: await writeHeaders(page),
    data: {
      expected_revision: meeting.revision,
      starts_at: null,
      starts_on: '2026-10-01',
      timezone: 'UTC',
    },
  });

  expect(changed.ok()).toBe(true);
  await page.goto(`/meetings/${id}/memories?action=upload`);
  const dialog = page.getByRole('dialog', { name: 'Добавить фото в альбом' });
  const photos = await page.evaluate(() =>
    [
      [320, 1200],
      [500, 500],
      [1200, 320],
    ].map(([width, height], index) => {
      const canvas = document.createElement('canvas');
      canvas.width = width ?? 320;
      canvas.height = height ?? 320;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Canvas unavailable');
      }

      context.fillStyle = ['#aa7766', '#669977', '#7766aa'][index] ?? '#aa7766';
      context.fillRect(0, 0, canvas.width, canvas.height);

      return canvas.toDataURL('image/png').split(',')[1] ?? '';
    }),
  );

  await dialog.getByLabel('Выбрать фото', { exact: true }).setInputFiles(
    photos.map((data, index) => ({
      name: `${index}.png`,
      mimeType: 'image/png',
      buffer: Buffer.from(data, 'base64'),
    })),
  );
  await expect(dialog.locator('img')).toHaveCount(3);
  const geometry = await dialog.locator('ul').evaluate((element) => ({
    scroll: element.scrollWidth,
    width: element.clientWidth,
    tops: Array.from(element.querySelectorAll('li')).map(
      (item) => item.getBoundingClientRect().top,
    ),
  }));

  expect(geometry.scroll).toBeGreaterThan(geometry.width);
  expect(new Set(geometry.tops).size).toBe(1);
  await dialog.getByRole('button', { name: 'Убрать 1.png' }).click();
  await expect(dialog.locator('img')).toHaveCount(2);
  let puts = 0;
  let reserves = 0;
  const reads = new Map<string, number>();
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().endsWith('/media/uploads')) {
      reserves++;
    }

    if (
      request.method() === 'GET' &&
      request.url().includes('/media/') &&
      request.url().endsWith('/content')
    ) {
      reads.set(request.url(), (reads.get(request.url()) ?? 0) + 1);
    }
  });
  await page.route(`**/meetings/${id}/media/*/content`, async (route) => {
    if (route.request().method() === 'PUT' && ++puts === 1) {
      await route.fulfill({
        status: 503,
        json: { error: { code: 'unavailable', field_errors: {}, request_id: 'batch' } },
      });
    } else {
      await route.continue();
    }
  });
  await dialog.getByRole('button', { name: 'Добавить в альбом' }).click();
  await expect(dialog.getByRole('alert')).toBeVisible();
  await expect(dialog.locator('progress')).toHaveCount(0);
  await expect(dialog.locator('img')).toHaveCount(1);
  await dialog.getByRole('button', { name: 'Повторить отправку' }).click();
  await expect(dialog).not.toBeVisible();
  expect(puts).toBe(3);
  expect(reserves).toBe(2);
  const stack = page.getByRole('group', {
    name: 'Фото встречи. Листайте клавишами влево и вправо',
  });

  await expect(stack.locator('img')).toHaveCount(2);
  await expect.poll(() => reads.size).toBe(2);
  const readCount = [...reads.values()].reduce((sum, value) => sum + value, 0);
  await stack.getByRole('button', { name: /Открыть фото/ }).click();
  const viewer = page.getByRole('dialog', { name: 'Фото встречи', exact: true });
  await expect(viewer).toBeVisible();
  await expect(viewer.locator('img')).toHaveCSS('object-fit', 'contain');
  await viewer.getByRole('button', { name: 'Закрыть просмотр' }).click();
  await expect(viewer).not.toBeVisible();
  const box = await stack.boundingBox();

  if (!box) {
    throw new Error('Missing stack');
  }

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 - 140, box.y + box.height / 2, {
    steps: 8,
  });
  await page.mouse.up();
  await expect(page.getByText('2 / 2', { exact: true })).toBeVisible();
  await expect(viewer).not.toBeVisible();
  await stack.focus();
  await stack.press('ArrowLeft');
  await expect(page.getByText('1 / 2', { exact: true })).toBeVisible();
  await expect(stack.getByRole('status')).toHaveCount(0);
  expect([...reads.values()].reduce((sum, value) => sum + value, 0)).toBe(readCount);
});

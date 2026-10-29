import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { albumExportSchema } from '@/features/download-album/api/albumExportSchema';
import { archivePhotos, seedExportAlbum } from '@tests/helpers/albumExport';
import { login } from '@tests/helpers';

test('downloads every original in one native ZIP while later album pages are unavailable', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await login(page, 'Саша');
  const album = await seedExportAlbum(page, 103);
  await page.route(`**/api/v1/meetings/${album.id}/memories?limit=50&cursor=*`, (route) =>
    route.fulfill({ status: 503, json: { error: { code: 'unavailable' } } }),
  );
  await page.goto(`/meetings/${album.id}/memories`);
  const stack = page.getByRole('group', {
    name: 'Фото встречи. Листайте клавишами влево и вправо',
  });

  await expect(page.getByText('1 / 50 +', { exact: true })).toBeVisible();
  await stack.focus();
  await stack.press('ArrowRight');
  await expect(page.getByText('2 / 50 +', { exact: true })).toBeVisible();
  let fetchDownloads = 0;
  page.on('request', (request) => {
    if (
      request.url().endsWith('/download') &&
      ['fetch', 'xhr'].includes(request.resourceType())
    ) {
      fetchDownloads += 1;
    }
  });
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Скачать все фото', exact: true }).click();
  const download = await downloaded;
  expect(await download.failure()).toBeNull();
  const file = await download.path();
  expect(file).not.toBeNull();
  const entries = archivePhotos(await readFile(file ?? ''));
  expect(entries).toHaveLength(103);
  expect(entries.map((entry) => entry.hash).sort()).toEqual(album.hashes.sort());
  expect(fetchDownloads).toBe(0);
  await expect(
    page.getByRole('status').filter({ hasText: 'Скачивание началось' }),
  ).toBeVisible();
  await expect(page.getByText('2 / 50 +', { exact: true })).toBeVisible();
  await download.delete();
});

test('keeps album actions on one row across widths and photo geometry during preparation, cancellation and retry', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await login(page, 'Саша');
  const { id } = await seedExportAlbum(page);
  const base = `/api/v1/meetings/${id}/memories/exports`;
  let held = true;
  let fail = false;
  let exportId = '';
  let downloads = 0;
  page.on('download', () => downloads++);
  await page.route(`**${base}/*`, async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();

      return;
    }

    if (fail) {
      await route.fulfill({ status: 503, json: { error: { code: 'unavailable' } } });

      return;
    }

    const response = await route.fetch();
    const status = albumExportSchema.parse(await response.json());
    exportId = status.id;
    await route.fulfill({
      response,
      json: held ? { ...status, state: 'preparing' } : status,
    });
  });
  await page.goto(`/meetings/${id}/memories`);
  const add = page.getByRole('button', { name: 'Добавить фото', exact: true });
  const start = page.getByRole('button', { name: 'Скачать все фото', exact: true });
  await expect(start).toBeVisible();
  const actions = page.getByRole('group', { name: 'Действия с альбомом' });

  for (const width of [1440, 1280, 1024, 800, 740, 320]) {
    await page.setViewportSize({ width, height: 740 });
    await expect(actions).toHaveAttribute('data-mobile', width < 740 ? 'true' : 'false');
    await expect
      .poll(async () => {
        const upload = await add.boundingBox();
        const download = await start.boundingBox();

        return (
          upload !== null &&
          download !== null &&
          Math.abs(upload.y - download.y) < 1 &&
          Math.abs(upload.height - download.height) < 1 &&
          upload.x + upload.width < download.x &&
          download.x + download.width <= width
        );
      })
      .toBe(true);
  }

  const addBox = await add.boundingBox();
  const startBox = await start.boundingBox();
  expect(addBox).not.toBeNull();
  expect(startBox).not.toBeNull();
  expect(Math.abs((addBox?.y ?? 0) - (startBox?.y ?? 0))).toBeLessThan(1);
  expect(Math.abs((addBox?.width ?? 0) - (startBox?.width ?? 0))).toBeLessThan(1);
  expect(addBox?.height).toBe(startBox?.height);
  const stack = page.getByRole('group', {
    name: 'Фото встречи. Листайте клавишами влево и вправо',
  });

  const before = await stack.boundingBox();
  await start.click();
  const cancel = page.getByRole('button', { name: 'Отменить подготовку фотографий' });
  await expect(cancel).toBeVisible();
  await expect.poll(() => exportId).not.toBe('');
  expect(await stack.boundingBox()).toEqual(before);
  await cancel.click();
  await expect(start).toBeVisible();
  await expect
    .poll(async () => (await page.request.get(`${base}/${exportId}`)).status())
    .toBe(404);
  expect(downloads).toBe(0);
  fail = true;
  await start.click();
  await expect(page.getByRole('alert')).toContainText(
    'Не удалось подготовить фотографии. Попробуйте ещё раз.',
  );
  fail = false;
  held = false;
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Повторить скачивание всех фото' }).click();
  const download = await downloaded;
  expect(await download.failure()).toBeNull();
  expect(downloads).toBe(1);
  await download.delete();
});

test('empty album has no download and leaving preparation deletes its export without a late navigation', async ({
  page,
}) => {
  await login(page, 'Саша');
  const empty = await seedExportAlbum(page, 0);
  await page.goto(`/meetings/${empty.id}/memories`);
  await expect(page.getByText('Как всё прошло?', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Скачать все фото' })).toHaveCount(0);
  const { id } = await seedExportAlbum(page, 1);
  const base = `/api/v1/meetings/${id}/memories/exports`;
  let exportId = '';
  let downloads = 0;
  page.on('download', () => downloads++);
  await page.route(`**${base}/*`, async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();

      return;
    }

    const response = await route.fetch();
    const status = albumExportSchema.parse(await response.json());
    exportId = status.id;
    await route.fulfill({ response, json: { ...status, state: 'preparing' } });
  });
  await page.goto(`/meetings/${id}/memories`);
  await page.getByRole('button', { name: 'Скачать все фото' }).click();
  await expect.poll(() => exportId).not.toBe('');
  await page.getByRole('link', { name: /Прошедшие встречи/ }).click();
  await expect
    .poll(async () => (await page.request.get(`${base}/${exportId}`)).status())
    .toBe(404);
  expect(downloads).toBe(0);
  await page.goto(`/meetings/${id}/memories`);
  await expect(page.getByRole('button', { name: 'Скачать все фото' })).toBeVisible();
  await expect(page.getByText('Скачивание началось', { exact: true })).toHaveCount(0);
});

test('leaving after browser hand-off does not delete the archive or abort the browser download', async ({
  page,
}) => {
  await login(page, 'Саша');
  const { id, hashes } = await seedExportAlbum(page, 2);
  let deletes = 0;

  page.on('request', (request) => {
    if (request.method() === 'DELETE' && request.url().includes('/memories/exports/')) {
      deletes += 1;
    }
  });
  await page.goto(`/meetings/${id}/memories`);
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Скачать все фото' }).click();
  await expect(page.getByText('Скачивание началось', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: /Прошедшие встречи/ }).click();
  await expect(page).toHaveURL(/\/meetings\?view=list&period=past$/);
  const download = await downloaded;
  expect(await download.failure()).toBeNull();
  const path = await download.path();
  const entries = archivePhotos(await readFile(path ?? ''));
  expect(entries.map((entry) => entry.hash).sort()).toEqual(hashes.sort());
  expect(deletes).toBe(0);
  await download.delete();
});

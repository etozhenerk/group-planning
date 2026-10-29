import { expect, test } from '@playwright/test';
import { albumExportSchema } from '@/features/download-album/api/albumExportSchema';
import { seedExportAlbum } from '@tests/helpers/albumExport';
import { login, writeHeaders } from '@tests/helpers';

test('a real RSVP revocation during preparation closes access without downloading private photos', async ({
  page,
  browser,
}) => {
  await login(page, 'Саша');
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    baseURL: new URL(page.url()).origin,
    viewport: page.viewportSize(),
    isMobile: test.info().project.use.isMobile ?? false,
    hasTouch: test.info().project.use.hasTouch ?? false,
  });

  const guest = await context.newPage();

  try {
    await login(guest, 'Лена');
    const { id } = await seedExportAlbum(page, 2, async (created) => {
      const invitation = new URL(created.invitation_url).pathname.split('/').at(-1);
      const joined = await guest.request.put(`/api/v1/invitations/${invitation}/rsvp`, {
        headers: await writeHeaders(guest),
        data: { answer: 'going', expected_revision: '0' },
      });

      expect(joined.ok()).toBe(true);
    });

    let observed = false;
    let downloads = 0;
    guest.on('download', () => downloads++);
    await guest.route(`**/api/v1/meetings/${id}/memories/exports/*`, async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue();

        return;
      }

      const response = await route.fetch();

      if (!response.ok()) {
        await route.fulfill({ response });

        return;
      }

      const status = albumExportSchema.parse(await response.json());
      observed = true;
      await route.fulfill({ response, json: { ...status, state: 'preparing' } });
    });
    await guest.goto(`/meetings/${id}/memories`);
    await guest.getByRole('button', { name: 'Скачать все фото' }).click();
    await expect.poll(() => observed).toBe(true);
    const revoked = await guest.request.put(`/api/v1/meetings/${id}/rsvp`, {
      headers: await writeHeaders(guest),
      data: { answer: 'not_going', expected_revision: '1' },
    });

    expect(revoked.ok()).toBe(true);
    await expect(guest.getByText('Доступ к фото закрыт', { exact: true })).toBeVisible();
    await expect(guest.getByRole('button', { name: 'Скачать все фото' })).toHaveCount(0);
    expect(downloads).toBe(0);
  } finally {
    await context.close();
  }
});

test('a real expired session stops polling and returns to sign-in instead of starting a download', async ({
  page,
}) => {
  await login(page, 'Саша');
  const { id } = await seedExportAlbum(page, 1);
  let observed = false;
  let downloads = 0;
  page.on('download', () => downloads++);
  await page.route(`**/api/v1/meetings/${id}/memories/exports/*`, async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();

      return;
    }

    const response = await route.fetch();

    if (!response.ok()) {
      await route.fulfill({ response });

      return;
    }

    const status = albumExportSchema.parse(await response.json());
    observed = true;
    await route.fulfill({ response, json: { ...status, state: 'preparing' } });
  });
  await page.goto(`/meetings/${id}/memories`);
  await page.getByRole('button', { name: 'Скачать все фото' }).click();
  await expect.poll(() => observed).toBe(true);
  const logout = await page.request.post('/api/v1/auth/logout', {
    headers: await writeHeaders(page),
  });

  expect(logout.ok()).toBe(true);
  await expect(page.getByRole('button', { name: 'Войти через Яндекс ID' })).toBeVisible();
  expect(downloads).toBe(0);
});

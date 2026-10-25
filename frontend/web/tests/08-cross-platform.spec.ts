import { test, expect } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { create, inviteLink, login } from '@tests/helpers';

test('one meeting shared by web, iOS and Android', async ({ page, playwright }) => {
  const configPath = process.env.SOMEWHERE_CROSS_CONFIG;
  const progressPath = process.env.SOMEWHERE_CROSS_PROGRESS;
  test.skip(!configPath || !progressPath, 'Requires the shared native UI fixture');

  if (!configPath || !progressPath) {
    return;
  }

  test.setTimeout(600_000);
  const config = JSON.parse(await readFile(configPath, 'utf8')) as {
    origin: string;
    cases: Record<string, { token: string }>;
  };

  const credential = config.cases['invite-rsvp'];

  if (!credential) {
    throw new Error('Shared fixture is missing the iOS participant');
  }

  await login(page, 'Саша');
  const pixels = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 450;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Canvas unavailable');
    }

    context.fillStyle = '#258d80';
    context.fillRect(0, 0, 800, 450);
    context.fillStyle = '#e1b574';
    context.fillRect(0, 0, 270, 450);

    return canvas.toDataURL('image/png').split(',')[1] ?? '';
  });

  const id = await create(page, 'Встреча трёх платформ', {
    name: 'cross-cover.png',
    mimeType: 'image/png',
    buffer: Buffer.from(pixels, 'base64'),
  });

  const invitation = await inviteLink(page);
  await page.getByRole('link', { name: 'Открыть встречу', exact: true }).click();
  await page.getByLabel('Сообщение', { exact: true }).fill('Hello from web');
  await page.getByRole('button', { name: 'Отправить сообщение' }).click();
  await expect(page.getByText('Hello from web', { exact: true })).toBeVisible();
  await writeFile(progressPath, JSON.stringify({ id, invitation }), { mode: 0o600 });
  console.log('WEB: meeting created and first message sent');

  await expect(page.getByText('Hello from iOS', { exact: true })).toBeVisible({
    timeout: 240_000,
  });
  console.log('WEB: iOS message received without reload');
  await expect(page.getByText('Hello from Android', { exact: true })).toBeVisible({
    timeout: 240_000,
  });
  await expect(page.getByRole('heading', { name: 'Компания · 3' })).toBeVisible();
  console.log('WEB: Android message and three participants received without reload');
  await writeFile(`${progressPath}.messages`, 'ok');

  const client = await playwright.request.newContext({
    baseURL: config.origin,
    ignoreHTTPSErrors: true,
    extraHTTPHeaders: { Authorization: `Bearer ${credential.token}` },
  });

  try {
    await expect
      .poll(async () => (await client.get(`/api/v1/meetings/${id}/feed`)).status(), {
        timeout: 240_000,
      })
      .toBe(403);
    await expect(page.getByText('Не смогу', { exact: true })).toBeVisible();
    await expect(page.getByText('Hello from iOS', { exact: true })).toBeVisible();
    console.log('WEB: withdrawal updated; former participant API returns 403');
  } finally {
    await client.dispose();
  }
});

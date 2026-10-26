import { test, expect } from '@playwright/test';
import {
  actionSurface,
  apiCreate,
  apiMeeting,
  login,
  writeHeaders,
} from '@tests/helpers';
import { feedSchema } from '@/shared/api';

for (const width of [320, 390]) {
  test(`an immediate file choice closes to chat with one click at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await login(page, 'Саша');
    const { meeting } = await apiCreate(page, 'Быстрый выбор файла');
    await page.goto(`/meetings/${meeting.id}`);
    const message = page.getByLabel('Сообщение', { exact: true });
    await message.fill('Черновик под вложением');
    const before = await page.evaluate(() => history.length);
    const selected = new Promise<void>((resolve, reject) => {
      page.once('filechooser', (chooser) => {
        void chooser
          .setFiles({
            name: 'quick.txt',
            mimeType: 'text/plain',
            buffer: Buffer.from('План встречи'),
          })
          .then(resolve, reject);
      });
    });

    await page.getByRole('button', { name: 'Добавить к встрече' }).click();
    await page.getByRole('menuitem', { name: 'Файл', exact: true }).click();
    await selected;
    const preview = page.getByRole('dialog', { name: 'Отправить файл', exact: true });
    await expect(preview.getByLabel('Подпись к quick.txt')).toBeVisible();
    expect(await page.evaluate(() => history.length)).toBe(before + 1);
    await preview.getByRole('button', { name: 'Закрыть', exact: true }).click();
    await expect(preview).not.toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/meetings/${meeting.id}$`));
    await expect(message).toHaveValue('Черновик под вложением');
    await page.goForward();
    await expect(preview.getByLabel('Подпись к quick.txt')).toBeVisible();
  });
}

test('partial upload retries only the failed file and preserves the message draft', async ({
  page,
}) => {
  await login(page, 'Саша');
  const created = await apiCreate(page, 'Файлы в разговоре');
  const id = created.meeting.id;
  await page.goto(`/meetings/${id}`);
  await page.getByLabel('Сообщение', { exact: true }).fill('Документы к встрече');
  let uploads = 0;
  const reservations: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().endsWith('/media/uploads')) {
      reservations.push(request.headers()['idempotency-key'] ?? '');
    }
  });
  await page.route(`**/api/v1/meetings/${id}/media/*/content`, async (route) => {
    if (route.request().method() !== 'PUT') {
      await route.continue();

      return;
    }

    uploads++;

    if (uploads === 1) {
      await route.fulfill({
        status: 503,
        json: { error: { code: 'unavailable', field_errors: {}, request_id: 'test' } },
      });

      return;
    }

    await route.continue();
  });
  await page.getByRole('button', { name: 'Добавить к встрече' }).click();
  const fileChooser = page.waitForEvent('filechooser');
  await page.getByRole('menuitem', { name: 'Файл', exact: true }).click();
  await (
    await fileChooser
  ).setFiles([
    { name: 'plan.txt', mimeType: 'text/plain', buffer: Buffer.from('План встречи') },
    { name: 'list.txt', mimeType: 'text/plain', buffer: Buffer.from('Список покупок') },
  ]);
  const preview = actionSurface(page, 'Отправить файл');

  await preview.getByLabel('Подпись к plan.txt').fill('План на вечер');
  await preview.getByLabel('Подпись к list.txt').fill('Купим по дороге');
  await preview.getByRole('button', { name: 'Отправить', exact: true }).click();
  await expect(preview.getByText('Добавлено', { exact: true })).toHaveCount(1);
  await expect(
    preview.getByRole('button', { name: 'Повторить', exact: true }),
  ).toBeVisible();
  await preview.getByRole('button', { name: 'Повторить', exact: true }).click();
  await expect(preview.getByText('Добавлено', { exact: true })).toHaveCount(2);
  expect(uploads).toBe(3);
  expect(reservations).toHaveLength(2);
  await preview.getByRole('button', { name: 'Готово', exact: true }).click();
  await expect(page.getByLabel('Сообщение', { exact: true })).toHaveValue(
    'Документы к встрече',
  );
  await expect(
    page.getByTestId('feed-message').filter({ hasText: 'plan.txt' }),
  ).toHaveCount(1);
  await expect(
    page.getByTestId('feed-message').filter({ hasText: 'list.txt' }),
  ).toHaveCount(1);
  await expect(
    page.getByTestId('feed-message').filter({ hasText: 'plan.txt' }),
  ).toContainText('План на вечер');
  await expect(
    page.getByTestId('feed-message').filter({ hasText: 'list.txt' }),
  ).toContainText('Купим по дороге');
  const feed = feedSchema.parse(
    await (await page.request.get(`/api/v1/meetings/${id}/feed`)).json(),
  );

  expect(feed.entries.filter((entry) => entry.kind === 'message')).toHaveLength(2);
});

test('past meeting album stays separate from chat and supports grid, keyboard and browser Back', async ({
  page,
}) => {
  await login(page, 'Саша');
  const created = await apiCreate(page, 'Фото встречи');
  const id = created.meeting.id;
  const past = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);
  const changed = await page.request.patch(`/api/v1/meetings/${id}`, {
    headers: await writeHeaders(page),
    data: {
      expected_revision: created.meeting.revision,
      starts_at: null,
      starts_on: past,
      timezone: 'UTC',
    },
  });

  expect(changed.ok()).toBe(true);
  await expect.poll(async () => (await apiMeeting(page, id)).period).toBe('past');
  await page.goto(`/meetings/${id}`);
  await page.getByRole('link', { name: 'Как всё прошло? Добавить фото' }).click();
  await expect(page.getByRole('heading', { name: 'Как всё прошло?' })).toBeVisible();
  const photo = Buffer.from(
    await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('No canvas');
      }

      context.fillStyle = '#aa7766';
      context.fillRect(0, 0, 320, 240);

      return canvas.toDataURL('image/png').split(',')[1] ?? '';
    }),
    'base64',
  );

  const fileChooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Добавить фото', exact: true }).click();
  await (
    await fileChooser
  ).setFiles([
    { name: 'one.png', mimeType: 'image/png', buffer: photo },
    { name: 'two.png', mimeType: 'image/png', buffer: photo },
  ]);
  const preview = actionSurface(page, 'Добавить фото в альбом');

  await preview.getByRole('button', { name: 'Добавить в альбом' }).click();
  await expect(preview.getByText('Добавлено', { exact: true })).toHaveCount(2);
  await preview.getByRole('button', { name: 'Готово', exact: true }).click();
  await expect(preview).not.toBeVisible();
  const stack = page.getByRole('group', {
    name: 'Фото встречи. Листайте клавишами влево и вправо',
  });

  const bounds = await stack.boundingBox();

  if (!bounds) {
    throw new Error('Photo stack is unavailable');
  }

  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 24, y, { steps: 4 });
  await expect(stack).toHaveAttribute('data-dragging', 'true');
  await page.mouse.up();
  await expect(page.getByText('1 / 2', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('dialog', { name: 'Фото встречи', exact: true }),
  ).toHaveCount(0);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 120, y, { steps: 6 });
  await page.mouse.up();
  await expect(page.getByText('2 / 2', { exact: true })).toBeVisible();
  await stack.focus();
  await stack.press('ArrowRight');
  await expect(page.getByText('1 / 2', { exact: true })).toBeVisible();
  await stack.press('ArrowRight');
  await expect(page.getByText('2 / 2', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Показать сеткой' }).click();
  await page.getByRole('button', { name: 'Открыть фото 1', exact: true }).click();
  await expect(
    page.getByRole('dialog', { name: 'Фото встречи', exact: true }),
  ).toBeVisible();
  await expect(page.locator('body')).toHaveCSS('position', 'fixed');
  await page.keyboard.press('ArrowRight');
  await expect(
    page.getByRole('dialog', { name: 'Фото встречи', exact: true }),
  ).toContainText('2 / 2');
  await page.keyboard.press('ArrowLeft');
  await expect(
    page.getByRole('dialog', { name: 'Фото встречи', exact: true }),
  ).toContainText('1 / 2');
  await page.goBack();
  await expect(
    page.getByRole('dialog', { name: 'Фото встречи', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Показать стопкой' }).click();
  await expect(page.getByText('1 / 2', { exact: true })).toBeVisible();
  await expect(page.locator('body')).not.toHaveCSS('position', 'fixed');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await stack.focus();
  await stack.press('ArrowLeft');
  await expect(page.getByText('2 / 2', { exact: true })).toBeVisible();
  const feed = feedSchema.parse(
    await (await page.request.get(`/api/v1/meetings/${id}/feed`)).json(),
  );

  expect(feed.entries.filter((entry) => entry.kind === 'message')).toHaveLength(0);
  await page.screenshot({ path: 'test-results/refresh-album.png' });
});

test('closing the upload preserves files and captions until leaving the meeting', async ({
  page,
}) => {
  await login(page, 'Саша');
  const created = await apiCreate(page, 'Отмена вложения');
  await page.goto(`/meetings/${created.meeting.id}`);
  await page.getByLabel('Сообщение', { exact: true }).fill('Вернусь к этому тексту');
  let publications = 0;
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().endsWith('/publish')) {
      publications++;
    }
  });
  await page.getByRole('button', { name: 'Добавить к встрече' }).click();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('menuitem', { name: 'Файл', exact: true }).click();
  await (
    await chooser
  ).setFiles({
    name: 'cancel.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Отменённый файл'),
  });
  await page.getByLabel('Подпись к cancel.txt').fill('Не отправлять');
  await actionSurface(page, 'Отправить файл')
    .getByRole('button', { name: /^(Назад|Закрыть)$/ })
    .click();
  await expect(page.getByLabel('Сообщение', { exact: true })).toHaveValue(
    'Вернусь к этому тексту',
  );
  await page.goForward();
  await expect(page.getByRole('heading', { name: 'Отправить файл' })).toBeVisible();
  await expect(page.getByLabel('Подпись к cancel.txt')).toHaveValue('Не отправлять');
  await expect(
    page.getByRole('button', { name: 'Отправить', exact: true }),
  ).toBeEnabled();
  await page.reload();
  await expect(page.getByLabel('Подпись к cancel.txt')).toHaveCount(0);
  expect(publications).toBe(0);
});

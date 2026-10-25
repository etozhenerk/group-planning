import { createdSchema } from '@/shared/api';
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  apiCreate,
  apiMeeting,
  inviteLink,
  login,
  setDate,
  writeHeaders,
} from '@tests/helpers';

const photo = async (page: Page, color: string) => ({
  name: 'cover.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    await page.evaluate((fill) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1080;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Canvas unavailable');
      }

      context.fillStyle = fill;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#fbe4be';
      context.beginPath();
      context.arc(960, 540, 240, 0, Math.PI * 2);
      context.fill();

      return canvas.toDataURL('image/png').split(',')[1] ?? '';
    }, color),
    'base64',
  ),
});

const edit = async (page: Page) => {
  await expect(page.getByTestId('conversation-title')).toBeVisible();
  const details = page.getByRole('button', { name: 'Информация о встрече' });

  if (await details.isVisible()) {
    await details.click();
  }

  await page.getByRole('button', { name: 'Изменить настройки' }).click();

  return page.getByRole('dialog', { name: 'Настройки встречи' });
};

const imageColor = async (page: Page) => {
  const image = page.getByRole('img', { name: 'Обложка встречи', exact: true }).first();
  await expect(image).toBeVisible();
  await expect(image).toHaveAttribute('data-ready', 'true');

  return image.evaluate((node) => {
    if (!(node instanceof HTMLImageElement)) {
      throw new Error('Not an image');
    }

    const canvas = document.createElement('canvas');
    canvas.width = node.naturalWidth;
    canvas.height = node.naturalHeight;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('No pixels');
    }

    context.drawImage(node, 0, 0);

    return {
      width: node.naturalWidth,
      height: node.naturalHeight,
      rgb: [...context.getImageData(0, 0, 1, 1).data],
    };
  });
};

for (const width of [320, 390, 1440]) {
  test(`cover selection, validation, display and removal at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width, height: 900 });
    await login(page, 'Саша');
    await page.goto('/meetings/new');
    await page.getByLabel('Название', { exact: true }).fill(`Встреча с фото ${width}`);
    await setDate(page, '29.02.2028');
    const file = page.getByLabel('Выбрать фото', { exact: true });
    await file.setInputFiles(await photo(page, '#a13932'));
    const preview = page.getByRole('img', { name: 'Выбранная обложка' });
    await expect(preview).toBeVisible();
    const original = await preview.getAttribute('src');
    await file.setInputFiles([]);
    await expect(preview).toHaveAttribute('src', original ?? '');
    await file.setInputFiles({
      name: 'broken.png',
      mimeType: 'image/png',
      buffer: Buffer.from('not a photo'),
    });
    await expect(
      page.getByRole('alert').filter({ hasText: 'Не удалось открыть фото' }),
    ).toBeVisible();
    await expect(preview).toHaveAttribute('src', original ?? '');
    await expect(page.getByLabel('Название', { exact: true })).toHaveValue(
      `Встреча с фото ${width}`,
    );
    await page.screenshot({
      path: `test-results/cover-form-${width}.png`,
      animations: 'disabled',
      fullPage: true,
    });
    await page.getByRole('button', { name: 'Создать встречу', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Встреча создана' })).toBeVisible();
    const id = page.url().split('/').at(-2) ?? '';
    const invitation = await inviteLink(page);
    await page.goto(invitation);
    const pixels = await imageColor(page);
    expect(pixels.width).toBe(1600);
    expect(pixels.height).toBe(900);
    expect(pixels.rgb[0]).toBeGreaterThan(pixels.rgb[2] ?? 0);
    await page.screenshot({
      path: `test-results/cover-invitation-${width}.png`,
      animations: 'disabled',
      fullPage: true,
    });
    await page.goto(`/meetings/${id}`);
    let form = await edit(page);
    await form.getByLabel('Выбрать фото').setInputFiles(await photo(page, '#315fa1'));
    await expect(form.getByRole('img', { name: 'Выбранная обложка' })).toBeVisible();
    await form.getByRole('button', { name: 'Сохранить изменения' }).click();
    await expect(form).not.toBeVisible();
    await page.goto(invitation);
    const blue = await imageColor(page);
    expect(blue.rgb[2]).toBeGreaterThan(blue.rgb[0] ?? 0);
    await page.goto('/meetings');
    const card = page
      .getByTestId('meeting-card')
      .filter({ hasText: `Встреча с фото ${width}` });

    await expect(card.getByRole('img', { name: 'Обложка встречи' })).toBeVisible();
    await card.click();
    form = await edit(page);
    await form.getByRole('button', { name: 'Убрать фото' }).click();
    await expect(form.getByRole('img')).toHaveCount(0);
    await form.getByRole('button', { name: 'Сохранить изменения' }).click();
    await expect(form).not.toBeVisible();
    expect((await apiMeeting(page, id)).cover_url).toBeNull();
    await page.goto(invitation);
    await expect(page.getByTestId('meeting-cover')).toHaveCount(0);
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
  });
}

test('lost creation response preserves the prepared photo and key after reload', async ({
  page,
}) => {
  await login(page, 'Саша');
  await page.goto('/meetings/new');
  await page.getByLabel('Название', { exact: true }).fill('Фото без дубля');
  await setDate(page, '29.02.2028');
  await page.getByLabel('Выбрать фото').setInputFiles(await photo(page, '#a13932'));
  await expect(page.getByRole('img', { name: 'Выбранная обложка' })).toBeVisible();
  const keys: string[] = [];
  const bodies: (string | null)[] = [];
  await page.route('**/api/v1/meetings', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();

      return;
    }

    keys.push(route.request().headers()['idempotency-key'] ?? '');
    bodies.push(route.request().postData());

    if (keys.length === 1) {
      await route.fetch();
      await route.abort('connectionreset');
    } else {
      await route.continue();
    }
  });
  await page.getByRole('button', { name: 'Создать встречу', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Повторить отправку' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Убрать фото' })).toBeDisabled();
  await page.reload();
  await expect(page.getByLabel('Название', { exact: true })).toHaveValue(
    'Фото без дубля',
  );
  await expect(page.getByRole('img', { name: 'Выбранная обложка' })).toBeVisible();
  await expect(page.getByLabel('Название', { exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Повторить отправку' }).click();
  await expect(page.getByRole('heading', { name: 'Встреча создана' })).toBeVisible();
  expect(keys[1]).toBe(keys[0]);
  expect(bodies[1]).toBe(bodies[0]);
});

test('settings conflict retains chosen image and requires review before retry', async ({
  page,
}) => {
  await login(page, 'Саша');
  const { meeting } = await apiCreate(page, 'До конфликта');
  await page.goto(`/meetings/${meeting.id}`);
  const form = await edit(page);
  await form.getByLabel('Выбрать фото').setInputFiles(await photo(page, '#a13932'));
  await expect(form.getByRole('img', { name: 'Выбранная обложка' })).toBeVisible();
  const changed = await page.request.patch(`/api/v1/meetings/${meeting.id}`, {
    headers: await writeHeaders(page),
    data: { title: 'Название с другого устройства', expected_revision: meeting.revision },
  });

  expect(changed.status()).toBe(200);
  await form.getByRole('button', { name: 'Сохранить изменения' }).click();
  await expect(form.getByRole('region', { name: 'Обновлённые настройки' })).toContainText(
    'Название с другого устройства',
  );
  await expect(form.getByRole('img', { name: 'Выбранная обложка' })).toBeVisible();
  await expect(form.getByRole('button', { name: 'Сохранить изменения' })).toBeDisabled();
  await form.getByRole('button', { name: 'Продолжить с моими правками' }).click();
  await form.getByRole('button', { name: 'Сохранить изменения' }).click();
  await expect(form).not.toBeVisible();
  expect((await apiMeeting(page, meeting.id)).cover_url).toBeTruthy();
});

const createCovered = async (page: Page, title: string, tint: string) => {
  const file = await photo(page, tint);
  const response = await page.request.post('/api/v1/meetings', {
    headers: await writeHeaders(page),
    data: {
      title,
      starts_on: '2028-02-29',
      timezone: 'Europe/Moscow',
      cover: { media_type: file.mimeType, data: file.buffer.toString('base64') },
    },
  });

  expect(response.status()).toBe(201);

  return createdSchema.parse(await response.json());
};

test('two meeting cards retain their own pixels and a blank meeting has no photo', async ({
  page,
}) => {
  await login(page, 'Саша');
  const red = await createCovered(page, 'Красная обложка', '#a13932');
  const blue = await createCovered(page, 'Синяя обложка', '#315fa1');
  const blank = await page.request.post('/api/v1/meetings', {
    headers: await writeHeaders(page),
    data: { title: 'Без фото', starts_on: '2028-02-29', timezone: 'Europe/Moscow' },
  });

  expect(blank.status()).toBe(201);
  await page.goto('/meetings');

  for (const [title, url] of [
    [red.meeting.title, red.meeting.cover_url],
    [blue.meeting.title, blue.meeting.cover_url],
  ]) {
    const card = page.getByTestId('meeting-card').filter({ hasText: title ?? '' });
    const image = card.getByRole('img', { name: 'Обложка встречи' });
    await expect(image).toBeVisible();
    const bytes = await image.evaluate(async (node) =>
      node instanceof HTMLImageElement
        ? [...new Uint8Array(await (await fetch(node.src)).arrayBuffer())]
        : [],
    );

    const expected = await page.request.get(url ?? '');
    expect(Buffer.from(bytes)).toEqual(await expected.body());
  }

  await expect(
    page.getByTestId('meeting-card').filter({ hasText: 'Без фото' }).getByRole('img'),
  ).toHaveCount(0);
});

test('late private photo cannot reappear after RSVP revokes access', async ({
  page,
  browser,
}) => {
  await login(page, 'Саша');
  const created = await createCovered(page, 'Доступ к фото', '#a13932');
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const guest = await context.newPage();
  await login(guest, 'Лена');
  const invitation = new URL(created.invitation_url).pathname.replace(
    '/i/',
    '/api/v1/invitations/',
  );

  const joined = await guest.request.put(`${invitation}/rsvp`, {
    headers: await writeHeaders(guest),
    data: { answer: 'going', expected_revision: '0' },
  });

  expect(joined.status()).toBe(200);
  const latch = { release: () => {}, received: () => {} };
  const waiting = new Promise<void>((resolve) => {
    latch.release = resolve;
  });

  const started = new Promise<void>((resolve) => {
    latch.received = resolve;
  });

  await guest.route(`**/meetings/${created.meeting.id}/cover?*`, async (route) => {
    const response = await route.fetch();
    latch.received();
    await waiting;
    await route.fulfill({ response }).catch(() => undefined);
  });

  try {
    await guest.goto(`/meetings/${created.meeting.id}`);
    await started;
    await expect(guest.getByRole('status', { name: 'Загрузка фото' })).toBeVisible();
    await guest.getByRole('button', { name: 'Возможно', exact: true }).click();
    await expect(
      guest.getByRole('textbox', { name: 'Сообщение', exact: true }),
    ).toHaveCount(0);
    latch.release();
    await expect(guest.getByRole('img', { name: 'Обложка встречи' })).toHaveCount(0);
  } finally {
    latch.release();
    await context.close();
  }
});

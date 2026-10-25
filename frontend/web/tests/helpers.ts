import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { createdSchema, meetingSchema, sessionSchema } from '@/shared/api';

export const login = async (page: Page, who: 'Саша' | 'Лена') => {
  await page.goto('/meetings');
  await page.getByRole('button', { name: 'Войти через Яндекс ID' }).click();
  await page.getByRole('link', { name: `Войти как ${who}` }).click();
  await expect(page).toHaveURL(/\/meetings$/);
};

export const expectDate = async (page: Page, value: string) => {
  const compact = page.getByRole('button', { name: 'Дата', exact: true });

  if (await compact.isVisible()) {
    await expect(compact).toHaveAttribute('data-date', value);

    return;
  }

  const input = page.getByRole('combobox', { name: 'Дата', exact: true });
  await expect
    .poll(async () => (await input.inputValue()).replace(/[\u2066-\u2069]/g, ''))
    .toBe(value);
};

export const setDate = async (page: Page, value: string) => {
  const compact = page.getByRole('button', { name: 'Дата', exact: true });
  const mobile = await compact.isVisible();

  if (mobile) {
    await compact.click();
  }

  const input = page.getByRole(mobile ? 'textbox' : 'combobox', {
    name: 'Дата',
    exact: true,
  });

  const platform = await page.evaluate(() => {
    const browserNavigator = navigator as Navigator & {
      userAgentData?: { platform: string };
    };

    return browserNavigator.userAgentData?.platform ?? navigator.platform;
  });

  const selectAll = /^Mac/i.test(platform) ? 'Meta+a' : 'Control+a';
  const [day = '', month = '', year = ''] = value.split('.');
  await input.press(selectAll);
  await input.press('ArrowLeft');
  await input.pressSequentially(String(Number(day)));
  await input.press(selectAll);
  await input.press('ArrowRight');
  await input.pressSequentially(String(Number(month)));
  await input.press(selectAll);
  await input.press('ArrowRight');
  await input.press('ArrowRight');
  await input.pressSequentially(year);

  if (mobile) {
    await page.getByRole('button', { name: 'Готово', exact: true }).click();
  }

  await expectDate(page, value);
};

export const create = async (
  page: Page,
  title: string,
  cover?: { name: string; mimeType: string; buffer: Buffer },
) => {
  await page.goto('/meetings/new');
  await page.getByLabel('Название', { exact: true }).fill(title);
  await setDate(page, '24.10.2099');
  await page.getByRole('textbox', { name: 'Время', exact: true }).fill('19:00');
  await page.getByLabel(/^Место/).fill('Лофт «Квартал»');
  await page.getByLabel(/^Описание/).fill('Пицца и настольные игры.');

  if (cover) {
    await page.getByText('Обложка', { exact: true }).click();
    await page.getByLabel('Выбрать фото', { exact: true }).setInputFiles(cover);
    await expect(page.getByRole('img', { name: 'Выбранная обложка' })).toBeVisible();
  }

  await page.getByRole('button', { name: 'Создать встречу', exact: true }).click();
  await expect(page.getByLabel('Сообщение', { exact: true })).toBeVisible();
  const id = page.url().split('/').at(-1);

  if (!id) {
    throw new Error('Missing meeting ID');
  }

  return id;
};

export const inviteLink = async (page: Page): Promise<string> => {
  await page
    .getByRole('button', { name: 'Пригласить друзей', exact: true })
    .first()
    .click();
  const field = page.getByLabel('Ссылка приглашения');
  await expect(field).toBeVisible();
  const url = await field.inputValue();
  await page.keyboard.press('Escape');
  await expect(page.getByLabel('Сообщение', { exact: true })).toBeVisible();

  return url;
};

export const csrf = async (page: Page): Promise<string> => {
  const response = await page.request.get('/api/v1/me');
  const raw: unknown = await response.json();
  const session = sessionSchema.parse(raw);

  if (!session.csrf_token) {
    throw new Error('Missing CSRF');
  }

  return session.csrf_token;
};

export const writeHeaders = async (page: Page, key: string = randomUUID()) => {
  return {
    Origin: 'https://127.0.0.1:8444',
    'X-CSRF-Token': await csrf(page),
    'Idempotency-Key': key,
  };
};

export const apiMeeting = async (page: Page, id: string) => {
  const response = await page.request.get(`/api/v1/meetings/${id}`);
  const raw: unknown = await response.json();

  return meetingSchema.parse(raw);
};

export const apiCreate = async (
  page: Page,
  title: string,
  startsAt = '2099-10-24T19:00:00+03:00',
) => {
  const response = await page.request.post('/api/v1/meetings', {
    headers: await writeHeaders(page),
    data: { title, starts_at: startsAt, timezone: 'Europe/Moscow' },
  });

  const raw: unknown = await response.json();

  return createdSchema.parse(raw);
};

export const expectMessageSide = async (
  page: Page,
  text: string,
  side: 'left' | 'right',
) => {
  const message = page.getByTestId('feed-message').filter({ hasText: text });
  const [row, bubble, avatar] = await Promise.all([
    message.boundingBox(),
    message.getByTestId('message-bubble').boundingBox(),
    message.getByTestId('avatar').boundingBox(),
  ]);

  if (!row || !bubble || !avatar) {
    throw new Error('Message is not visible');
  }

  const edge = side === 'right' ? row.x + row.width : row.x;
  const avatarEdge = side === 'right' ? avatar.x + avatar.width : avatar.x;
  expect(Math.abs(edge - avatarEdge)).toBeLessThan(1);

  if (side === 'right') {
    expect(avatar.x).toBeGreaterThan(bubble.x + bubble.width);
  } else {
    expect(bubble.x).toBeGreaterThan(avatar.x + avatar.width);
  }

  expect(bubble.x).toBeGreaterThanOrEqual(row.x);
  expect(bubble.x + bubble.width).toBeLessThanOrEqual(row.x + row.width + 1);
};

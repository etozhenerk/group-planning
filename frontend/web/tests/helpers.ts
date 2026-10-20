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

export const create = async (page: Page, title: string) => {
  await page.goto('/meetings/new');
  await page.getByLabel('Название', { exact: true }).fill(title);
  await page.getByLabel('Дата и время', { exact: true }).fill('2026-10-24T19:00');
  await page.getByLabel(/^Место/).fill('Лофт «Квартал»');
  await page.getByLabel(/^Описание/).fill('Пицца и настольные игры.');
  await page.getByRole('button', { name: 'Создать встречу', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Встреча создана' })).toBeVisible();
  const id = page.url().split('/').at(-2);

  if (!id) {
    throw new Error('Missing meeting ID');
  }

  return id;
};

export const inviteLink = async (page: Page): Promise<string> => {
  await page.getByRole('button', { name: 'Пригласить друзей', exact: true }).click();
  const field = page.getByLabel('Ссылка приглашения');
  await expect(field).toBeVisible();
  const url = await field.inputValue();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Закрыть', exact: true })
    .click();

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

export const apiCreate = async (page: Page, title: string) => {
  const response = await page.request.post('/api/v1/meetings', {
    headers: await writeHeaders(page),
    data: { title, starts_at: '2026-10-24T19:00:00+03:00', timezone: 'Europe/Moscow' },
  });

  const raw: unknown = await response.json();

  return createdSchema.parse(raw);
};

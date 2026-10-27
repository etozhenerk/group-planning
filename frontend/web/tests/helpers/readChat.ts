import { expect } from '@playwright/test';
import type { Browser, Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { entrySchema } from '@/shared/api';
import { apiCreate, login, writeHeaders } from '@tests/helpers';

export const readChat = async (page: Page, browser: Browser, title: string) => {
  await login(page, 'Саша');
  const { meeting, invitation_url } = await apiCreate(page, title);
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    baseURL: new URL(page.url()).origin,
  });

  const friend = await context.newPage();
  await login(friend, 'Лена');
  const friendHeaders = await writeHeaders(friend);
  const token = new URL(invitation_url).pathname.split('/').at(-1)!;
  expect(
    (
      await friend.request.put(`/api/v1/invitations/${token}/rsvp`, {
        headers: friendHeaders,
        data: { answer: 'going', expected_revision: '0' },
      })
    ).status(),
  ).toBe(200);

  return { meeting, friend, context, friendHeaders, headers: await writeHeaders(page) };
};

export const postMessage = async (
  page: Page,
  id: string,
  headers: Record<string, string>,
  text: string,
) => {
  const key = randomUUID();
  const response = await page.request.post(`/api/v1/meetings/${id}/messages`, {
    headers: { ...headers, 'Idempotency-Key': key },
    data: { text, client_request_id: key },
  });

  expect(response.status()).toBe(201);
  const body: unknown = await response.json();

  return entrySchema.parse(body);
};

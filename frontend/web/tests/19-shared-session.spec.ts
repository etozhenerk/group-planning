import { test, expect } from '@playwright/test';
import type { Route } from '@playwright/test';
import { apiCreate, csrf, login, writeHeaders } from '@tests/helpers';
import { sessionSchema, responseSchema } from '@/shared/api';

test('two sessions of one profile share access and reject a stale join and message retry', async ({
  page,
  browser,
}) => {
  await login(page, 'Саша');
  const created = await apiCreate(page, 'Два устройства одного профиля');
  const base = `/api/v1/meetings/${created.meeting.id}`;
  const [firstContext, secondContext] = await Promise.all([
    browser.newContext({ ignoreHTTPSErrors: true }),
    browser.newContext({ ignoreHTTPSErrors: true }),
  ]);

  try {
    const first = await firstContext.newPage();
    const second = await secondContext.newPage();
    await login(first, 'Лена');
    await login(second, 'Лена');
    const firstSession = sessionSchema.parse(
      await (await first.request.get('/api/v1/me')).json(),
    );

    const secondSession = sessionSchema.parse(
      await (await second.request.get('/api/v1/me')).json(),
    );

    expect(firstSession.user.id).toBe(secondSession.user.id);
    expect(firstSession.csrf_token).not.toBe(secondSession.csrf_token);
    const joinKey = crypto.randomUUID();
    const invitePath = new URL(created.invitation_url).pathname.replace(
      '/i/',
      '/api/v1/invitations/',
    );

    const join = { answer: 'going', expected_revision: '0' };
    const joined = await first.request.put(`${invitePath}/rsvp`, {
      headers: await writeHeaders(first, joinKey),
      data: join,
    });

    expect(joined.status()).toBe(200);
    await first.goto(`/meetings/${created.meeting.id}`);
    await second.goto(`/meetings/${created.meeting.id}`);
    await expect(first.getByLabel('Сообщение', { exact: true })).toBeVisible();
    await expect(second.getByLabel('Сообщение', { exact: true })).toBeVisible();
    let pending: Route | undefined;
    let saved = false;
    await first.route(`**${base}/messages`, async (route) => {
      pending = route;
      const response = await route.fetch();
      expect(response.status()).toBe(201);
      saved = true;
    });
    await first.getByLabel('Сообщение', { exact: true }).fill('Единственное сообщение');
    await first.getByRole('button', { name: 'Отправить сообщение' }).click();
    await expect.poll(() => saved).toBe(true);
    const withdrawn = await second.request.put(`${base}/rsvp`, {
      headers: await writeHeaders(second),
      data: { answer: 'maybe', expected_revision: '1' },
    });

    expect(withdrawn.status()).toBe(200);
    await expect(first.getByRole('heading', { name: 'Переписка закрыта' })).toBeVisible({
      timeout: 10000,
    });
    await expect(second.getByRole('heading', { name: 'Переписка закрыта' })).toBeVisible({
      timeout: 10000,
    });
    const repeated = await first.request.put(`${invitePath}/rsvp`, {
      headers: await writeHeaders(first, joinKey),
      data: join,
    });

    expect(repeated.status()).toBe(200);
    expect(responseSchema.parse(await repeated.json()).can_access_feed).toBe(false);

    if (!pending) {
      throw new Error('Expected one pending message request');
    }

    const retry = await first.request.post(`${base}/messages`, {
      headers: {
        ...(await writeHeaders(first, pending.request().headers()['idempotency-key'])),
        'Content-Type': 'application/json',
      },
      data: pending.request().postData() ?? '',
    });

    expect(retry.status()).toBe(403);
    await pending.abort('failed');
    await expect(first.getByLabel('Сообщение', { exact: true })).toHaveCount(0);
    await expect(first.getByText('Единственное сообщение', { exact: true })).toHaveCount(
      0,
    );
    await page.goto(`/meetings/${created.meeting.id}`);
    await expect(page.getByText('Единственное сообщение', { exact: true })).toHaveCount(
      1,
    );
    await first.request.post('/api/v1/auth/logout', {
      headers: { Origin: new URL(first.url()).origin, 'X-CSRF-Token': await csrf(first) },
    });
    expect((await first.request.get('/api/v1/me')).status()).toBe(401);
    expect((await second.request.get('/api/v1/me')).status()).toBe(200);
  } finally {
    await Promise.all([firstContext.close(), secondContext.close()]);
  }
});

import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { entrySchema } from '@/shared/api';
import { apiCreate, create, login, writeHeaders } from '@tests/helpers';

test('a late confirmed reaction cannot restore the chat after real RSVP withdrawal', async ({
  page,
  browser,
}) => {
  await login(page, 'Саша');
  const created = await apiCreate(page, 'Отозванный доступ к реакциям');
  const id = created.meeting.id;
  const key = randomUUID();
  const sent = await page.request.post(`/api/v1/meetings/${id}/messages`, {
    headers: await writeHeaders(page, key),
    data: { text: 'Реакция с задержанным ответом', client_request_id: key },
  });

  expect(sent.status()).toBe(201);
  const entry = entrySchema.parse(await sent.json());
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    baseURL: new URL(page.url()).origin,
    viewport: page.viewportSize(),
    isMobile: test.info().project.use.isMobile ?? false,
    hasTouch: test.info().project.use.hasTouch ?? false,
  });

  const guest = await context.newPage();
  const latch = { release: () => {}, received: () => {} };
  const waiting = new Promise<void>((resolve) => {
    latch.release = resolve;
  });

  const started = new Promise<void>((resolve) => {
    latch.received = resolve;
  });

  try {
    await login(guest, 'Лена');
    const invitation = new URL(created.invitation_url).pathname.split('/').at(-1);
    const joined = await guest.request.put(`/api/v1/invitations/${invitation}/rsvp`, {
      headers: await writeHeaders(guest),
      data: { answer: 'going', expected_revision: '0' },
    });

    expect(joined.status()).toBe(200);
    const reaction = `/api/v1/meetings/${id}/messages/${entry.id}/reactions`;
    await guest.route(`**${reaction}`, async (route) => {
      if (route.request().method() !== 'PUT') {
        await route.continue();

        return;
      }

      const response = await route.fetch();
      expect(response.status()).toBe(200);
      latch.received();
      await waiting;
      await route.fulfill({ response }).catch(() => undefined);
    });
    await guest.goto(`/meetings/${id}`);
    await guest.getByTestId('message-actions').press('Enter');
    await guest.getByRole('button', { name: '👍', exact: true }).click();
    await started;
    await guest.getByRole('button', { name: 'Информация о встрече' }).click();
    await guest.getByRole('button', { name: 'Возможно', exact: true }).click();
    await expect(
      guest.getByRole('textbox', { name: 'Сообщение', exact: true }),
    ).toHaveCount(0);
    latch.release();
    await expect(guest.getByTestId('feed-message')).toHaveCount(0);
    await expect(guest.getByRole('button', { name: '👍: 1', exact: true })).toHaveCount(
      0,
    );
    const rejected = await guest.request.put(reaction, {
      headers: await writeHeaders(guest),
      data: { emoji: '👍', active: false },
    });

    expect(rejected.status()).toBe(403);
    await guest.evaluate(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        }),
    );
    await expect(guest.getByTestId('feed-message')).toHaveCount(0);
    await expect(guest.getByRole('button', { name: '👍: 1', exact: true })).toHaveCount(
      0,
    );
  } finally {
    latch.release();
    await context.close();
  }
});

test('public support receives a real reference and retries a lost response without duplication', async ({
  page,
}, info) => {
  await page.setExtraHTTPHeaders({
    'X-Somewhere-Test-Feedback-Scope': `support-retry-${info.project.name}`,
  });
  const keys: string[] = [];
  const references: string[] = [];
  await page.route('**/api/v1/support/feedback', async (route) => {
    keys.push(route.request().headers()['idempotency-key'] ?? '');
    const response = await route.fetch();
    expect(response.status()).toBe(201);
    const result = (await response.json()) as { reference: string };
    references.push(result.reference);

    if (references.length === 1) {
      await route.abort('failed');
    } else {
      await route.fulfill({ response });
    }
  });
  await page.goto('/support?kind=question');
  await page.getByLabel('Ваше сообщение').fill('Как добавить фотографии после встречи?');
  await page.getByRole('button', { name: 'Отправить сообщение ↗', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Не удалось отправить');
  await page.getByRole('button', { name: 'Отправить сообщение ↗', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Обращение принято' })).toBeVisible();
  expect(references).toHaveLength(2);
  expect(references[0]).toBe(references[1]);
  expect(keys[0]).toBe(keys[1]);
  await expect(page.getByText(`Номер ${references[0]}`)).toBeVisible();
});

test('failed reaction restores confirmed state and retries the same intent', async ({
  page,
}) => {
  await login(page, 'Саша');
  await create(page, 'Реакция с повтором');
  await page.getByLabel('Сообщение', { exact: true }).fill('Проверка реакции');
  await page.getByRole('button', { name: 'Отправить сообщение' }).click();
  await expect(page.getByText('Проверка реакции', { exact: true })).toBeVisible();
  const keys: string[] = [];
  await page.route('**/reactions', async (route) => {
    if (route.request().method() !== 'PUT') {
      await route.continue();

      return;
    }

    keys.push(route.request().headers()['idempotency-key'] ?? '');

    if (keys.length === 1) {
      await route.fulfill({
        status: 503,
        json: {
          error: { code: 'unavailable', field_errors: {}, request_id: 'reaction-test' },
        },
      });
    } else {
      await route.continue();
    }
  });
  await expect(
    page.getByTestId('feed-message').filter({ hasText: 'Проверка реакции' }),
  ).toHaveAttribute('data-delivery', 'accepted');
  await page.getByTestId('message-actions').press('Enter');
  await page.getByRole('button', { name: '❤️', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Не удалось сохранить. Повторить' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: '❤️: 1', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Не удалось сохранить. Повторить' }).click();
  await expect(page.getByRole('button', { name: '❤️: 1', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(keys).toHaveLength(2);
  expect(keys[0]).toBe(keys[1]);
});

import { test, expect } from '@playwright/test';
import { apiCreate, login } from '@tests/helpers';
import { feedSchema } from '@/shared/api';

test('durable draft survives reload and several offline intents retain independent ids', async ({
  page,
  context,
}) => {
  await login(page, 'Саша');
  const { meeting } = await apiCreate(page, 'Сохранение исходящих');
  await page.goto(`/meetings/${meeting.id}`);
  const input = page.getByLabel('Сообщение', { exact: true });
  await input.fill('Черновик после reload');
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          new Promise<number>((resolve, reject) => {
            const request = indexedDB.open('somewhere-private-chat', 1);
            request.onerror = () =>
              reject(request.error ?? new Error('IndexedDB failed'));
            request.onsuccess = () => {
              const db = request.result;
              const read = db.transaction('records').objectStore('records').count();
              read.onsuccess = () => {
                db.close();
                resolve(read.result);
              };
            };
          }),
      ),
    )
    .toBe(1);
  await page.reload();
  await expect(input).toHaveValue('Черновик после reload');
  await context.setOffline(true);
  await input.fill('Первое без сети');
  await page.getByRole('button', { name: 'Отправить сообщение' }).click();
  await expect(input).toHaveValue('');
  await input.fill('Второе без сети');
  await page.getByRole('button', { name: 'Отправить сообщение' }).click();
  await expect(input).toHaveValue('');
  await context.setOffline(false);
  await expect(
    page.getByTestId('feed-message').filter({ hasText: 'Первое без сети' }),
  ).toHaveCount(1);
  await expect(
    page.getByTestId('feed-message').filter({ hasText: 'Второе без сети' }),
  ).toHaveCount(1);
  await expect(
    page.getByTestId('feed-message').filter({ hasText: 'Второе без сети' }),
  ).toHaveAttribute('data-delivery', 'accepted');
  const feed = feedSchema.parse(
    await (await page.request.get(`/api/v1/meetings/${meeting.id}/feed?limit=50`)).json(),
  );

  const messages = feed.entries.filter((entry) => entry.kind === 'message');
  expect(messages.map((entry) => entry.payload.text)).toEqual([
    'Первое без сети',
    'Второе без сети',
  ]);
  expect(new Set(messages.map((entry) => entry.client_request_id)).size).toBe(2);
});

test('reload after server commit and lost ACK reconciles one message without dropping a new draft', async ({
  page,
}) => {
  await login(page, 'Саша');
  const { meeting } = await apiCreate(page, 'Потерянный ответ');
  await page.goto(`/meetings/${meeting.id}`);
  const input = page.getByLabel('Сообщение', { exact: true });
  let committed = false;
  await page.route(
    `**/meetings/${meeting.id}/messages`,
    async (route) => {
      const response = await route.fetch();
      expect(response.status()).toBe(201);
      committed = true;
      await route.abort('connectionreset');
    },
    { times: 1 },
  );
  await input.fill('Записано сервером один раз');
  await page.getByRole('button', { name: 'Отправить сообщение' }).click();
  await expect.poll(() => committed).toBe(true);
  await input.fill('Следующий черновик');
  await page.reload();
  await expect(input).toHaveValue('Следующий черновик');
  await expect(
    page.getByTestId('feed-message').filter({ hasText: 'Записано сервером один раз' }),
  ).toHaveCount(1);
  const feed = feedSchema.parse(
    await (await page.request.get(`/api/v1/meetings/${meeting.id}/feed?limit=50`)).json(),
  );

  expect(feed.entries.filter((entry) => entry.kind === 'message')).toHaveLength(1);
});

test('unavailable IndexedDB leaves the draft untouched and sends no POST', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'indexedDB', {
      configurable: true,
      value: {
        open: () => {
          throw new DOMException('Quota exceeded', 'QuotaExceededError');
        },
      },
    });
  });
  await login(page, 'Саша');
  const { meeting } = await apiCreate(page, 'Ошибка устройства');
  await page.goto(`/meetings/${meeting.id}`);
  const posts: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().endsWith('/messages')) {
      posts.push(request.url());
    }
  });
  const input = page.getByLabel('Сообщение', { exact: true });
  await input.fill('Этот текст нельзя потерять');
  await page.getByRole('button', { name: 'Отправить сообщение' }).click();
  await expect(input).toHaveValue('Этот текст нельзя потерять');
  await expect(
    page
      .getByRole('alert')
      .filter({ hasText: 'Не удалось сохранить сообщение на устройстве' }),
  ).toBeVisible();
  expect(posts).toEqual([]);
});

test('logout purges IndexedDB and stops a second tab from sending the previous user queue', async ({
  page,
  context,
}) => {
  await login(page, 'Саша');
  const { meeting } = await apiCreate(page, 'Две вкладки');
  await page.goto(`/meetings/${meeting.id}`);
  const second = await context.newPage();
  await second.goto(`/meetings/${meeting.id}`);
  await second.getByLabel('Сообщение', { exact: true }).fill('Приватный черновик');
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Выйти из аккаунта' }).click();
  await expect(second.getByLabel('Сообщение', { exact: true })).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          new Promise<number>((resolve, reject) => {
            const request = indexedDB.open('somewhere-private-chat', 1);
            request.onerror = () =>
              reject(request.error ?? new Error('IndexedDB failed'));
            request.onsuccess = () => {
              const db = request.result;
              const read = db.transaction('records').objectStore('records').count();
              read.onsuccess = () => {
                db.close();
                resolve(read.result);
              };
            };
          }),
      ),
    )
    .toBe(0);
  await second.close();
});

test('rejected intent retry keeps its key and restore never overwrites a newer draft', async ({
  page,
}) => {
  await login(page, 'Саша');
  const { meeting } = await apiCreate(page, 'Повтор и черновик');
  await page.goto(`/meetings/${meeting.id}`);
  const keys: (string | undefined)[] = [];
  await page.route(`**/meetings/${meeting.id}/messages`, async (route) => {
    keys.push(route.request().headers()['idempotency-key']);
    await route.fulfill({
      status: 422,
      contentType: 'application/json',
      body: JSON.stringify({ error: { code: 'validation_error' } }),
    });
  });
  const input = page.getByLabel('Сообщение', { exact: true });
  await input.fill('Сохранённое исходящее');
  await page.getByRole('button', { name: 'Отправить сообщение' }).click();
  const row = page
    .getByTestId('feed-message')
    .filter({ hasText: 'Сохранённое исходящее' });

  await expect(row).toHaveAttribute('data-delivery', 'rejected');
  await row.getByRole('button', { name: 'Повторить' }).click();
  await expect.poll(() => keys.length).toBe(2);
  expect(keys[0]).toBeTruthy();
  expect(keys[1]).toBe(keys[0]);
  await expect(row).toHaveAttribute('data-delivery', 'rejected');
  await input.fill('Новый черновик');
  await expect(row.getByRole('button', { name: 'Вернуть текст' })).toBeDisabled();
  await expect(input).toHaveValue('Новый черновик');
  await input.fill('');
  await row.getByRole('button', { name: 'Вернуть текст' }).click();
  await expect(input).toHaveValue('Сохранённое исходящее');
  await expect(row).toHaveCount(0);
});

for (const browserLocks of [true, false]) {
  test(
    browserLocks
      ? 'two tabs share one durable intent owner while its POST is in flight'
      : 'two tabs share one durable intent owner without Web Locks',
    async ({ page, context }) => {
      if (!browserLocks) {
        await context.addInitScript(() => {
          Object.defineProperty(navigator, 'locks', {
            configurable: true,
            value: undefined,
          });
        });
      }

      await login(page, 'Саша');
      const { meeting } = await apiCreate(page, 'Один владелец исходящего');
      await page.goto(`/meetings/${meeting.id}`);
      const second = await context.newPage();
      await second.goto(`/meetings/${meeting.id}`);
      await expect(second.getByLabel('Сообщение', { exact: true })).toBeVisible();
      let posts = 0;
      const gate: { release?: () => void } = {};
      await context.route(`**/meetings/${meeting.id}/messages`, async (route) => {
        posts += 1;
        await new Promise<void>((resolve) => {
          gate.release = resolve;
        });
        await route.continue();
      });
      await page
        .getByLabel('Сообщение', { exact: true })
        .fill('Общий intent двух вкладок');
      await page.getByRole('button', { name: 'Отправить сообщение' }).click();
      await expect.poll(() => posts).toBe(1);

      for (const target of [page, second]) {
        const row = target
          .getByTestId('feed-message')
          .filter({ hasText: 'Общий intent двух вкладок' });

        await expect(row).toHaveAttribute('data-delivery', /queued|sending/);
        await row.evaluate((element) =>
          element.setAttribute('data-before-ack', 'mounted'),
        );
      }

      await page.waitForTimeout(3_500);
      expect(posts).toBe(1);
      gate.release?.();

      for (const target of [page, second]) {
        await expect(
          target
            .getByTestId('feed-message')
            .filter({ hasText: 'Общий intent двух вкладок' }),
        ).toHaveAttribute('data-delivery', 'accepted');
        await expect(
          target
            .getByTestId('feed-message')
            .filter({ hasText: 'Общий intent двух вкладок' }),
        ).toHaveAttribute('data-before-ack', 'mounted');
      }

      expect(posts).toBe(1);
      const feed = feedSchema.parse(
        await (
          await page.request.get(`/api/v1/meetings/${meeting.id}/feed?limit=50`)
        ).json(),
      );

      expect(feed.entries.filter((entry) => entry.kind === 'message')).toHaveLength(1);
      await second.close();
    },
  );
}

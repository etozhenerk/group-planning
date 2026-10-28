import { test, expect } from '@playwright/test';
import { apiCreate, login } from '@tests/helpers';
import { feedSchema } from '@/shared/api';

test('reload releases a pending POST owner without waiting for its durable lease', async ({
  page,
}) => {
  await login(page, 'Саша');
  const { meeting } = await apiCreate(page, 'Смена владельца очереди');
  await page.goto(`/meetings/${meeting.id}`);
  const input = page.getByLabel('Сообщение', { exact: true });
  const gate: { release?: () => void } = {};
  const keys: (string | undefined)[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().endsWith('/messages')) {
      keys.push(request.headers()['idempotency-key']);
    }
  });
  await page.route(
    `**/meetings/${meeting.id}/messages`,
    async (route) => {
      await new Promise<void>((resolve) => {
        gate.release = resolve;
      });
      await route.abort('connectionreset').catch(() => undefined);
    },
    { times: 1 },
  );
  await input.fill('Сообщение незавершённой страницы');
  await page.getByRole('button', { name: 'Отправить сообщение' }).click();
  await expect.poll(() => keys.length).toBe(1);
  await input.fill('Отдельный новый черновик');
  await page.reload();
  gate.release?.();
  await expect(input).toHaveValue('Отдельный новый черновик');
  await expect.poll(() => keys.length).toBe(2);
  expect(keys[0]).toBeTruthy();
  expect(keys[1]).toBe(keys[0]);
  await expect(
    page
      .getByTestId('feed-message')
      .filter({ hasText: 'Сообщение незавершённой страницы' }),
  ).toHaveAttribute('data-delivery', 'accepted');
  const feed = feedSchema.parse(
    await (await page.request.get(`/api/v1/meetings/${meeting.id}/feed?limit=50`)).json(),
  );

  expect(feed.entries.filter((entry) => entry.kind === 'message')).toHaveLength(1);
});

test('a live legacy owner keeps its lease until expiry', async ({ page }) => {
  await login(page, 'Саша');
  const { meeting } = await apiCreate(page, 'Совместимость очереди');
  await page.goto(`/meetings/${meeting.id}`);
  const input = page.getByLabel('Сообщение', { exact: true });
  await input.fill('После прежнего владельца');
  await expect
    .poll(() =>
      page.evaluate(
        (meetingId) =>
          new Promise<boolean>((resolve, reject) => {
            const request = indexedDB.open('somewhere-private-chat', 1);
            request.onerror = () =>
              reject(request.error ?? new Error('IndexedDB failed'));
            request.onsuccess = () => {
              const db = request.result;
              const tx = db.transaction(['records', 'leases'], 'readwrite');
              const keys = tx.objectStore('records').getAllKeys();
              let found = false;
              keys.onsuccess = () => {
                const key = keys.result.find(
                  (value) => Array.isArray(value) && value[1] === meetingId,
                );

                if (key) {
                  found = true;
                  tx.objectStore('leases').put(
                    { owner: 'legacy-document', until: Date.now() + 2_000 },
                    key,
                  );
                }
              };

              tx.oncomplete = () => {
                db.close();
                resolve(found);
              };

              tx.onerror = () =>
                reject(tx.error ?? new Error('Lease transaction failed'));
            };
          }),
        meeting.id,
      ),
    )
    .toBe(true);
  let posts = 0;
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().endsWith('/messages')) {
      posts += 1;
    }
  });
  await page.getByRole('button', { name: 'Отправить сообщение' }).click();
  await page.waitForTimeout(500);
  expect(posts).toBe(0);
  await expect(
    page.getByTestId('feed-message').filter({ hasText: 'После прежнего владельца' }),
  ).toHaveAttribute('data-delivery', 'accepted');
  expect(posts).toBe(1);
});

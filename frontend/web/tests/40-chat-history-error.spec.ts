import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { apiCreate, login, writeHeaders } from '@tests/helpers';

test('history failure remains local and retry preserves composer and visible anchor', async ({
  page,
}) => {
  await login(page, 'Саша');
  const { meeting } = await apiCreate(page, 'Ошибка истории');
  const headers = await writeHeaders(page);

  for (let batch = 0; batch < 10; batch += 1) {
    await Promise.all(
      Array.from({ length: 10 }, (_, index) => {
        const key = randomUUID();

        return page.request.post(`/api/v1/meetings/${meeting.id}/messages`, {
          headers: { ...headers, 'Idempotency-Key': key },
          data: { text: `Запись ${batch * 10 + index}`, client_request_id: key },
        });
      }),
    );
  }

  await page.goto(`/meetings/${meeting.id}`);
  const scroll = page.locator('[data-server-count]');
  const composer = page.getByLabel('Сообщение', { exact: true });
  await expect(scroll).toBeVisible();
  await composer.fill('Черновик остаётся');
  await page.route(
    `**/meetings/${meeting.id}/feed?*before_sequence=*`,
    (route) =>
      route.fulfill({
        status: 503,
        json: {
          error: { code: 'unavailable', field_errors: {}, request_id: 'history-failure' },
        },
      }),
    { times: 1 },
  );
  await scroll.evaluate((element) => {
    element.scrollTop = 1;
  });
  await expect(page.getByRole('alert')).toContainText('Не удалось загрузить сообщения');
  await expect(composer).toHaveValue('Черновик остаётся');
  await expect(composer).toBeEditable();
  const capture = () =>
    scroll.evaluate((element) => {
      const top = element.getBoundingClientRect().top;
      const row = [...element.querySelectorAll<HTMLElement>('[data-entry-id]')].find(
        (row) =>
          row.dataset.protected !== 'true' && row.getBoundingClientRect().bottom > top,
      );

      return {
        id: row?.dataset.entryId,
        offset: (row?.getBoundingClientRect().top ?? top) - top,
      };
    });

  const before = await capture();
  const first = await scroll.getAttribute('data-window-first');
  await page
    .getByRole('alert')
    .getByRole('button', { name: 'Повторить', exact: true })
    .click();
  await expect.poll(() => scroll.getAttribute('data-window-first')).not.toBe(first);
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  const after = await scroll.evaluate((element, id) => {
    const row = element.querySelector<HTMLElement>(
      `[data-entry-id="${CSS.escape(id ?? '')}"]`,
    );

    return {
      id: row?.dataset.entryId,
      offset:
        (row?.getBoundingClientRect().top ?? 0) - element.getBoundingClientRect().top,
    };
  }, before.id);

  await test.info().attach('history-retry-anchor', {
    body: JSON.stringify({ before, after }),
    contentType: 'application/json',
  });
  expect(after.id).toBe(before.id);
  expect(Math.abs(after.offset - before.offset)).toBeLessThanOrEqual(2);
  await expect(composer).toHaveValue('Черновик остаётся');
});

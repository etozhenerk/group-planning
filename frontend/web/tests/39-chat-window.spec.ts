import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { apiCreate, login, writeHeaders } from '@tests/helpers';
import { recordAnchorDiagnostics } from '@tests/helpers/anchorDiagnostics';

test.afterEach(async ({ page }, info) => {
  await info.attach('anchor-diagnostics', {
    body: (await page.locator('html').getAttribute('data-anchor-diagnostics')) ?? '[]',
    contentType: 'application/json',
  });
});

test('bounded history preserves focus and visible anchor across prepend and late resize', async ({
  page,
  context,
  browser,
}) => {
  test.setTimeout(100_000);
  await recordAnchorDiagnostics(page);
  await login(page, 'Саша');
  const { meeting, invitation_url: invitation } = await apiCreate(
    page,
    'Ограниченное окно',
  );

  const headers = await writeHeaders(page);

  for (let batch = 0; batch < 72; batch += 1) {
    const responses = await Promise.all(
      Array.from({ length: 10 }, (_, index) => {
        const key = randomUUID();
        const number = batch * 10 + index;

        return page.request.post(`/api/v1/meetings/${meeting.id}/messages`, {
          headers: { ...headers, 'Idempotency-Key': key },
          data: {
            text: `История ${number}: ${'Переменная высота. '.repeat((number % 4) + 1)}`,
            client_request_id: key,
          },
        });
      }),
    );

    expect(responses.every((response) => response.status() === 201)).toBe(true);
  }

  await page.goto(`/meetings/${meeting.id}`);
  const scroll = page.locator('[data-server-count]');
  await expect(scroll).toBeVisible();
  await expect(page.getByTestId('feed-message').last()).toBeVisible();
  const focused = page.getByTestId('message-actions').last();
  await focused.focus();
  const focusedKey = await focused.evaluate((element) => {
    element.setAttribute('data-retained-focus', 'yes');

    return element.closest('[data-ui-key]')!.getAttribute('data-ui-key')!;
  });

  let maxRows = 0;

  for (let step = 0; step < 16; step += 1) {
    if ((await scroll.getAttribute('data-has-older')) === 'false') {
      break;
    }

    const before = await scroll.getAttribute('data-window-first');
    await scroll.evaluate((element) => {
      element.scrollTop = 1;
    });
    await expect.poll(() => scroll.getAttribute('data-window-first')).not.toBe(before);
    const count = Number(await scroll.getAttribute('data-server-count'));
    maxRows = Math.max(maxRows, count);
    expect(count).toBeLessThanOrEqual(500);
    expect(await page.locator('[data-entry-id]').count()).toBeLessThanOrEqual(201);
  }

  expect(maxRows).toBe(500);
  await expect(
    page.locator(`[data-ui-key="${focusedKey}"] [data-retained-focus]`),
  ).toBeAttached();
  expect(
    await page.evaluate(() =>
      document.activeElement?.getAttribute('data-retained-focus'),
    ),
  ).toBe('yes');
  await scroll.evaluate((element) => {
    element.scrollTop = element.scrollHeight / 2;
  });
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

  await page.waitForTimeout(150);
  const beforeResize = await capture();
  await page.setViewportSize({ width: 500, height: 700 });
  await page.waitForTimeout(200);
  const afterResize = await capture();
  expect(afterResize.id).toBe(beforeResize.id);
  expect(Math.abs(afterResize.offset - beforeResize.offset)).toBeLessThanOrEqual(2);
  const beforeReset = await capture();
  let reset = false;
  let around: string | null = null;
  page.on('request', (request) => {
    const url = new URL(request.url());

    if (url.pathname.endsWith('/sync') && url.searchParams.has('around_entry_id')) {
      around = url.searchParams.get('around_entry_id');
    }
  });
  await page.route(
    `**/meetings/${meeting.id}/sync?cursor=*`,
    async (route) => {
      reset = true;
      await route.fulfill({
        status: 410,
        json: {
          error: {
            code: 'sync_reset_required',
            field_errors: {},
            request_id: 'controlled-reset',
          },
        },
      });
    },
    { times: 1 },
  );
  await context.setOffline(true);
  await page.waitForTimeout(150);
  await context.setOffline(false);
  await expect.poll(() => reset).toBe(true);
  await expect.poll(() => around).toBe(beforeReset.id);
  await page.waitForTimeout(200);
  const afterReset = await capture();
  expect(afterReset.id).toBe(beforeReset.id);
  expect(Math.abs(afterReset.offset - beforeReset.offset)).toBeLessThanOrEqual(2);
  await page.getByLabel('Сообщение', { exact: true }).fill('Отправлено из истории');
  const beforeSend = await capture();
  await page.getByRole('button', { name: 'Отправить сообщение' }).click();
  await expect(page.getByLabel('Сообщение', { exact: true })).toHaveValue('');
  await expect(
    page.getByRole('button', { name: 'К новым сообщениям', exact: true }),
  ).toBeVisible();
  const afterSend = await capture();
  expect(afterSend.id).toBe(beforeSend.id);
  expect(Math.abs(afterSend.offset - beforeSend.offset)).toBeLessThanOrEqual(2);
  const friendContext = await browser.newContext({
    ignoreHTTPSErrors: true,
    baseURL: new URL(page.url()).origin,
  });

  const friend = await friendContext.newPage();
  await login(friend, 'Лена');
  const friendHeaders = await writeHeaders(friend);
  const token = new URL(invitation).pathname.split('/').at(-1)!;
  const joined = await friend.request.put(`/api/v1/invitations/${token}/rsvp`, {
    headers: friendHeaders,
    data: { answer: 'going', expected_revision: '0' },
  });

  expect(joined.status()).toBe(200);

  for (const text of ['Чужое новое первое', 'Чужое новое второе']) {
    const key = randomUUID();
    const response = await friend.request.post(
      `/api/v1/meetings/${meeting.id}/messages`,
      {
        headers: { ...friendHeaders, 'Idempotency-Key': key },
        data: { text, client_request_id: key },
      },
    );

    expect(response.status()).toBe(201);
  }

  await page.bringToFront();
  await expect(
    page.getByRole('button', { name: '2 новых сообщения', exact: true }),
  ).toBeVisible();
  const afterRemote = await capture();
  expect(afterRemote.id).toBe(beforeSend.id);
  expect(Math.abs(afterRemote.offset - beforeSend.offset)).toBeLessThanOrEqual(2);
  await friendContext.close();
  await page.getByRole('button', { name: '2 новых сообщения', exact: true }).click();
  await expect(
    page.getByTestId('feed-message').filter({ hasText: 'Отправлено из истории' }),
  ).toBeVisible();
  await expect(
    page.getByTestId('feed-message').filter({ hasText: 'Отправлено из истории' }),
  ).toHaveAttribute('data-delivery', 'accepted');
  await test.info().attach('bounded-window', {
    body: JSON.stringify({
      maxRows,
      focusedKey,
      beforeResize,
      afterResize,
      beforeReset,
      afterReset,
      beforeSend,
      afterSend,
    }),
    contentType: 'application/json',
  });
});

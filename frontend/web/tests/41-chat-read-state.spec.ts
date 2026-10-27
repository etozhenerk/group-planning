import { test, expect } from '@playwright/test';
import { readChat, postMessage } from '@tests/helpers/readChat';

test('read marker waits behind overlay; zero menu and live readers preserve focus', async ({
  page,
  browser,
}) => {
  const { meeting, friend, context, headers } = await readChat(
    page,
    browser,
    'Проверка прочтения',
  );

  const entry = await postMessage(page, meeting.id, headers, 'Сообщение для прочтения');
  await page.bringToFront();
  await page.goto(`/meetings/${meeting.id}`);
  const bubble = page
    .getByTestId('feed-message')
    .filter({ hasText: 'Сообщение для прочтения' });

  const action = bubble.getByTestId('message-actions');
  await expect(action).toBeVisible();
  await action.press('Enter');
  await expect(
    page.getByRole('button', { name: 'Кто прочитал', exact: true }),
  ).toBeVisible();
  await page.route(
    `**/messages/${entry.id}/readers?*`,
    (route) =>
      route.fulfill({
        status: 503,
        json: {
          error: { code: 'unavailable', field_errors: {}, request_id: 'read-test' },
        },
      }),
    { times: 1 },
  );
  await page.getByRole('button', { name: 'Кто прочитал', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Прочитали', exact: true });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Реакция', exact: true })).toHaveCount(0);
  await expect(dialog.getByText('Не удалось загрузить список')).toBeVisible();
  await dialog.getByRole('button', { name: 'Повторить', exact: true }).click();
  await expect(dialog.getByText('Пока никто не прочитал')).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('readers-empty.png') });
  await dialog.getByRole('button', { name: 'Закрыть', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(action).toBeFocused();
  await expect(bubble.getByRole('button', { name: /Прочитали/ })).toHaveCount(0);
  await friend.bringToFront();
  await friend.goto('/meetings');
  await expect(
    friend.getByLabel('1 непрочитанное сообщение', { exact: true }),
  ).toBeVisible();
  const next = await postMessage(page, meeting.id, headers, 'Личное обновление списка');
  await expect(
    friend.getByLabel('2 непрочитанных сообщения', { exact: true }),
  ).toBeVisible();
  const writes: string[] = [];
  friend.on('request', (request) => {
    if (request.method() === 'PUT' && request.url().endsWith('/read-marker')) {
      writes.push(request.postData() ?? '');
    }
  });
  await friend.goto(`/meetings/${meeting.id}`);
  await expect(friend.getByTestId('message-actions').last()).toBeVisible();
  await friend.getByRole('button', { name: 'Добавить к встрече', exact: true }).click();
  await expect(friend.getByRole('menu')).toBeVisible();
  await friend.waitForTimeout(750);
  expect(writes).toEqual([]);
  await friend.keyboard.press('Escape');
  await expect.poll(() => writes.length).toBeGreaterThan(0);
  const actual = await friend.request.get(`/api/v1/meetings/${meeting.id}/sync?limit=50`);
  const raw: unknown = await actual.json();
  expect(raw).toMatchObject({
    my_read_state: next.sequence,
    unread_count: '0',
    first_unread: null,
  });
  await page.bringToFront();
  await expect(
    bubble.getByRole('button', { name: 'Прочитали 1', exact: true }),
  ).toBeVisible();
  await bubble.getByRole('button', { name: 'Прочитали 1', exact: true }).click();
  await expect(dialog.getByText('Лена', { exact: true })).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('readers-ready.png') });
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(action).toBeFocused();
  await context.close();
});

import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import {
  apiCreate,
  apiMeeting,
  create,
  csrf,
  expectMessageSide,
  inviteLink,
  login,
  setDate,
  writeHeaders,
} from '@tests/helpers';

test('draft survives an error, back warns and dialog focus returns', async ({ page }) => {
  await login(page, 'Саша');
  await page.goto('/meetings/new');
  await page.getByLabel('Название', { exact: true }).fill('Черновик встречи');
  await page
    .getByRole('main')
    .getByRole('link', { name: 'Мои встречи', exact: true })
    .click();
  const dialog = page.getByRole('dialog', { name: 'Выйти из формы?' });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(page.getByLabel('Название', { exact: true })).toHaveValue(
    'Черновик встречи',
  );
  await page
    .getByRole('main')
    .getByRole('link', { name: 'Мои встречи', exact: true })
    .click();
  await dialog.getByRole('button', { name: 'Выйти', exact: true }).click();
  await expect(page).toHaveURL(/\/meetings$/);
  await page.goto('/meetings/new');
  await expect(page.getByLabel('Название', { exact: true })).toHaveValue(
    'Черновик встречи',
  );
  await setDate(page, '24.10.2026');
  await page.getByRole('textbox', { name: 'Время', exact: true }).fill('19:00');
  await page.getByRole('button', { name: 'Создать встречу', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Встреча создана' })).toBeVisible();
  const trigger = page.getByRole('button', { name: 'Пригласить друзей', exact: true });
  await trigger.click();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('clipboard disabled')) },
      configurable: true,
    });
  });
  await trigger.click();
  await page.getByRole('button', { name: 'Скопировать ссылку' }).click();
  await expect(page.getByRole('dialog')).toContainText('Скопируйте вручную', {
    ignoreCase: true,
  });
  await expect(page.getByLabel('Ссылка приглашения')).toBeEditable({ editable: false });
});

test('message retry after a lost response keeps its ID and confirms once', async ({
  page,
}) => {
  await login(page, 'Саша');
  const id = await create(page, 'Проверка отправки');
  await page.getByRole('link', { name: 'Открыть встречу', exact: true }).click();
  let posts = 0;
  const keys: string[] = [];
  await page.route(`**/api/v1/meetings/${id}/messages`, async (route) => {
    posts++;
    keys.push(route.request().headers()['idempotency-key'] ?? '');

    if (posts === 1) {
      await route.fetch();
      await route.abort('connectionreset');
    } else {
      await route.continue();
    }
  });
  await page.getByLabel('Сообщение', { exact: true }).fill('Повтор без дубля');
  await page.getByRole('button', { name: 'Отправить сообщение' }).click();
  await expect(page.getByRole('button', { name: 'Повторить отправку' })).toBeVisible();
  const pending = await page.getByTestId('pending-message').boundingBox();
  const pendingList = await page.getByTestId('pending-messages').boundingBox();

  if (!pending || !pendingList) {
    throw new Error('Failed message is not visible');
  }

  expect(
    Math.abs(pending.x + pending.width - pendingList.x - pendingList.width),
  ).toBeLessThan(1);
  await page.getByRole('button', { name: 'Повторить отправку' }).click();
  await expect(page.getByText('Повтор без дубля', { exact: true })).toHaveCount(1);
  expect(keys[0]).toBe(keys[1]);
  await expectMessageSide(page, 'Повтор без дубля', 'right');
  await page.reload();
  await expect(page.getByText('Повтор без дубля', { exact: true })).toHaveCount(1);
});

test('history and a stale settings form preserve authoritative state', async ({
  page,
}) => {
  await login(page, 'Саша');
  const id = await create(page, 'История и настройки');
  const headers = await writeHeaders(page);

  for (let n = 0; n < 58; n++) {
    const key = randomUUID();
    const response = await page.request.post(`/api/v1/meetings/${id}/messages`, {
      headers: { ...headers, 'Idempotency-Key': key },
      data: { text: `Запись истории ${n}`, client_request_id: key },
    });

    expect(response.status()).toBe(201);
  }

  await page.goto(`/meetings/${id}`);
  await expect(page.getByText('Запись истории 0', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Предыдущие записи' }).click();
  await expect(page.getByText('Запись истории 0', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Изменить настройки', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Настройки встречи' });
  await dialog.getByLabel('Название', { exact: true }).fill('Старая правка');
  const meeting = await apiMeeting(page, id);
  const changed = await page.request.patch(`/api/v1/meetings/${id}`, {
    headers,
    data: { title: 'Правка другого окна', expected_revision: meeting.revision },
  });

  expect(changed.status()).toBe(200);
  await dialog.getByRole('button', { name: 'Сохранить изменения' }).click();
  await expect(dialog.getByRole('alert')).toContainText('Данные изменились');
  await expect(dialog.getByLabel('Название', { exact: true })).toHaveValue(
    'Старая правка',
  );
  expect((await apiMeeting(page, id)).title).toBe('Правка другого окна');
});

test('a revoked session closes private content and keeps invitation entry', async ({
  page,
  browser,
}) => {
  await login(page, 'Саша');
  const created = await apiCreate(page, 'Сессия встречи');
  const url = created.invitation_url;
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const friend = await context.newPage();
  await friend.goto(url);
  await friend.getByRole('button', { name: 'Войти и ответить' }).click();
  await friend.getByRole('link', { name: 'Войти как Лена' }).click();
  await friend.getByRole('button', { name: 'Приду', exact: true }).click();
  await friend.getByRole('link', { name: 'Открыть встречу', exact: true }).click();
  await expect(friend.getByLabel('Сообщение', { exact: true })).toBeVisible();
  const logout = await friend.request.post('/api/v1/auth/logout', {
    headers: { Origin: 'https://127.0.0.1:8444', 'X-CSRF-Token': await csrf(friend) },
  });

  expect(logout.status()).toBe(204);
  await expect(friend.getByRole('button', { name: 'Войти через Яндекс ID' })).toBeVisible(
    { timeout: 10_000 },
  );
  await expect(friend.getByLabel('Сообщение', { exact: true })).toHaveCount(0);
  await friend.getByRole('button', { name: 'Войти через Яндекс ID' }).click();
  await friend.getByRole('link', { name: 'Войти как Лена' }).click();
  await expect(friend).toHaveURL(url);
  await context.close();
});

test('cancelled invitation sign-in stays on the invitation without an answer', async ({
  page,
}) => {
  await login(page, 'Саша');
  await create(page, 'Отмена входа');
  const url = await inviteLink(page);
  await page.locator('summary[aria-label^="Профиль:"]').click();
  await page.getByRole('button', { name: 'Выйти из аккаунта' }).click();
  await page.goto(url);
  await page.getByRole('button', { name: 'Войти и ответить' }).click();
  await page.getByRole('link', { name: 'Отменить вход' }).click();
  await expect(page).toHaveURL(/\/i\/.*auth_error=cancelled/);
  await expect(page.getByRole('status')).toContainText('Вход отменён');
  await expect(page.getByLabel('Сообщение', { exact: true })).toHaveCount(0);
});

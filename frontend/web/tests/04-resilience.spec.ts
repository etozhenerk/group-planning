import { expect, test } from '@playwright/test';
import {
  apiCreate,
  apiMeeting,
  csrf,
  expectDate,
  login,
  writeHeaders,
} from '@tests/helpers';

test('an offline message keeps its text and can be retried after reconnecting', async ({
  page,
  context,
}) => {
  await login(page, 'Саша');
  const created = await apiCreate(page, 'Без сети');
  await page.goto(`/meetings/${created.meeting.id}`);
  await expect(page.getByLabel('Сообщение', { exact: true })).toBeVisible();
  await context.setOffline(true);
  await page.getByLabel('Сообщение', { exact: true }).fill('Сообщение без сети');
  await page.getByRole('button', { name: 'Отправить сообщение' }).click();
  await expect(page.getByText('Сообщение без сети', { exact: true })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Повторить отправку' })).toBeVisible();
  await context.setOffline(false);
  await page.getByRole('button', { name: 'Повторить отправку' }).click();
  await expect(page.getByRole('button', { name: 'Повторить отправку' })).toHaveCount(0);
  await page.reload();
  await expect(page.getByText('Сообщение без сети', { exact: true })).toHaveCount(1);
});

test('a late message response cannot reopen access after a 403', async ({
  page,
  browser,
}) => {
  await login(page, 'Саша');
  const created = await apiCreate(page, 'Отозванный доступ');
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const friend = await context.newPage();
  await friend.goto(created.invitation_url);
  await friend.getByRole('button', { name: 'Войти и ответить' }).click();
  await friend.getByRole('link', { name: 'Войти как Лена' }).click();
  await friend.getByRole('button', { name: 'Приду', exact: true }).click();
  await friend.getByRole('link', { name: 'Открыть встречу', exact: true }).click();
  await expect(friend.getByLabel('Сообщение', { exact: true })).toBeVisible();
  const release: { response?: () => void } = {};
  const stored: { response?: () => void } = {};
  const messageStored = new Promise<void>((resolve) => {
    stored.response = resolve;
  });

  const responseReleased = new Promise<void>((resolve) => {
    release.response = resolve;
  });

  await friend.route(
    `**/api/v1/meetings/${created.meeting.id}/messages`,
    async (route) => {
      const response = await route.fetch();
      stored.response?.();
      await responseReleased;
      await route.fulfill({ response });
    },
  );
  await friend.getByLabel('Сообщение', { exact: true }).fill('Запоздалое подтверждение');
  await friend.getByRole('button', { name: 'Отправить сообщение' }).click();
  await messageStored;
  const leave = await friend.request.put(`/api/v1/meetings/${created.meeting.id}/rsvp`, {
    headers: {
      Origin: 'https://127.0.0.1:8444',
      'X-CSRF-Token': await csrf(friend),
      'Idempotency-Key': crypto.randomUUID(),
    },
    data: { answer: 'not_going', expected_revision: '1' },
  });

  expect(leave.status()).toBe(200);
  await expect(friend.getByRole('heading', { name: 'Переписка закрыта' })).toBeVisible({
    timeout: 10000,
  });
  release.response?.();
  await expect(friend.getByLabel('Сообщение', { exact: true })).toHaveCount(0);
  await expect(friend.getByText('Запоздалое подтверждение', { exact: true })).toHaveCount(
    0,
  );
  await expect(friend.getByRole('link', { name: 'Открыть приглашение' })).toBeVisible();
  await context.close();
});

test('editing text preserves seconds and the selected DST instant', async ({ page }) => {
  await login(page, 'Саша');
  const created = await apiCreate(page, 'Точное время');
  const id = created.meeting.id;
  const changeTime = await page.request.patch(`/api/v1/meetings/${id}`, {
    headers: await writeHeaders(page),
    data: {
      starts_at: '2026-11-01T01:30:37.123-05:00',
      timezone: 'America/New_York',
      expected_revision: created.meeting.revision,
    },
  });

  expect(changeTime.status()).toBe(200);
  const original = await apiMeeting(page, id);
  await page.goto(`/meetings/${id}`);
  await page.getByRole('button', { name: 'Изменить настройки', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Настройки встречи' });
  await expectDate(page, '01.11.2026');
  await expect(dialog.getByRole('textbox', { name: 'Время', exact: true })).toHaveValue(
    '01:30',
  );
  await dialog.getByRole('button', { name: 'Календарь', exact: true }).click();
  await expect(page.locator('.meeting-date-popup')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeVisible();
  await expect(page.locator('.meeting-date-popup')).not.toBeVisible();
  await dialog.getByLabel(/^Описание/).fill('Описание без изменения даты');
  await dialog.getByRole('button', { name: 'Сохранить изменения' }).click();
  await expect(dialog).not.toBeVisible();
  const updated = await apiMeeting(page, id);
  expect(updated.starts_at).toBe(original.starts_at);
  expect(updated.description).toBe('Описание без изменения даты');
});

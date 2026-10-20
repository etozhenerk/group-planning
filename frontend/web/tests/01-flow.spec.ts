import { test, expect } from '@playwright/test';
import {
  expectMessageSide,
  inviteLink,
  login,
  setDate,
  writeHeaders,
} from '@tests/helpers';
import { responseSchema } from '@/shared/api';

test('create, retry, invite, join, chat and revoke across two profiles', async ({
  page,
  browser,
}) => {
  await login(page, 'Саша');
  await expect(page.getByRole('heading', { name: 'С чего начнём?' })).toBeVisible();
  let creates = 0;
  const keys: string[] = [];
  await page.route('**/api/v1/meetings', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();

      return;
    }

    creates++;
    keys.push(route.request().headers()['idempotency-key'] ?? '');

    if (creates === 1) {
      await route.fetch();
      await route.abort('connectionreset');
    } else {
      await route.continue();
    }
  });
  await page.goto('/meetings/new');
  await page.getByLabel('Название', { exact: true }).fill('Суббота без спешки');
  await setDate(page, '24.10.2026');
  await page.getByRole('textbox', { name: 'Время', exact: true }).fill('19:00');
  await page.getByLabel(/^Место/).fill('Лофт «Квартал»');
  await page.getByLabel(/^Описание/).fill('Пицца и настольные игры.');
  await page.getByRole('button', { name: 'Создать встречу', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Не удалось');
  await expect(page.getByLabel('Название', { exact: true })).toHaveValue(
    'Суббота без спешки',
  );
  await page.getByRole('button', { name: 'Создать встречу', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Встреча создана' })).toBeVisible();
  expect(creates).toBe(2);
  expect(keys[0]).toBe(keys[1]);
  const id = page.url().split('/').at(-2);
  expect(id).toBeTruthy();
  const invitation = await inviteLink(page);
  const friendContext = await browser.newContext({
    ignoreHTTPSErrors: true,
    timezoneId: 'Europe/Moscow',
    locale: 'ru-RU',
  });

  const friend = await friendContext.newPage();
  await friend.goto(invitation);
  await expect(friend.getByRole('heading', { name: 'Суббота без спешки' })).toBeVisible();
  await expect(friend.getByText('Пицца и настольные игры.')).toBeVisible();
  await expect(friend.getByLabel('Сообщение', { exact: true })).toHaveCount(0);
  await friend.getByRole('button', { name: 'Войти и ответить' }).click();
  await friend.getByRole('link', { name: 'Войти как Лена' }).click();
  await expect(friend).toHaveURL(/\/(i|invitations)\//);
  const forbidden = await friend.request.get(`/api/v1/meetings/${id}/feed`);
  expect(forbidden.status()).toBe(403);
  let goingKey = '';
  friend.on('request', (request) => {
    if (
      request.method() === 'PUT' &&
      request.url().endsWith('/rsvp') &&
      goingKey === ''
    ) {
      goingKey = request.headers()['idempotency-key'] ?? '';
    }
  });
  await friend.getByRole('button', { name: 'Приду', exact: true }).click();
  await expect(friend.getByRole('status')).toContainText('Вы ответили «Приду»');
  await friend.getByRole('link', { name: 'Открыть встречу', exact: true }).click();
  await expect(friend.getByLabel('Сообщение', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Открыть встречу', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Компания · 2', exact: true }),
  ).toBeVisible();
  await page.getByLabel('Сообщение', { exact: true }).fill('Принесу настолки!');
  await page.getByRole('button', { name: 'Отправить сообщение' }).click();
  await expect(friend.getByText('Принесу настолки!', { exact: true })).toBeVisible({
    timeout: 10_000,
  });
  const plain = '<img src=x onerror="window.injected=true">';
  await friend.getByLabel('Сообщение', { exact: true }).fill(plain);
  await friend.getByRole('button', { name: 'Отправить сообщение' }).click();
  await expect(page.getByText(plain, { exact: true })).toBeVisible({ timeout: 10_000 });
  expect(await page.getByTestId('message-bubble').locator('img').count()).toBe(0);

  for (const width of [1440, 390, 320]) {
    for (const [viewer, ownText, otherText] of [
      [page, 'Принесу настолки!', plain],
      [friend, plain, 'Принесу настолки!'],
    ] as const) {
      await viewer.setViewportSize({ width, height: 900 });
      await expectMessageSide(viewer, ownText, 'right');
      await expectMessageSide(viewer, otherText, 'left');
      expect(
        await viewer.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
    }
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await friend.setViewportSize({ width: 1440, height: 900 });
  await friend.getByRole('button', { name: 'Возможно', exact: true }).click();
  await expect(friend.getByRole('heading', { name: 'Переписка закрыта' })).toBeVisible();
  await expect(friend.getByText('Принесу настолки!', { exact: true })).toHaveCount(0);
  const old = await friend.request.put(
    `/api/v1/invitations/${invitation.split('/').at(-1)}/rsvp`,
    {
      headers: await writeHeaders(friend, goingKey),
      data: { answer: 'going', expected_revision: '0' },
    },
  );

  const raw: unknown = await old.json();
  expect(responseSchema.parse(raw).can_access_feed).toBe(false);
  expect((await friend.request.get(`/api/v1/meetings/${id}/feed`)).status()).toBe(403);
  await friend.reload();
  await expect(friend.getByRole('heading', { name: 'Переписка закрыта' })).toBeVisible();
  await friend.getByRole('link', { name: 'Открыть приглашение' }).click();
  await expect(
    friend.getByRole('button', { name: 'Возможно', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await friend.getByRole('button', { name: 'Не смогу', exact: true }).click();
  await expect(friend.getByRole('status')).toContainText('Вы ответили «Не смогу»');
  await friend.getByRole('button', { name: 'Приду', exact: true }).click();
  await friend.getByRole('link', { name: 'Открыть встречу', exact: true }).click();
  await expect(friend.getByText('Принесу настолки!', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/flow-desktop.png', fullPage: true });
  await friend.setViewportSize({ width: 390, height: 844 });
  await friend.screenshot({ path: 'test-results/flow-mobile.png', fullPage: true });
  await friendContext.close();
});

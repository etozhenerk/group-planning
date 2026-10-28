import { test, expect } from '@playwright/test';
import { apiCreate, create, login, writeHeaders } from '@tests/helpers';
import { sessionSchema } from '@/shared/api';

test('new meeting goes directly to chat; composer panels preserve cursor and draft', async ({
  page,
}) => {
  await login(page, 'Саша');
  const id = await create(page, 'Новый разговор');
  await expect(page).toHaveURL(`/meetings/${id}`);
  await expect(page.getByRole('heading', { name: 'Позовём остальных?' })).toBeVisible();
  const input = page.getByLabel('Сообщение', { exact: true });
  await input.fill('Привет друзья');

  for (let step = 0; step < 6; step++) {
    await input.press('ArrowLeft');
  }

  await page.getByRole('button', { name: 'Выбрать эмодзи', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Найти эмодзи' }).fill('алое сердце');
  await page.getByRole('button', { name: /^(Вставить: )?алое сердце$/ }).click();
  await expect(input).toHaveValue('Привет ❤️друзья');
  await page.getByRole('button', { name: 'Добавить к встрече', exact: true }).click();
  await expect(page.getByRole('searchbox')).toHaveCount(0);
  await expect(page.getByRole('menuitem')).toHaveCount(5);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toHaveCount(0);
  await expect(input).toHaveValue('Привет ❤️друзья');
  await page.goto(`/meetings/${id}/created`);
  await expect(page).toHaveURL(`/meetings/${id}`);
  await page.screenshot({
    path: `test-results/refresh-chat-${test.info().project.name}.png`,
  });
});

test('profile distinguishes a failed request from missing contacts', async ({ page }) => {
  await login(page, 'Саша');
  const session = sessionSchema.parse(
    await (await page.request.get('/api/v1/me')).json(),
  );

  let failed = true;
  await page.route('**/api/v1/me/profile', async (route) => {
    if (failed) {
      await route.fulfill({
        status: 500,
        json: { error: { code: 'internal', field_errors: {}, request_id: 'test' } },
      });

      return;
    }

    await route.fulfill({
      json: {
        id: session.user.id,
        display_name: session.user.display_name,
        avatar_url: null,
        email: null,
        phone: null,
        provider: 'yandex',
      },
    });
  });
  await page.getByRole('link', { name: 'Профиль', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Не удалось загрузить профиль' }),
  ).toBeVisible();
  await expect(page.getByText('Не указан', { exact: true })).toHaveCount(0);
  failed = false;
  await page.getByRole('button', { name: 'Попробовать снова' }).click();
  await expect(page.getByText('Не указан', { exact: true })).toBeVisible();
  await expect(page.getByText('Не указана', { exact: true })).toBeVisible();
  await expect(page.getByRole('textbox')).toHaveCount(0);
  await page.screenshot({
    path: `test-results/refresh-profile-${test.info().project.name}.png`,
  });
});

test('support keeps input after error, retries the same request, and returns server reference', async ({
  page,
}) => {
  const requests: { key: string; body: unknown }[] = [];
  await page.route('**/api/v1/support/feedback', async (route) => {
    requests.push({
      key: route.request().headers()['idempotency-key'] ?? '',
      body: route.request().postDataJSON(),
    });
    await route.fulfill(
      requests.length === 1
        ? {
            status: 503,
            json: {
              error: { code: 'unavailable', field_errors: {}, request_id: 'test' },
            },
          }
        : {
            status: 201,
            json: {
              id: '12345678-1234-4234-8234-123456789012',
              reference: 'SW-TEST-42',
              status: 'accepted',
            },
          },
    );
  });
  await page.goto('/support?kind=idea&screen=meeting_chat');
  await page
    .getByLabel('Ваше сообщение')
    .fill('Предлагаю улучшить выбор фото в разговоре.');
  await page.getByRole('button', { name: 'Отправить сообщение ↗', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Не удалось отправить');
  await expect(page.getByLabel('Ваше сообщение')).toHaveValue(
    'Предлагаю улучшить выбор фото в разговоре.',
  );
  await page.getByRole('button', { name: 'Отправить сообщение ↗', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Обращение принято' })).toBeVisible();
  await expect(page.getByText('Номер SW-TEST-42')).toBeVisible();
  expect(requests[0]?.key).toBe(requests[1]?.key);
  expect(requests[0]?.body).toMatchObject({
    kind: 'idea',
    screen: 'meeting_chat',
    diagnostics: null,
    email: null,
    screenshot: null,
  });
  await page.goto('/privacy');
  await expect(page.getByText('Проект документа', { exact: true })).toBeVisible();
  await expect(page.getByText('Малахов Михаил Олегович', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Россия, законодательство Российской Федерации', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('smwhere@yandex.ru', { exact: true })).toBeVisible();
  await expect(page.getByText('Будет заполнено', { exact: true })).toHaveCount(0);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(await page.evaluate(() => innerWidth));
});

test('reaction toggle is confirmed by the API and persists on reload', async ({
  page,
}) => {
  await login(page, 'Саша');
  const created = await apiCreate(page, 'Реакция');
  await page.goto(`/meetings/${created.meeting.id}`);
  await page.getByLabel('Сообщение', { exact: true }).fill('Принесу чай');
  await page.getByRole('button', { name: 'Отправить сообщение' }).click();
  const row = page.getByTestId('feed-message').filter({ hasText: 'Принесу чай' });
  await expect(row).toBeVisible();
  await expect(row).toHaveAttribute('data-delivery', 'accepted');
  await row.getByTestId('message-actions').press('Enter');
  await page
    .getByRole('dialog', { name: 'Реакция', exact: true })
    .getByRole('button', { name: '👍', exact: true })
    .click();
  await expect(row.getByRole('button', { name: '👍: 1' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.reload();
  await expect(row.getByRole('button', { name: '👍: 1' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await row.getByRole('button', { name: '👍: 1' }).press('Shift+F10');
  await expect(
    page.getByRole('dialog', { name: 'Кто отреагировал', exact: true }),
  ).toContainText('Саша');
  await page.keyboard.press('Escape');
  await row.getByRole('button', { name: '👍: 1' }).click();
  await expect(row.getByRole('button', { name: '👍: 1' })).toHaveCount(0);
});

test('one hour cutoff is reflected after server refresh without losing current members', async ({
  page,
  browser,
}) => {
  await login(page, 'Саша');
  const created = await apiCreate(page, 'Отсечка');
  const changed = await page.request.patch(`/api/v1/meetings/${created.meeting.id}`, {
    headers: await writeHeaders(page),
    data: {
      expected_revision: created.meeting.revision,
      starts_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      starts_on: new Date().toISOString().slice(0, 10),
      timezone: 'UTC',
    },
  });

  expect(changed.ok()).toBe(true);
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const guest = await context.newPage();
  await login(guest, 'Лена');
  await guest.goto(new URL(created.invitation_url).pathname);
  await expect(guest.getByRole('button', { name: 'Приду', exact: true })).toBeDisabled();
  await expect(
    guest.getByText('Участие закрыто за час до начала встречи.'),
  ).toBeVisible();
  await page.goto(`/meetings/${created.meeting.id}`);
  await expect(page.getByLabel('Сообщение', { exact: true })).toBeVisible();
  await context.close();
});

test('private profile displays provider fields without inventing a birth year', async ({
  page,
}) => {
  await login(page, 'Саша');
  const session = sessionSchema.parse(
    await (await page.request.get('/api/v1/me')).json(),
  );

  await page.route('**/api/v1/me/profile', (route) =>
    route.fulfill({
      json: {
        id: session.user.id,
        display_name: 'Саша',
        avatar_url: null,
        email: 'sasha@example.com',
        phone: null,
        provider: 'yandex',
        login: 'sasha',
        first_name: 'Александр',
        last_name: 'Иванов',
        birthday: '0000-12-23',
        sex: 'male',
      },
    }),
  );
  await page.goto('/profile');
  const details = page.getByRole('region', { name: 'Личные данные' });
  await expect(details).toContainText('sasha');
  await expect(details).toContainText('Александр');
  await expect(details).toContainText('Иванов');
  await expect(details.getByText('23 декабря', { exact: true })).toBeVisible();
  await expect(details).toContainText('Мужской');
  await expect(details.getByRole('textbox')).toHaveCount(0);
});

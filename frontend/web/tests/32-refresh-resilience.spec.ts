import { test, expect } from '@playwright/test';
import { create, login } from '@tests/helpers';

test('public support receives a real reference and retries a lost response without duplication', async ({
  page,
}) => {
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

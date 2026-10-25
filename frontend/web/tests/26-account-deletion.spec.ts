import { expect, test } from '@playwright/test';
import { login } from '@tests/helpers';
import type { Page } from '@playwright/test';

const openDeletion = async (page: Page) => {
  await page.getByRole('link', { name: 'Профиль', exact: true }).click();
  await page.getByRole('button', { name: 'Удалить аккаунт', exact: true }).click();

  return page.getByRole('dialog', { name: 'Удалить аккаунт?' });
};

test('confirmation explains consequences, cancels without a request, and adapts to narrow screens', async ({
  page,
}) => {
  await login(page, 'Саша');
  let deletions = 0;
  page.on('request', (request) => {
    if (request.method() === 'DELETE') {
      deletions++;
    }
  });
  const dialog = await openDeletion(page);
  await expect(dialog).toContainText('Встречи без таких участников удалятся.');
  await expect(dialog).toContainText('Удалённый аккаунт');
  await expect(dialog).toHaveCSS('opacity', '1');
  await expect(
    dialog.getByRole('button', { name: 'Удалить аккаунт', exact: true }),
  ).toHaveCSS('background-color', 'rgb(255, 184, 178)');
  await page.screenshot({ path: 'test-results/account-deletion-wide.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/account-deletion-narrow.png' });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Удалить аккаунт', exact: true }),
  ).toBeFocused();
  expect(deletions).toBe(0);
  expect((await page.request.get('/api/v1/me')).status()).toBe(200);
});

test('lost deletion response survives reload and repeats the same operation', async ({
  page,
}) => {
  await login(page, 'Саша');
  await page.evaluate(() => {
    sessionStorage.setItem('meeting-calendar:private-test', 'private selection');
    sessionStorage.setItem('somewhere-draft:private-test', 'private draft');
  });
  const tokens: string[] = [];
  await page.route('**/api/v1/me', async (route) => {
    if (route.request().method() !== 'DELETE') {
      await route.continue();

      return;
    }

    tokens.push(route.request().headers()['x-deletion-token'] ?? '');
    const response = await route.fetch();
    expect(response.status()).toBe(204);

    if (tokens.length === 1) {
      await route.abort('failed');
    } else {
      await route.fulfill({ response });
    }
  });
  const dialog = await openDeletion(page);
  await dialog.getByRole('button', { name: 'Удалить аккаунт', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText(
    'Не удалось подтвердить удаление',
  );
  await page.reload();
  await expect(dialog).toBeVisible();
  await expect(page.getByText('Аккаунт удалён', { exact: true })).not.toBeVisible();
  await dialog.getByRole('button', { name: 'Повторить', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Аккаунт удалён');
  await expect(page).toHaveURL(/\/$/);
  expect(tokens).toHaveLength(2);
  expect(tokens[0]).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(tokens[1]).toBe(tokens[0]);
  expect(
    await page.evaluate(() => sessionStorage.getItem('somewhere-account-deletion')),
  ).toBeNull();
  expect(
    await page.evaluate(() => sessionStorage.getItem('meeting-calendar:private-test')),
  ).toBeNull();
  expect(
    await page.evaluate(() => sessionStorage.getItem('somewhere-draft:private-test')),
  ).toBeNull();
  expect((await page.request.get('/api/v1/me')).status()).toBe(401);
});

test('expired session is not reported as deleted', async ({ page }) => {
  await login(page, 'Лена');
  await page.route('**/api/v1/me', async (route) => {
    if (route.request().method() === 'DELETE') {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'unauthenticated',
            field_errors: {},
            request_id: '00000000-0000-4000-8000-000000000001',
          },
        }),
      });
    } else {
      await route.continue();
    }
  });
  const dialog = await openDeletion(page);
  await dialog.getByRole('button', { name: 'Удалить аккаунт', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('Сессия закончилась');
  await expect(page.getByText('Аккаунт удалён', { exact: true })).not.toBeVisible();
});

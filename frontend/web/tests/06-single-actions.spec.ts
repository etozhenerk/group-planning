import { test, expect } from '@playwright/test';
import { apiCreate, login } from '@tests/helpers';

for (const width of [320, 1440]) {
  test(`one create action in every list state at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await login(page, 'Саша');
    await apiCreate(page, `Единственное действие ${width}`);
    let state: 'loading' | 'empty' | 'error' | 'loaded' = 'loading';
    const deferred: { release?: () => void } = {};
    const ready = new Promise<void>((resolve) => {
      deferred.release = resolve;
    });

    await page.route('**/api/v1/meetings?*', async (route) => {
      if (state === 'loading') {
        await ready;
      }

      if (state === 'error') {
        await route.abort('failed');
      } else if (state === 'loaded') {
        await route.continue();
      } else {
        await route.fulfill({ json: { meetings: [], next_cursor: null } });
      }
    });
    await page.goto('/meetings');
    const create = page.getByRole('link', { name: 'Создать встречу', exact: true });
    const header = page.getByTestId('page-heading');
    await expect(page.getByRole('heading', { name: 'Загружаем встречи…' })).toBeVisible();
    await expect(create).toHaveCount(1);
    await expect(header.getByRole('link', { name: 'Создать встречу' })).toBeVisible();
    state = 'empty';
    deferred.release?.();
    await expect(page.getByRole('heading', { name: 'С чего начнём?' })).toBeVisible();
    await expect(create).toHaveCount(1);
    await expect(header.getByRole('link', { name: 'Создать встречу' })).toHaveCount(0);
    await expect(page.getByTestId('home-empty').getByRole('link')).toBeVisible();
    await page.screenshot({
      path: `test-results/home-empty-${width}.png`,
      fullPage: true,
    });
    state = 'error';
    await page.reload();
    await expect(
      page.getByRole('heading', { name: 'Не удалось получить встречи' }),
    ).toBeVisible();
    await expect(create).toHaveCount(1);
    await expect(header.getByRole('link', { name: 'Создать встречу' })).toBeVisible();
    state = 'loaded';
    await page.reload();
    await expect(page.getByTestId('meeting-card').first()).toBeVisible();
    await expect(create).toHaveCount(1);
    await expect(header.getByRole('link', { name: 'Создать встречу' })).toBeVisible();
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
    await page.screenshot({
      path: `test-results/home-list-${width}.png`,
      fullPage: true,
    });
  });
}

test('details stay in one surface when resizing the meeting', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page, 'Саша');
  const created = await apiCreate(page, 'Детали без повторов');
  await page.goto(`/meetings/${created.meeting.id}`);
  const info = page.getByRole('button', { name: 'Информация о встрече' });
  const when = page.getByRole('term').filter({ hasText: 'Когда' });
  const dialog = page.getByRole('dialog', { name: 'Детали встречи' });
  await expect(
    page.getByRole('heading', { name: 'Детали без повторов', exact: true }),
  ).toHaveCount(1);
  await expect(page.getByTestId('details-sidebar')).toBeVisible();
  await expect(info).toHaveCount(0);
  await expect(when).toHaveCount(1);
  await page.setViewportSize({ width: 390, height: 900 });
  await expect(page.getByTestId('details-sidebar')).toHaveCount(0);
  await expect(when).toHaveCount(0);
  await info.click();
  await expect(dialog).toBeVisible();
  await expect(when).toHaveCount(1);
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(dialog).not.toBeVisible();
  await expect(info).toHaveCount(0);
  await expect(page.getByTestId('details-sidebar')).toBeVisible();
  await expect(when).toHaveCount(1);
  await page.setViewportSize({ width: 390, height: 900 });
  await expect(dialog).toBeVisible();
  await expect(when).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
});

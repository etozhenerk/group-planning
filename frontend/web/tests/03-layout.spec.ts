import { test, expect } from '@playwright/test';
import { apiCreate, login } from '@tests/helpers';

for (const width of [320, 390, 768, 1440]) {
  test(`layout and keyboard at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Кто придёт');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(36, 37, 42)');
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'К содержимому' })).toBeFocused();
    await page.screenshot({
      path: `test-results/onboarding-${width}.png`,
      fullPage: true,
    });
    await login(page, 'Саша');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(36, 37, 42)');
    const created = await apiCreate(page, `Раскладка ${width}`);
    await page.goto(`/meetings/${created.meeting.id}`);
    await expect(page.getByLabel('Сообщение', { exact: true })).toBeVisible();
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(36, 37, 42)');
    const size = await page
      .getByRole('button', { name: 'Отправить сообщение' })
      .boundingBox();

    expect(size?.width).toBeGreaterThanOrEqual(44);
    expect(size?.height).toBeGreaterThanOrEqual(44);
    expect((size?.y ?? 0) + (size?.height ?? 0)).toBeLessThanOrEqual(900);
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
    const title = await page.getByTestId('conversation-title').boundingBox();
    const share = page
      .locator('header')
      .getByRole('button', { name: 'Пригласить друзей', exact: true });

    const info = page.getByRole('button', { name: 'Информация о встрече' });

    for (const action of [share, info]) {
      const bounds = await action.boundingBox();
      const center = (bounds?.y ?? 0) + (bounds?.height ?? 0) / 2;
      expect(center).toBeCloseTo((title?.y ?? 0) + (title?.height ?? 0) / 2, 0);
    }

    const add = page.getByRole('button', { name: 'Добавить к встрече' });
    const addBounds = await add.boundingBox();
    const plus = await add.locator('svg').boundingBox();
    expect(plus?.width).toBe(24);
    expect(plus?.height).toBe(24);
    expect((plus?.x ?? 0) + 12).toBeCloseTo((addBounds?.x ?? 0) + 22, 0);
    expect((plus?.y ?? 0) + 12).toBeCloseTo((addBounds?.y ?? 0) + 22, 0);
    const shareIcon = await share.locator('svg').boundingBox();
    expect(shareIcon?.width).toBe(20);
    expect(shareIcon?.height).toBe(20);

    if (width < 740) {
      const shareBounds = await share.boundingBox();
      expect((shareIcon?.x ?? 0) + 10).toBeCloseTo((shareBounds?.x ?? 0) + 22, 0);
    }

    const system = page
      .getByTestId('system-event')
      .filter({ hasText: 'Саша создал встречу' });

    await expect(system).toHaveCSS('text-align', 'center');
    await expect(system.locator('img')).toHaveCount(0);
    await expect(page.getByTestId('feed-message')).toHaveCount(0);

    await share.click();
    const invitation = page.getByRole('main');
    await expect(page.getByRole('heading', { name: 'Пригласить друзей' })).toBeVisible();
    await expect(invitation).toBeVisible();
    const copy = invitation.getByRole('button', { name: 'Скопировать ссылку' });
    await expect(copy).toBeVisible();
    await expect(copy).not.toHaveCSS('font-size', '0px');
    await page.screenshot({
      path: `test-results/share-sheet-${width}.png`,
      fullPage: true,
      animations: 'disabled',
    });
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);

    await page.keyboard.press('Escape');
    await expect(share).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);

    if (width < 1170) {
      await expect(page.getByTestId('details-sidebar')).toHaveCount(0);
      await expect(page.getByRole('term').filter({ hasText: 'Когда' })).toHaveCount(0);
      await info.click();
      await expect(page.getByRole('dialog', { name: 'Детали встречи' })).toBeVisible();
      await expect(page.getByRole('term').filter({ hasText: 'Когда' })).toHaveCount(1);
      await page.keyboard.press('Escape');
      await expect(info).toBeFocused();
    } else {
      await expect(info).toBeVisible();
      await expect(page.getByTestId('details-sidebar')).toBeVisible();
      await expect(page.getByRole('term').filter({ hasText: 'Когда' })).toHaveCount(1);
      await page.getByRole('button', { name: 'Все участники встречи' }).click();
      const dialog = page.getByRole('dialog', { name: 'Детали встречи' });
      await expect(dialog).toBeVisible();
      await expect(
        dialog.getByRole('button', { name: 'Изменить настройки' }),
      ).toBeVisible();
      await page.keyboard.press('Escape');
    }

    await page.screenshot({ path: `test-results/meeting-${width}.png`, fullPage: true });
  });
}

test('dialog respects reduced motion and restores focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await login(page, 'Саша');
  const created = await apiCreate(page, 'Без движения');
  await page.goto(`/meetings/${created.meeting.id}`);
  const info = page.getByRole('button', { name: 'Информация о встрече' });
  await info.click();
  const dialog = page.getByRole('dialog', { name: 'Детали встречи' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveCSS('animation-name', 'none');
  await page.keyboard.press('Escape');
  await expect(info).toBeFocused();
});

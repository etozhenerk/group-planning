import { test, expect } from '@playwright/test';
import { apiCreate, login } from '@tests/helpers';

for (const width of [320, 390, 768, 1440]) {
  test(`layout and keyboard at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Кто придёт');
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'К содержимому' })).toBeFocused();
    await page.screenshot({
      path: `test-results/onboarding-${width}.png`,
      fullPage: true,
    });
    await login(page, 'Саша');
    const created = await apiCreate(page, `Раскладка ${width}`);
    await page.goto(`/meetings/${created.meeting.id}`);
    await expect(page.getByLabel('Сообщение', { exact: true })).toBeVisible();
    const size = await page
      .getByRole('button', { name: 'Отправить сообщение' })
      .boundingBox();

    expect(size?.width).toBeGreaterThanOrEqual(44);
    expect(size?.height).toBeGreaterThanOrEqual(44);
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
    await page.getByRole('button', { name: 'Информация о встрече' }).click();
    await expect(page.getByRole('dialog', { name: 'Детали встречи' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(
      page.getByRole('button', { name: 'Информация о встрече' }),
    ).toBeFocused();
    await page.screenshot({ path: `test-results/meeting-${width}.png`, fullPage: true });
  });
}

import { expect, test } from '@playwright/test';
import { login } from '@tests/helpers';

for (const width of [390, 1440]) {
  test(`profile service return and FAQ disclosure work at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await login(page, 'Саша');
    await page.getByRole('link', { name: 'Профиль', exact: true }).click();
    await page.getByRole('link', { name: 'Помощь', exact: true }).click();
    const questions = page.locator('button[aria-expanded][aria-controls]');
    const second = questions.nth(1);
    await expect(second).toHaveAttribute('aria-expanded', 'false');
    const answer = page.locator(`[id="${await second.getAttribute('aria-controls')}"]`);
    await expect(answer).toHaveAttribute('aria-hidden', 'true');
    await second.click();
    await expect(second).toHaveAttribute('aria-expanded', 'true');
    await expect(answer).toHaveCSS('opacity', '1');
    expect(await answer.evaluate((node) => node.clientHeight)).toBeGreaterThan(0);
    await second.click();
    await expect(answer).toHaveAttribute('aria-hidden', 'true');
    await expect(answer).toHaveCSS('opacity', '0');
    await page.getByRole('link', { name: 'Задать вопрос ↗', exact: true }).click();
    await page.getByRole('link', { name: /Назад/ }).click();
    await expect(page).toHaveURL(/\/help$/);
    await page.getByRole('link', { name: /Назад/ }).click();
    await expect(page).toHaveURL(/\/profile$/);
    await expect(
      page.getByRole('button', { name: 'Удалить аккаунт', exact: true }),
    ).toHaveCount(0);
    await page.getByRole('link', { name: 'Cookie', exact: true }).click();
    await page.getByRole('link', { name: /Назад/ }).click();
    await expect(page).toHaveURL(/\/profile$/);
    await page.getByRole('link', { name: 'О приложении', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'О приложении', exact: true }),
    ).toHaveCount(1);
    await page.getByRole('link', { name: 'Сообщить о проблеме ↗', exact: true }).click();
    await page.getByRole('link', { name: /Назад/ }).click();
    await expect(page).toHaveURL(/\/about$/);
    await page.getByRole('link', { name: /Назад/ }).click();
    await expect(page).toHaveURL(/\/profile$/);
  });
}

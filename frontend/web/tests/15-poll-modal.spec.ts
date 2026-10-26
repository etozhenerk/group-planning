import { expect, test } from '@playwright/test';
import { actionSurface, apiCreate, login } from '@tests/helpers';

for (const width of [320, 390, 1440]) {
  test(`date action adapts to sheet, preserves draft, handles calendar and validation at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await login(page, 'Саша');
    const { meeting } = await apiCreate(
      page,
      'Дата в панели',
      '2026-10-24T19:00:00+03:00',
    );

    await page.goto(`/meetings/${meeting.id}`);
    const open = page.getByRole('button', { name: 'Добавить к встрече' });
    await page.getByLabel('Сообщение', { exact: true }).fill('Черновик разговора');
    await open.click();
    await page.getByRole('menuitem', { name: 'Предложить дату', exact: true }).click();
    const screen = actionSurface(page, 'Предложить дату');
    await expect(screen).toBeVisible();
    await expect(page).toHaveURL(/action=date$/);
    await expect(page.getByRole('dialog')).toHaveCount(width < 740 ? 1 : 0);
    await expect(page.locator('body')).toHaveCSS(
      'position',
      width < 740 ? 'fixed' : 'static',
    );
    await expect(
      page.getByRole('navigation', { name: 'Основная навигация' }),
    ).toBeVisible({ visible: width >= 740 });
    await expect(screen.getByRole('checkbox')).toHaveCount(5);
    const first = screen.getByRole('combobox', { name: 'Вариант 1', exact: true });
    await first.click();
    const popup = page.locator('.g-popup').filter({ has: page.getByRole('grid') });
    await expect(popup).toBeVisible();
    const bounds = await popup.boundingBox();
    expect(bounds?.x).toBeGreaterThanOrEqual(0);
    expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(width);
    await popup.getByRole('button', { name: /27 октября 2026/ }).click();
    await expect(first).toHaveValue(/27.*10.*2026/);
    await screen.getByRole('button', { name: 'Добавить вариант' }).click();
    await screen.getByRole('button', { name: 'Создать опрос', exact: true }).click();
    const third = screen.getByRole('combobox', { name: 'Вариант 3', exact: true });
    await expect(third).toBeFocused();
    await expect(third).toHaveAttribute('aria-invalid', 'true');
    await expect(
      screen.getByRole('alert').filter({ hasText: 'Выберите дату.' }),
    ).toBeInViewport();
    await third.click();
    await popup.getByRole('button', { name: /27 октября 2026/ }).click();
    await screen.getByRole('button', { name: 'Создать опрос', exact: true }).click();
    await expect(
      screen.getByRole('alert').filter({ hasText: 'Эта дата уже есть в опросе.' }),
    ).toBeInViewport();
    await screen.getByRole('button', { name: 'Удалить вариант 3' }).click();
    await expect(third).toHaveCount(0);
    await screen
      .getByRole('button', { name: width < 740 ? 'Закрыть' : 'Назад', exact: true })
      .click();
    await expect(page.getByLabel('Сообщение', { exact: true })).toHaveValue(
      'Черновик разговора',
    );
    await expect(open).toBeFocused();
    await open.click();
    await page.getByRole('menuitem', { name: 'Предложить дату', exact: true }).click();
    await expect(first).toHaveValue(/27.*10.*2026/);
    await first.press('Alt+ArrowDown');
    await expect(popup).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(popup).not.toBeVisible();
    await expect(screen).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(screen).not.toBeVisible();
    await expect(open).toBeFocused();
    await page.goForward();
    await expect(screen).toBeVisible();
    await expect(first).toHaveValue(/27.*10.*2026/);
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
    await page.screenshot({
      path: `test-results/action-date-${width}.png`,
      fullPage: true,
      animations: 'disabled',
    });
  });
}

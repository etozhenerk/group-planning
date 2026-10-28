import { expect, test } from '@playwright/test';
import { apiCreate, login } from '@tests/helpers';

for (const width of [390, 1440]) {
  test(`pointer modal and picker return focus without a ring; keyboard keeps it at ${width}`, async ({
    page,
    browserName,
  }) => {
    await page.setViewportSize({ width, height: 874 });
    await login(page, 'Саша');
    const { meeting } = await apiCreate(page, 'Фокус по способу ввода');
    await page.goto(`/meetings/${meeting.id}`);
    const composer = page.getByLabel('Сообщение', { exact: true });
    await composer.fill('Черновик перед открытием');
    await composer.press('End');
    const plus = page.getByRole('button', { name: 'Добавить к встрече', exact: true });
    await plus.click();
    await page.getByRole('menuitem', { name: 'Файл', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Отправить файл', exact: true });
    await expect(dialog).toHaveAttribute('data-motion', 'open');
    const close = dialog.getByRole('button', { name: 'Закрыть', exact: true });
    const choose = dialog.getByRole('button', { name: 'Выбрать файлы', exact: true });
    await expect(close).toBeFocused();
    await expect(close).toHaveCSS('outline-style', 'none');
    const opened = page.waitForEvent('filechooser');
    await choose.click();
    await (await opened).setFiles([]);
    // The native chooser is intercepted; dispatch its documented cancel signal.
    await dialog.locator('input[type=file]').dispatchEvent('cancel', { bubbles: true });
    await expect(dialog).toBeVisible();
    await expect(choose).toBeFocused();
    await expect(choose).toHaveCSS('outline-style', 'none');
    await close.click();
    await expect(dialog).not.toBeVisible();
    await expect(plus).toBeFocused();
    await expect(plus).toHaveCSS('outline-style', 'none');
    await expect(composer).toHaveValue('Черновик перед открытием');
    await plus.press('Enter');
    const first = page.getByRole('menuitem', { name: 'Фото', exact: true });
    await expect(first).toBeFocused();
    await expect(first).toHaveCSS('outline-style', 'solid');
    await first.press('ArrowDown');
    const file = page.getByRole('menuitem', { name: 'Файл', exact: true });
    await expect(file).toBeFocused();
    await expect(file).toHaveCSS('outline-style', 'solid');
    await file.press('Enter');
    await expect(dialog).toHaveAttribute('data-motion', 'open');
    await expect(close).toBeFocused();
    await expect(close).toHaveCSS('outline-style', 'solid');
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
    await expect(choose).toBeFocused();
    await expect(choose).toHaveCSS('outline-style', 'solid');
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(plus).toBeFocused();
    await expect(plus).toHaveCSS('outline-style', 'solid');
  });
}
